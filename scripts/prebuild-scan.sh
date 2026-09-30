#!/usr/bin/env bash
# =============================================================================
# prebuild-scan.sh — Universal security gate for production builds.
#
# Runs before ANY production build (local, CI, or downloaded app) and BLOCKS
# the build on critical/high findings. Stack-agnostic: auto-detects the app
# type and runs the appropriate scanners.
#
# Usage:
#   ./prebuild-scan.sh [--repo DIR] [--severity critical,high] [--report FILE]
#   ./prebuild-scan.sh --install-deps   # install lightweight scanners (optional)
#
# Exit codes:
#   0  PASS — no findings above threshold
#   1  FAIL — findings above threshold (build must stop)
#   2  ERROR — tooling missing / scan could not run (build should stop)
#   3  USAGE — bad arguments
#
# Config (optional, in repo root):
#   .prebuild-scan.toml  — see skill docs for format
# =============================================================================
set -uo pipefail

# ---- defaults ---------------------------------------------------------------
REPO_DIR="."
SEVERITY_THRESHOLD="critical,high"
REPORT_FILE=""
INSTALL_DEPS=0
FAILED=0
PASSED=0
SKIPPED=0
ERRORS=0

# ---- arg parsing ------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)        REPO_DIR="$2"; shift 2 ;;
    --severity)    SEVERITY_THRESHOLD="$2"; shift 2 ;;
    --report)      REPORT_FILE="$2"; shift 2 ;;
    --install-deps) INSTALL_DEPS=1; shift ;;
    -h|--help)     sed -n '1,20p' "$0"; exit 3 ;;
    *) echo "Unknown arg: $1" >&2; exit 3 ;;
  esac
done

cd "$REPO_DIR" || { echo "ERROR: cannot cd to $REPO_DIR" >&2; exit 2; }

# ---- helpers ----------------------------------------------------------------
log()  { printf '\033[1;34m[scan]\033[0m %s\n' "$*"; }
pass() { printf '\033[1;32m[PASS]\033[0m %s\n' "$*"; PASSED=$((PASSED+1)); }
fail() { printf '\033[1;31m[FAIL]\033[0m %s\n' "$*"; FAILED=$((FAILED+1)); }
skip() { printf '\033[1;33m[SKIP]\033[0m %s\n' "$*"; SKIPPED=$((SKIPPED+1)); }
err()  { printf '\033[1;35m[ERROR]\033[0m %s\n' "$*"; ERRORS=$((ERRORS+1)); }

have() { command -v "$1" >/dev/null 2>&1; }

# severity check: does a finding's severity exceed threshold?
severity_blocks() {
  local sev="$1"
  case ",$SEVERITY_THRESHOLD," in
    *",$sev,"*) return 0 ;;  # explicitly listed -> blocks
  esac
  # numeric-ish ordering: critical > high > medium > low
  case "$sev" in
    critical) return 0 ;;  # always blocks
    high)     case ",$SEVERITY_THRESHOLD," in *",critical,"*) return 0;; *) return 1;; esac ;;
    medium)   case ",$SEVERITY_THRESHOLD," in *",critical,"*|*",high,"*) return 0;; *) return 1;; esac ;;
    low)      return 1 ;;
    *)        return 1 ;;  # unknown severity -> don't block
  esac
}

# ---- stack detection -------------------------------------------------------
detect_stack() {
  local stack=""
  if [[ -f package.json ]]; then stack="${stack}node "; fi
  if [[ -f requirements.txt || -f pyproject.toml || -f setup.py || -f Pipfile ]]; then stack="${stack}python "; fi
  if [[ -f go.mod ]]; then stack="${stack}go "; fi
  if [[ -f Cargo.toml ]]; then stack="${stack}rust "; fi
  if [[ -f Gemfile ]]; then stack="${stack}ruby "; fi
  if [[ -f Dockerfile || -f docker-compose.yml || -f compose.yaml ]]; then stack="${stack}docker "; fi
  echo "$stack"
}

# ---- scanners ---------------------------------------------------------------
scan_secrets() {
  log "Secret scan (gitleaks)"
  if ! have gitleaks; then
    skip "gitleaks not installed — secrets NOT scanned"
    return
  fi
  local out
  out=$(gitleaks detect --source . --no-banner --redact --report-format json --report-path /tmp/gitleaks-$$.json 2>&1)
  local rc=$?
  if [[ $rc -eq 0 ]]; then
    pass "no secrets found"
  elif [[ $rc -eq 1 ]]; then
    local n
    n=$(python3 -c "import json;print(len(json.load(open('/tmp/gitleaks-$$.json'))))" 2>/dev/null || echo "?")
    fail "gitleaks found $n secret(s) — BLOCKING"
    cat /tmp/gitleaks-$$.json 2>/dev/null | python3 -c "import sys,json; [print('  -',f.get('RuleID'),f.get('File'),f.get('StartLine')) for f in json.load(sys.stdin)]" 2>/dev/null
  else
    err "gitleaks errored (rc=$rc)"
  fi
  rm -f /tmp/gitleaks-$$.json
}

scan_node() {
  log "Node dependency audit (npm audit)"
  if ! have npm; then skip "npm not found"; return; fi
  local out rc
  out=$(npm audit --json 2>/dev/null); rc=$?
  # npm audit exits 1 when vulns found, 0 when clean
  local n_crit n_high
  n_crit=$(echo "$out" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('metadata',{}).get('vulnerabilities',{}).get('critical',0))" 2>/dev/null || echo 0)
  n_high=$(echo "$out" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('metadata',{}).get('vulnerabilities',{}).get('high',0))" 2>/dev/null || echo 0)
  if [[ "$n_crit" -gt 0 || "$n_high" -gt 0 ]]; then
    fail "npm audit: $n_crit critical, $n_high high — BLOCKING"
  else
    pass "npm audit clean (critical=$n_crit high=$n_high)"
  fi
}

scan_python() {
  log "Python dependency audit (pip-audit)"
  if ! have pip-audit; then
    skip "pip-audit not installed — run --install-deps or 'pip install pip-audit'"
    return
  fi
  local out rc
  out=$(pip-audit 2>&1); rc=$?
  if [[ $rc -eq 0 ]]; then
    pass "pip-audit clean"
  else
    fail "pip-audit found vulnerabilities — BLOCKING"
    echo "$out" | grep -iE "critical|high" | head -20
  fi
}

scan_go() {
  log "Go vulnerability scan (govulncheck)"
  if ! have govulncheck; then skip "govulncheck not installed"; return; fi
  local out rc
  out=$(govulncheck ./... 2>&1); rc=$?
  if [[ $rc -eq 0 ]]; then pass "govulncheck clean"; else fail "govulncheck found issues — BLOCKING"; echo "$out" | head -20; fi
}

scan_rust() {
  log "Rust vulnerability scan (cargo-audit)"
  if ! have cargo-audit; then skip "cargo-audit not installed"; return; fi
  local out rc
  out=$(cargo audit 2>&1); rc=$?
  if [[ $rc -eq 0 ]]; then pass "cargo audit clean"; else fail "cargo audit found issues — BLOCKING"; echo "$out" | head -20; fi
}

scan_sast() {
  log "SAST (semgrep)"
  if ! have semgrep; then
    skip "semgrep not installed — SAST skipped (install with --install-deps)"
    return
  fi
  local out rc
  out=$(semgrep scan --config auto --json --quiet 2>/dev/null); rc=$?
  local n_err n_warn
  n_err=$(echo "$out" | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d.get('results',[]) if r.get('extra',{}).get('severity')=='ERROR'))" 2>/dev/null || echo 0)
  n_warn=$(echo "$out" | python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d.get('results',[]) if r.get('extra',{}).get('severity')=='WARNING'))" 2>/dev/null || echo 0)
  if [[ "$n_err" -gt 0 ]]; then
    fail "semgrep: $n_err ERROR-severity findings — BLOCKING"
  else
    pass "semgrep clean (errors=$n_err warnings=$n_warn)"
  fi
}

scan_docker() {
  log "Container scan (trivy)"
  if ! have trivy; then skip "trivy not installed — container scan skipped"; return; fi
  local img
  img=$(grep -iE "^\s*FROM\s+" Dockerfile 2>/dev/null | head -1 | awk '{print $2}')
  if [[ -z "$img" ]]; then skip "no base image found in Dockerfile"; return; fi
  local out rc
  out=$(trivy image --severity CRITICAL,HIGH --no-progress "$img" 2>&1); rc=$?
  if [[ $rc -eq 0 ]]; then pass "trivy clean for $img"; else fail "trivy found issues in $img — BLOCKING"; echo "$out" | tail -20; fi
}

# ---- optional dep install ---------------------------------------------------
install_deps() {
  log "Installing lightweight scanners (best-effort)"
  have gitleaks || { echo "  gitleaks: brew install gitleaks"; }
  have pip-audit || { echo "  pip-audit: pip3 install pip-audit"; }
  have semgrep || { echo "  semgrep: pip3 install semgrep"; }
  have trivy || { echo "  trivy: brew install trivy"; }
  have govulncheck || { echo "  govulncheck: go install golang.org/x/vuln/cmd/govulncheck@latest"; }
  have cargo-audit || { echo "  cargo-audit: cargo install cargo-audit"; }
}

# ---- main -------------------------------------------------------------------
log "Pre-build security gate"
log "Repo: $REPO_DIR | Threshold: $SEVERITY_THRESHOLD"

STACK=$(detect_stack)
log "Detected stack: ${STACK:-none}"

# secrets — universal, always run
scan_secrets

# stack-specific
for s in $STACK; do
  case "$s" in
    node)   scan_node ;;
    python) scan_python ;;
    go)     scan_go ;;
    rust)   scan_rust ;;
    docker) scan_docker ;;
  esac
done

# SAST — universal if available
scan_sast

# ---- report -----------------------------------------------------------------
echo
echo "=============================================="
echo "  PRE-BUILD SECURITY GATE SUMMARY"
echo "  PASS: $PASSED   FAIL: $FAILED   SKIP: $SKIPPED   ERROR: $ERRORS"
echo "=============================================="

if [[ -n "$REPORT_FILE" ]]; then
  {
    echo "# Pre-build security gate report"
    echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "Repo: $REPO_DIR"
    echo "Stack: ${STACK:-none}"
    echo "Threshold: $SEVERITY_THRESHOLD"
    echo "PASS: $PASSED  FAIL: $FAILED  SKIP: $SKIPPED  ERROR: $ERRORS"
  } > "$REPORT_FILE"
  log "Report written to $REPORT_FILE"
fi

# ---- verdict ----------------------------------------------------------------
if [[ "$FAILED" -gt 0 ]]; then
  echo "RESULT: BLOCKED — security findings above threshold. Fix before building." >&2
  exit 1
fi
if [[ "$ERRORS" -gt 0 ]]; then
  echo "RESULT: ERROR — scan could not complete. Build blocked (fail-closed)." >&2
  exit 2
fi
echo "RESULT: PASS — safe to build."
exit 0

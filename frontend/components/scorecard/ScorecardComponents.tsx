"use client";

import { useState } from "react";
import { colors, spacing, radius, typography } from "@/lib/design-tokens";
import { SignalRow, confidencePercent, type SignalRowItem } from "./SignalRow";
import { EvidenceDrawer, type EvidenceDrawerData } from "./EvidenceDrawer";

export type FactorStatus = 'excellent' | 'good' | 'fair' | 'needs_attention' | 'critical' | 'pending_observation';

export interface SubSignal {
  id: string;
  name: string;
  score: number | null;
  status: FactorStatus;
  evidence: string[];
}

// ── RIST-RDI-007 Discovery Signal layer (additive; all optional) ──

export type SignalStatus = 'measured' | 'partial' | 'pending_observation' | 'not_applicable' | 'stale';

/** A normalized discovery signal (spec §3). confidence is 0..1. */
export interface DiscoverySignal {
  id?: string;
  restaurantId?: string;
  factorId?: string;
  signalKey: string;
  label: string;
  description?: string;
  status: SignalStatus;
  rawValue?: unknown;
  normalizedValue?: number;
  normalizedScale?: { min: number; max: number };
  scoreContribution?: number;
  weight?: number;
  /** 0..1 signal confidence. */
  confidence?: number;
  observedAt?: string;
  evidenceRefs?: string[];
  methodologyVersion?: string;
}

/** Per-status signal accounting (spec §10). */
export interface FactorCoverageDetail {
  totalSignals: number;
  measured: number;
  partial: number;
  pending: number;
  notApplicable: number;
  stale: number;
}

/** Restaurant-level signal model summary (brief §1). */
export interface SignalModelSummary {
  restaurantId?: string;
  methodologyVersion?: string;
  supportedSignals?: number;
  observedSignals?: number;
  pendingSignals?: number;
  notApplicableSignals?: number;
  staleSignals?: number;
  factors?: number;
  realSourcesOnly?: boolean;
  syntheticInputs?: number;
  manualOverrides?: number;
}

export interface FactorScore {
  id: string; name: string; description: string;
  score: number | null; status: FactorStatus;
  trend: 'up' | 'down' | 'stable' | null;
  confidence: number | null; lastUpdated: string | null;
  businessImpact: string; evidenceCount: number;
  subSignals: SubSignal[];
  connectorRequired?: string;
  recommendedActions: string[]; expectedImprovement: string;

  // ── RIST-RDI-007 additive signal layer (optional; degrade gracefully) ──
  signals?: DiscoverySignal[];
  coverage?: { measured: number; total: number };
  coverageDetail?: FactorCoverageDetail;
  measuredSignalCount?: number;
  totalSignalCount?: number;
  pendingSignalCount?: number;
  notApplicableCount?: number;
  staleCount?: number;
  lastObservedAt?: string | null;
}

export interface CategoryScore {
  id: string; name: string; description: string;
  score: number | null; factors: FactorScore[];
  healthyCount: number; attentionCount: number; criticalCount: number; pendingCount: number;
  trend: 'up' | 'down' | 'stable' | null; confidence: number | null;
}

export interface ScorecardData {
  restaurantId: string; restaurantName: string;
  overallScore: number | null; overallStatus: FactorStatus;
  categories: CategoryScore[];
  totalFactors: number; liveFactors: number; pendingFactors: number;
  lastUpdated: string;
  /** RIST-RDI-007 additive restaurant-level signal-model summary. */
  signalModel?: SignalModelSummary;
}

function statusColor(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return colors.success;
    case 'good': return colors.primary;
    case 'fair': return colors.warning;
    case 'needs_attention': return colors.dangerLight;
    case 'critical': return colors.danger;
    case 'pending_observation': return colors.mutedDarker;
  }
}

export { statusColor };

function statusBg(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return colors.successLight;
    case 'good': return colors.primaryLight;
    case 'fair': return colors.warningLight;
    case 'needs_attention': return `${colors.dangerLight}20`;
    case 'critical': return colors.dangerLight;
    case 'pending_observation': return colors.border;
  }
}

function statusLabel(status: FactorStatus): string {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Good';
    case 'fair': return 'Fair';
    case 'needs_attention': return 'Needs Attention';
    case 'critical': return 'Critical';
    case 'pending_observation': return 'Pending Observation';
  }
}

export function MasterScore({ score, status, liveFactors, totalFactors, lastUpdated }: {
  score: number | null; status: FactorStatus; liveFactors: number; totalFactors: number; lastUpdated?: string | null;
}) {
  const freshness = lastUpdated ? formatFreshness(lastUpdated) : null;
  return (
    <div style={{ textAlign: 'center', padding: spacing['3xl'], background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <p style={{ ...typography.label, margin: 0, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restaurant Intelligence</p>
      <p style={{ margin: `${spacing.md} 0 0`, fontSize: '4rem', fontWeight: 700, lineHeight: 1, color: score !== null ? statusColor(status) : colors.mutedDarker }}>
        {score !== null ? score : '—'}
        <span style={{ fontSize: '1.5rem', color: colors.mutedDarker }}>/100</span>
      </p>
      <span style={{ display: 'inline-block', marginTop: spacing.md, padding: `${spacing.xs} ${spacing.lg}`, borderRadius: radius.full, fontSize: '0.8125rem', fontWeight: 600, background: statusBg(status), color: statusColor(status) }}>
        {statusLabel(status)}
      </span>
      <p style={{ ...typography.small, margin: `${spacing.md} 0 0`, color: colors.mutedDarker }}>
        {liveFactors} of {totalFactors} factors measured · {totalFactors - liveFactors} pending
      </p>
      {freshness && (
        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
          Last updated {freshness}
        </p>
      )}
    </div>
  );
}

// ── Category score strip (5 compact cards in a row) ──
export function CategoryScoreStrip({ categories, onSelect }: {
  categories: CategoryScore[]; onSelect?: (id: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: spacing.md }}>
      {categories.map((cat) => {
        const isPending = cat.score === null;
        const color = isPending ? colors.mutedDarker : statusColor(cat.factors.find(f => f.status !== 'pending_observation')?.status || 'pending_observation');
        return (
          <div
            key={cat.id}
            onClick={() => onSelect?.(cat.id)}
            style={{
              padding: spacing.lg, background: colors.surface, borderRadius: radius.lg,
              border: `1px solid ${colors.border}`, cursor: onSelect ? 'pointer' : 'default',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat.name}</p>
            <p style={{ margin: `${spacing.sm} 0 0`, fontSize: '2rem', fontWeight: 700, lineHeight: 1, color }}>
              {isPending ? '—' : cat.score}
            </p>
            {/* Mini status bar */}
            <div style={{ display: 'flex', gap: 2, marginTop: spacing.sm }}>
              {cat.healthyCount > 0 && <div style={{ flex: cat.healthyCount, height: 3, background: colors.success, borderRadius: 2 }} />}
              {cat.attentionCount > 0 && <div style={{ flex: cat.attentionCount, height: 3, background: colors.warning, borderRadius: 2 }} />}
              {cat.criticalCount > 0 && <div style={{ flex: cat.criticalCount, height: 3, background: colors.danger, borderRadius: 2 }} />}
              {cat.pendingCount > 0 && <div style={{ flex: cat.pendingCount, height: 3, background: colors.mutedDarker, borderRadius: 2, opacity: 0.3 }} />}
            </div>
            <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>
              {cat.healthyCount} healthy · {cat.pendingCount} pending
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ── Expandable factor card with sub-signals, evidence, confidence, freshness ──
export function ExpandableFactorCard({ factor, expanded, onToggle }: {
  factor: FactorScore; expanded: boolean; onToggle: (id: string) => void;
}) {
  const isPending = factor.status === 'pending_observation';
  const [evidence, setEvidence] = useState<EvidenceDrawerData | null>(null);

  const signals = factor.signals ?? [];

  const openEvidence = (sig: DiscoverySignal) => {
    setEvidence({
      label: sig.label,
      description: sig.description,
      sourceName: sig.evidenceRefs?.[0],
      observedAt: sig.observedAt,
      confidence: sig.confidence,
      methodologyVersion: sig.methodologyVersion,
      evidenceRefs: sig.evidenceRefs,
    });
  };

  return (
    <div
      style={{
        padding: spacing.lg, background: colors.surface, borderRadius: radius.lg,
        border: `1px solid ${isPending ? colors.border : statusBg(factor.status)}`,
        cursor: 'pointer', transition: 'border-color 0.15s',
        opacity: isPending ? 0.75 : 1,
      }}
      onClick={() => { onToggle(factor.id); setEvidence(null); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text, flex: 1 }}>{factor.name}</p>
        {isPending ? (
          <span style={{ padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, fontSize: '0.625rem', fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
        ) : (
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: statusColor(factor.status) }}>{factor.score}</span>
        )}
      </div>
      <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker }}>{factor.description}</p>

      {/* Evidence / confidence / freshness row */}
      {!isPending && (
        <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xs }}>
          {factor.trend && <span style={{ ...typography.caption, color: factor.trend === 'up' ? colors.success : factor.trend === 'down' ? colors.danger : colors.muted }}>{factor.trend === 'up' ? '↑' : factor.trend === 'down' ? '↓' : '→'}</span>}
          {factor.confidence !== null && <span style={{ ...typography.caption, color: colors.muted }}>{factor.confidence}% confidence</span>}
          {factor.evidenceCount > 0 && <span style={{ ...typography.caption, color: colors.muted }}>{factor.evidenceCount} sources</span>}
          {signals.length > 0 && <span style={{ ...typography.caption, color: colors.muted }}>{signals.length} signals</span>}
          {factor.lastUpdated && <span style={{ ...typography.caption, color: colors.muted }}>· {formatFreshness(factor.lastUpdated)}</span>}
        </div>
      )}
      {isPending && factor.connectorRequired && (
        <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>Requires: {factor.connectorRequired}</p>
      )}

      {/* Expandable sub-signals */}
      {expanded && (
        <div style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
            <button type="button" aria-label="✕" onClick={(e) => { e.stopPropagation(); onToggle(factor.id); }} style={{ border: "none", background: "transparent", color: colors.mutedDarker, cursor: "pointer", fontSize: "1rem", padding: 0 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: spacing.sm, marginBottom: spacing.md }}>
            <div style={{ padding: spacing.sm, background: colors.bg, borderRadius: radius.md }}>
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Current Score</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: '1rem', fontWeight: 700, color: colors.text }}>{factor.score !== null ? factor.score : '—'}</p>
            </div>
            <div style={{ padding: spacing.sm, background: colors.bg, borderRadius: radius.md }}>
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Business Impact</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: '0.75rem', color: colors.text }}>{factor.businessImpact}</p>
            </div>
            <div style={{ padding: spacing.sm, background: colors.bg, borderRadius: radius.md }}>
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Expected Improvement</p>
              <p style={{ margin: `${spacing.xs} 0 0`, fontSize: '0.75rem', color: colors.text }}>{factor.expectedImprovement}</p>
            </div>
          </div>

          {/* Signal drill-down (spec §21) — each signal is a reusable SignalRow */}
          {signals.length > 0 ? (
            <div style={{ marginBottom: spacing.md }}>
              <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Signals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {signals.map((s) => (
                  <SignalRow
                    key={s.signalKey || s.id}
                    signal={{
                      id: s.id,
                      label: s.label,
                      description: s.description,
                      status: s.status,
                      rawValue: s.rawValue,
                      normalizedValue: s.normalizedValue,
                      confidence: s.confidence,
                      evidenceRefs: s.evidenceRefs,
                    } as SignalRowItem}
                    onEvidenceClick={() => openEvidence(s)}
                  />
                ))}
              </div>
            </div>
          ) : (
            (factor.subSignals.length > 0 ? null : (
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>No sub-signals for this factor.</p>
            ))
          )}

          {/* Legacy v1.0 sub-signals kept as evidence (only rendered when no signal layer) */}
          {signals.length === 0 && factor.subSignals.length > 0 && (
            <>
              <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Sub-Signals</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {factor.subSignals.map((s) => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: spacing.sm, background: colors.bg, borderRadius: radius.md }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: colors.text }}>{s.name}</p>
                      {s.evidence.length > 0 && (
                        <ul style={{ margin: `${spacing.xs} 0 0`, paddingLeft: spacing.lg, fontSize: '0.625rem', color: colors.mutedDarker }}>
                          {s.evidence.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      )}
                      {s.evidence.length === 0 && (
                        <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker, fontStyle: 'italic' }}>No evidence yet</p>
                      )}
                    </div>
                    <span style={{ marginLeft: spacing.sm, fontSize: '0.8125rem', fontWeight: 700, color: s.score !== null ? statusColor(s.status) : colors.mutedDarker }}>
                      {s.score !== null ? s.score : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recommended actions */}
          {factor.recommendedActions.length > 0 && (
            <div style={{ marginTop: spacing.md }}>
              <p style={{ ...typography.caption, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>Recommended Actions</p>
              <ul style={{ margin: 0, paddingLeft: spacing.lg, fontSize: '0.6875rem', color: colors.muted }}>
                {factor.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Evidence drawer (spec §23) — dismissible, full-width on mobile */}
      <EvidenceDrawer data={evidence} onClose={() => setEvidence(null)} />
    </div>
  );
}

// ── Problem factors (top 3-5 needs_attention / critical) ──
export function ProblemFactors({ factors, onSelect }: {
  factors: FactorScore[]; onSelect: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const problems = factors
    .filter((f) => f.status === 'needs_attention' || f.status === 'critical')
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 5);
  if (problems.length === 0) return null;

  const weakAndStrong = (f: FactorScore) => {
    const sigs = f.signals ?? [];
    const measured = sigs.filter((s) => s.status === 'measured' || s.status === 'partial');
    if (measured.length === 0) return null;
    const withScore = measured
      .map((s) => ({ s, score: s.normalizedValue ?? 0 }))
      .sort((a, b) => b.score - a.score);
    const weak = withScore.filter((x) => x.score < 70);
    const strong = withScore.filter((x) => x.score >= 70);
    return { weak, strong, all: withScore };
  };

  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.dangerLight}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.md}`, color: colors.danger }}>⚠️ Priority Opportunities</h3>
      <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        These factors are holding back your score the most. Fixing them delivers the fastest improvement.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
        {problems.map((f) => {
          const detail = weakAndStrong(f);
          const open = expandedId === f.id;
          return (
            <div key={f.id} style={{ background: colors.bg, borderRadius: radius.md }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, cursor: 'pointer' }}
                onClick={() => {
                  setExpandedId(open ? null : f.id);
                  onSelect(f.id);
                }}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{f.name}</p>
                  <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{f.expectedImprovement}</p>
                </div>
                <div style={{ textAlign: 'right', marginLeft: spacing.md }}>
                  <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: statusColor(f.status) }}>{f.score}</p>
                  <span style={{ ...typography.caption, color: f.status === 'critical' ? colors.danger : colors.warning }}>{f.status === 'critical' ? 'Critical' : 'Needs Attention'}</span>
                </div>
              </div>
              {/* Expanded reason: weak AND strong measured signals (spec §34) */}
              {open && detail && (
                <div style={{ padding: `0 ${spacing.md} ${spacing.md}` }}>
                  <div style={{ padding: spacing.md, background: colors.surface, borderRadius: radius.md, border: `1px solid ${colors.border}` }}>
                    <p style={{ ...typography.label, margin: `0 0 ${spacing.sm}`, color: colors.danger }}>Why it is low</p>
                    {detail.weak.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                        {detail.weak.map(({ s, score }) => (
                          <SignalRow key={s.signalKey || s.id} signal={{
                            label: s.label, description: s.description, status: s.status,
                            rawValue: s.rawValue, normalizedValue: s.normalizedValue,
                            confidence: s.confidence, evidenceRefs: s.evidenceRefs,
                          } as SignalRowItem} />
                        ))}
                      </div>
                    ) : (
                      <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>
                        No weak measured signals — all measured signals are performing well.
                      </p>
                    )}
                    {detail.strong.length > 0 && (
                      <>
                        <p style={{ ...typography.label, margin: `${spacing.lg} 0 ${spacing.sm}`, color: colors.success }}>Strong signals</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                          {detail.strong.map(({ s }) => (
                            <SignalRow key={s.signalKey || s.id} signal={{
                              label: s.label, description: s.description, status: s.status,
                              rawValue: s.rawValue, normalizedValue: s.normalizedValue,
                              confidence: s.confidence, evidenceRefs: s.evidenceRefs,
                            } as SignalRowItem} />
                          ))}
                        </div>
                      </>
                    )}
                    {detail.weak.length + detail.strong.length === 0 && (
                      <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>
                        No measured signal detail available for this factor.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pending Observation factors (clearly separated) ──
export function PendingFactors({ factors, onSelect }: {
  factors: FactorScore[]; onSelect: (id: string) => void;
}) {
  const pending = factors.filter((f) => f.status === 'pending_observation');
  if (pending.length === 0) return null;
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px dashed ${colors.border}` }}>
      <h3 style={{ ...typography.h3, margin: `0 0 ${spacing.xs}`, color: colors.mutedDarker }}>Pending Observation</h3>
      <p style={{ ...typography.small, margin: `0 0 ${spacing.lg}`, color: colors.mutedDarker }}>
        These factors need a data connector to be measured. Connect a source to unlock them.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: spacing.sm }}>
        {pending.map((f) => (
          <div key={f.id} style={{ padding: spacing.md, background: colors.bg, borderRadius: radius.md, border: `1px solid ${colors.border}`, cursor: 'pointer', opacity: 0.8 }}
            onClick={() => onSelect(f.id)}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{f.name}</p>
            <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{f.description}</p>
            {f.subSignals.length > 0 && (
              <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>Signals: {f.subSignals.map((s) => s.name).join(', ')}</p>
            )}
            {f.connectorRequired && (
              <p style={{ ...typography.caption, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker, fontStyle: 'italic' }}>Requires: {f.connectorRequired}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Helper: human-readable freshness ──
function formatFreshness(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function FactorCard({ factor, onSelect }: { factor: FactorScore; onSelect?: (id: string) => void }) {
  const isPending = factor.status === 'pending_observation';
  const lowConfidence = !isPending && factor.confidence !== null && factor.confidence < 60;
  const coverage = factor.coverageDetail
    ? { measured: factor.coverageDetail.measured + factor.coverageDetail.partial, total: factor.coverageDetail.totalSignals }
    : factor.coverage;
  const updatedText = factor.lastUpdated ? formatFreshness(factor.lastUpdated) : null;
  return (
    <div
      onClick={() => onSelect?.(factor.id)}
      style={{
        padding: spacing.lg,
        background: colors.surface,
        borderRadius: radius.lg,
        border: `1px solid ${isPending ? colors.border : statusBg(factor.status)}`,
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        opacity: isPending ? 0.7 : 1,
      }}
      onMouseEnter={(e) => { if (onSelect) e.currentTarget.style.borderColor = colors.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isPending ? colors.border : statusBg(factor.status); }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
        <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>{factor.name}</p>
        {isPending ? (
          <span style={{ padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, fontSize: '0.625rem', fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
        ) : (
          <span style={{ fontSize: '1rem', fontWeight: 700, color: statusColor(factor.status) }}>{factor.score}</span>
        )}
      </div>
      <p style={{ ...typography.caption, margin: `0 0 ${spacing.sm}`, color: colors.mutedDarker }}>{factor.description}</p>
      {isPending && factor.connectorRequired && (
        <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker, fontStyle: 'italic' }}>Requires: {factor.connectorRequired}</p>
      )}
      {!isPending && (
        <>
          {/* Confidence / coverage / evidence / freshness — spec §20 */}
          <div style={{ display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.xs }}>
            {coverage && typeof coverage.measured === 'number' && typeof coverage.total === 'number' && coverage.total > 0 && (
              <span style={{ ...typography.caption, color: colors.muted }}>
                Coverage {coverage.measured} / {coverage.total}
              </span>
            )}
            {factor.confidence !== null && (
              <span style={{ ...typography.caption, color: colors.muted }}>{factor.confidence}% confidence</span>
            )}
            {factor.evidenceCount > 0 && <span style={{ ...typography.caption, color: colors.muted }}>{factor.evidenceCount} sources</span>}
            {updatedText && <span style={{ ...typography.caption, color: colors.muted }}>Updated {updatedText}</span>}
          </div>
          {/* Low-confidence: color + text badge (NOT color alone — spec §27) */}
          {lowConfidence && (
            <span style={{ display: 'inline-block', marginTop: spacing.xs, padding: `${spacing.xs} ${spacing.sm}`, borderRadius: radius.sm, fontSize: '0.625rem', fontWeight: 600, background: colors.warningLight, color: colors.warning, border: `1px solid ${colors.warning}33` }}>
              ⚠ Low Confidence
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function CategoryCard({ category, onFactorSelect }: { category: CategoryScore; onFactorSelect?: (id: string) => void }) {
  const isPending = category.score === null;
  return (
    <div style={{ padding: spacing.xl, background: colors.surface, borderRadius: radius.xl, border: `1px solid ${colors.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <div>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.text }}>{category.name}</p>
          <p style={{ ...typography.small, margin: `${spacing.xs} 0 0`, color: colors.mutedDarker }}>{category.description}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isPending ? (
            <span style={{ padding: `${spacing.xs} ${spacing.md}`, borderRadius: radius.sm, fontSize: '0.75rem', fontWeight: 600, background: colors.border, color: colors.mutedDarker }}>Pending</span>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: statusColor(category.factors.find(f => f.status !== 'pending_observation')?.status || 'pending_observation') }}>{category.score}</p>
              <p style={{ ...typography.caption, margin: 0, color: colors.mutedDarker }}>/100</p>
            </>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', gap: spacing.xs, marginBottom: spacing.md }}>
        {category.healthyCount > 0 && <div style={{ flex: category.healthyCount, height: 4, background: colors.success, borderRadius: radius.sm }} title={`${category.healthyCount} healthy`} />}
        {category.attentionCount > 0 && <div style={{ flex: category.attentionCount, height: 4, background: colors.warning, borderRadius: radius.sm }} title={`${category.attentionCount} need attention`} />}
        {category.criticalCount > 0 && <div style={{ flex: category.criticalCount, height: 4, background: colors.danger, borderRadius: radius.sm }} title={`${category.criticalCount} critical`} />}
        {category.pendingCount > 0 && <div style={{ flex: category.pendingCount, height: 4, background: colors.mutedDarker, borderRadius: radius.sm, opacity: 0.3 }} title={`${category.pendingCount} pending`} />}
      </div>

      {/* Factor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: spacing.sm }}>
        {category.factors.map((f) => (
          <FactorCard key={f.id} factor={f} onSelect={onFactorSelect} />
        ))}
      </div>
    </div>
  );
}

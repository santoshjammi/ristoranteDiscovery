// ── Shared API base config (single source of truth, normalized) ──
//
// ROOT-CAUSE FIX for the doubled `/api/api/...` 404s: the codebase was
// inconsistent about whether NEXT_PUBLIC_API_URL ends in `/api`.
// `.env.example` and Docker set it as `http://.../api` (WITH the suffix),
// but every caller appends `/api/...` again → `.../api/api/auth/signin` → 404.
//
// Resolution: this module normalizes the base to the ORIGIN (no trailing
// `/api`) and exports it, so every caller appends `/api` exactly once.
// - If NEXT_PUBLIC_API_URL is `http://host:port/api`, `API` = `http://host:port`
// - If it is `http://host:port` (or unset, default), `API` stays as-is.
// Callers build `${API}/api/...`.

// Raw as supplied by env (or default).
const RAW = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8040";

/** The origin without any `/api` suffix or trailing slash. Callers append `/api`. */
export const API: string = RAW
  .replace(/\/api$/i, "")
  .replace(/\/+$/, "")
  .trim() || "http://localhost:8040";

/** Convenience alias matching the older `API_URL` naming. */
export const API_URL: string = API;

/** Full REST root: `${API}/api` — use when the path below already starts with `/api`. */
export const API_ROOT: string = `${API}/api`;

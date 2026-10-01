// ── E2E environment constants (single source of truth) ───────────────────────
//
// Ports are owned by playwright.config.ts. Override via env when needed, but do
// NOT reintroduce hardcoded localhost URLs in specs: the suite runs on an
// isolated port pair (backend 8400 / frontend 3400) specifically so it can never
// adopt a running container or dev server (see the isolation note in
// playwright.config.ts).
//
// History: specs previously hardcoded `http://localhost:8040`, which forced the
// backend webServer onto 8040 — the port the retired launchd dev daemon held.

export const BACKEND_PORT = Number(process.env.E2E_BACKEND_PORT ?? 8400);
export const FRONTEND_PORT = Number(process.env.E2E_FRONTEND_PORT ?? 3400);

/** Backend origin, no trailing slash. Specs append `/api/...`. */
export const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

/** Frontend origin (Playwright `baseURL`). */
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

/** `${BACKEND_URL}/api` convenience for request fixtures. */
export const BACKEND_API = `${BACKEND_URL}/api`;

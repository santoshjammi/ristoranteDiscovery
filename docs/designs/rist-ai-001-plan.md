# RIST-AI-001 — AI Capability Layer Separation: Architecture Plan & Audit

Status: Approved for implementation
Mission: Separate AI capability layer from Ristorante business logic.
Scope boundary: **RistoranteDiscovery ONLY.** No cross-project framework extraction.

---

## 1. Repository Audit Summary (STEP 1)

The repo is a hybrid: a modern layered architecture (`application/domain/infrastructure/interfaces`)
coexists with a legacy `services/` + `controllers/` tier that owns **all AI code**.

### Current AI dependency graph (before)

```
controllers/ (search, menu, review, faq)
    ├── aiService.generateJSON / generateJSONLight   ← direct provider access (FORBIDDEN shape)
    ├── vectorService.searchSemantic / indexRestaurant
    ├── parserService.parseMenuText / parsePDFMenu
    ├── reviewService.analyzeReviews
    ├── faqService.generateFAQs
    └── seoOptimizerService.auditRestaurant
services/
    ├── ai.service.ts        ← THE provider facade: NVIDIA→OllamaCloud→local cascade + JSON parse + mock
    ├── ai.config.ts         ← env/config for 3 providers
    ├── parser.service.ts    ← AI menu extraction (calls aiService)
    ├── review.service.ts    ← AI review interpretation (calls aiService)
    ├── faq.service.ts       ← AI FAQ generation (calls aiService.generateJSONLight)
    ├── seo-optimizer.service.ts ← AI GBP/landmark audit (calls aiService)
    ├── vector.service.ts    ← DETERMINISTIC keyword-vector RAG (no real embeddings; imports aiService unused)
    ├── scorer.service.ts    ← DETERMINISTIC discoverability score (NO AI calls) ✅
    ├── query-simulator.service.ts ← DETERMINISTIC (NO AI) ✅
    └── schema.service.ts    ← DETERMINISTIC (NO AI) ✅
```

### Complete AI usage inventory

| # | Use-case | File | Direct provider call | Business purpose | Class | Should be AI |
|---|----------|------|---------------------|------------------|-------|--------------|
| 1 | Menu extraction | `services/parser.service.ts:78` | `aiService.generateJSON` | Structure raw menu text → sections/items | **Extraction** | Yes |
| 2 | Review interpretation | `services/review.service.ts:84` | `aiService.generateJSON` | Sentiment, dishes, topics, complaints from reviews | **Interpretation** | Yes |
| 3 | FAQ generation | `services/faq.service.ts:57` | `aiService.generateJSONLight` | Search/voice-optimized FAQs | **Synthesis/Extraction** | Yes |
| 4 | SEO/GBP audit | `services/seo-optimizer.service.ts:71` | `aiService.generateJSON` | Landmarks, neighborhoods, action items | **Synthesis** | Yes |
| 5 | RAG chat synthesis | `controllers/search.controller.ts:70` | `aiService.generateJSON` | Conversational answer + citations | **Conversation** | Yes |
| 6 | Vector search | `controllers/search.controller.ts:31,101` | `vectorService` | Semantic retrieval (deterministic keyword vector) | Retrieval | **Deterministic** (keep) |
| 7 | Vector indexing | `vector.service.ts:78` | `vectorService` | Build/refresh index | Retrieval | **Deterministic** (keep) |
| 8 | Scorer | `services/scorer.service.ts` | none | Legacy discoverability scores | **Deterministic** | Already deterministic ✅ |
| 9 | Query simulator | `services/query-simulator.service.ts` | none | Haversine query probability | **Deterministic** | Already deterministic ✅ |
| 10 | Schema gen | `services/schema.service.ts` | none | JSON-LD generation | **Deterministic** | Already deterministic ✅ |
| 11 | ReviewIntelligenceEngine (modern) | `application/reviews/ReviewIntelligenceEngine.ts` | none | Modern deterministic review insights | **Deterministic** | Already deterministic ✅ |
| 12 | Weekly intelligence | `application/summary/WeeklyIntelligenceService.ts` | none | Deterministic weekly report | **Deterministic** | Already deterministic ✅ |

### Key finding
The **modern domain/application layers are 100% deterministic** — scorecard, benchmarks, trends,
impact sim, decision lifecycle, portfolio, PDF, weekly intelligence. The 25-factor scorecard lives in
`domain/scorecard/` and is fully deterministic. **No scorecard or scoring math depends on AI.**

The AI code is **confined to the legacy `services/` + `controllers/` layer**. `infrastructure/ai/` is an
empty placeholder directory already scaffolded for this exact purpose.

---

## 2. Responsibility Classification (STEP 2)

| Use-case | Deterministic responsibility (unchanged) | AI responsibility (capability) |
|----------|------------------------------------------|--------------------------------|
| Menu | URL/provenance, price, schema presence (scorer) | dish extraction from text (capability: `menu_extraction`) |
| Reviews | rating, count, date, response rate, velocity | sentiment/themes/clusters (`review_interpretation`) |
| FAQ | (none — AI only) | FAQ generation (`faq_generation` / extraction) |
| SEO | (none — AI only) | landmark/neighborhood classification (`seo_audit`) |
| RAG chat | retrieval, scope, citations | answer synthesis (`conversation`) |
| Vector search | retrieval, similarity | N/A (deterministic) |
| Legacy scorer | all arithmetic | N/A (deterministic) |
| 25-factor scorecard | ALL arithmetic | N/A (AI must not touch) |

No "incorrect AI usage" found — every AI call is genuinely AI-worthy. No AI is currently doing
deterministic work. The only subtlety: `search.controller.ts:74-82` rebuilds citations from retrieval
chunks deterministically when the model omits them — good pattern to preserve.

---

## 3. Target Architecture (After)

```
infrastructure/ai/          ← NEW home of the AI layer
├── contracts/              ← capability interfaces + DTOs (application-facing)
│   ├── types.ts            ← shared AI request/response envelope
│   ├── CapabilityError.ts  ← typed, safe error (no provider leak)
│   └── ...capability interfaces
├── providers/
│   ├── AIService.ts        ← refactor of legacy ai.service (cascade + JSON parse + mock)
│   ├── ai.config.ts        ← moved from services/
│   └── (nvidia/ollama-cloud/local adapters stay inside AIService)
├── capabilities/
│   ├── MenuExtractionCapability.ts
│   ├── ReviewInterpretationCapability.ts
│   ├── FAQGenerationCapability.ts
│   ├── SEOAuditCapability.ts
│   └── ConversationCapability.ts
├── routing/                ← capability-aware routing policy
├── prompts/                ← centralized, named, versioned prompts
├── schemas/                ← zod structured-output validation
├── guardrails/             ← timeout, token cap, malformed-output rejection
├── observability/          ← invocation logging
└── evaluation/             ← eval harness + fixtures + tests
```

Application use-cases (controllers) ask for a **capability**, never a provider:

```ts
// BEFORE (forbidden)
const output = await aiService.generateJSON(prompt, systemInstruction);

// AFTER (required)
const output = await menuExtractionCapability.extract(rawText);
```

Provider names (`nvidia`/`ollama-cloud`/`local`) live **only** inside `infrastructure/ai/providers/`.
Routing (capability→model class) lives inside `infrastructure/ai/routing/`.

---

## 4. Migration Order (STEP 6) — one capability family at a time

1. Create `infrastructure/ai/` skeleton: contracts, providers (move ai.service + config), routing, schemas, guardrails, observability. **No consumer migration yet.**
2. Migrate **SEO audit** (`seo-optimizer.service`) → `SEOAuditCapability` (simplest, isolated).
3. Migrate **FAQ generation** (`faq.service`) → `FAQGenerationCapability` (uses light-model routing).
4. Migrate **Menu extraction** (`parser.service`) → `MenuExtractionCapability`.
5. Migrate **Review interpretation** (`review.service`) → `ReviewInterpretationCapability`.
6. Migrate **Conversation/RAG** (`search.controller`) → `ConversationCapability` (keeps deterministic retrieval + citation rebuild).
7. Delete legacy `services/ai.service.ts`, `ai.config.ts`, `services/types.ts` usage from consumers. **`infrastructure/ai/providers/AIService.ts` becomes the sole provider owner.**
8. Backwards-compat: controllers keep the same method signatures; only internal calls change. API responses unchanged.

After each family: `npm run build` + targeted tests.

---

## 5. Deterministic-vs-AI invariants (enforced)

- `domain/**` — MUST NOT import from `infrastructure/ai` or any provider. Zero AI coupling. (Verified: already true.)
- `application/**` — MUST NOT call providers directly. May call capabilities only (currently none do; the AI consumers live in controllers/services which will call capabilities).
- Controllers call capabilities, never providers.
- Structured output is validated by Zod schemas before any domain-state write; malformed output is rejected, not propagated.
- AI failure → graceful degradation (mock/empty enrichment), never a platform 500. All enrichment endpoints already fail-soft via try/catch; capability wrapper adds a deterministic fallback envelope.

---

## 6. STOP / GO gates met

**No STOP condition is triggered.** This is a separation-of-concerns refactor confined to the legacy AI
layer. It does NOT: change the 25-factor scorecard, scoring math, DB schema materially, add paid
providers, change deployment, alter tenant/security, remove features, change UX, or add cloud spend.

`GO WITHOUT ASKING` applies for all of: interface extraction, provider adapter creation, schemas, tests,
prompt centralization, evaluation framework, docs, and preserving existing APIs.

---

## 7. Definition of Done (this mission)

- AI Capability Layer exists under `infrastructure/ai/`.
- Controllers/use-cases consume capabilities, not providers.
- `domain/` and `application/` have zero provider dependency.
- Routing centralized in `infrastructure/ai/routing/`.
- All 5 AI consumers migrated; legacy `services/ai.service.ts` removed (its code relocated).
- Structured outputs Zod-validated; malformed output rejected.
- AI failure degrades gracefully (all-providers-down still renders scorecard/evidence/trends/benchmarks).
- Core scoring stays deterministic (already is).
- Prompts centralized + versioned.
- Invocation observability exists.
- Evaluation harness + representative tests.
- `npm run build` (tsc) passes, backend tests pass, E2E regression passes, `hermes verify --json` passes, clean tree.

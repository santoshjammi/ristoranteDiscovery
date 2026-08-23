# RIST-AI-001 — AI Capability Layer Architecture

Status: Implemented
Mission: Separate AI capability layer from Ristorante business logic.
Scope: RistoranteDiscovery ONLY.

## 1. Final Dependency Model

```
Product Experience
        ↓
Application Use Cases (controllers/application)
        ↓
┌───────────────────────────────────────────────┐
│ Deterministic Domain (domain/ + application/)  │
│  scorecard · evidence · benchmarks · trends    │
│  decisions · impact · portfolio · reports      │
│  (ZERO AI dependency — byte-identical)         │
└───────────────────────────────────────────────┘
        ↓  capability calls (never provider)
┌───────────────────────────────────────────────┐
│ AI Capability Layer (infrastructure/ai/)       │
│  capabilities/  contracts/  prompts/  schemas/ │
│  routing/  guardrails/  observability/  eval   │
│        ↓  capability→model routing             │
│  providers/AIService.ts  (NVIDIA→Cloud→local)  │
└───────────────────────────────────────────────┘
```

## 2. Dependency Rules (enforced)

| Direction | Status |
|-----------|--------|
| Application → Domain | ✅ existing |
| Application → AI Capability | ✅ new (5 capabilities) |
| AI Capability → Provider Interfaces | ✅ |
| Infrastructure → Provider Implementations | ✅ |
| Domain → provider (ollama/nvidia) | ❌ forbidden — verified CLEAN |
| Domain → prompts / AI routing | ❌ forbidden — verified CLEAN |

## 3. AI Capability Registry

```yaml
capabilities:
  menu_extraction:
    status: implemented
    structured_output: true          # menuExtractionSchema (zod)
    deterministic_fallback: true      # empty result on failure
    model_class: complex
    consumer: services/parser.service.ts

  review_interpretation:
    status: implemented
    structured_output: true            # reviewAnalysisSchema (zod)
    deterministic_fallback: partial    # defaults for missing fields
    model_class: complex
    consumer: services/review.service.ts

  faq_generation:
    status: implemented
    structured_output: true            # faqGenerationSchema (zod)
    deterministic_fallback: true
    model_class: light                 # local light model
    consumer: services/faq.service.ts

  seo_audit:
    status: implemented
    structured_output: true            # seoAuditSchema (zod)
    deterministic_fallback: true       # emptyAudit() envelope
    model_class: complex
    consumer: services/seo-optimizer.service.ts

  conversation:
    status: implemented
    structured_output: true            # conversationSchema (zod)
    retrieval_grounded: true           # deterministic retrieval stays in controller
    deterministic_citation_fallback: true   # rebuilds citations from chunks
    model_class: complex
    consumer: controllers/search.controller.ts
```

## 4. Provider Routing

```
AIService.generateJSON (sole provider owner):
  1. NVIDIA NIM        (if NVIDIA_API_KEY set)
  2. Ollama Cloud      (if OLLAMA_API_KEY set)
  3. Local Ollama      (last resort)
  4. Mock fallback     (if AI_ALLOW_MOCK_FALLBACK=true and all fail)

routing/capabilityRouter.ts: capability → modelClass → model:
  menu_extraction        complex   (COMPLEX_MODEL)
  review_interpretation  complex
  faq_generation         light     (LIGHT_MODEL, local)
  seo_audit              complex
  conversation           complex
Provider names appear ONLY in infrastructure/ai/providers/ + routing/ + contracts/types.ts.
```

## 5. Migration Record

| Use-case | Previous implementation | Target capability | Class | Status |
|----------|------------------------|-------------------|-------|--------|
| Menu extraction | parser.service → aiService.generateJSON | `MenuExtractionCapability` | Extraction | Migrated |
| Review interpretation | review.service → aiService.generateJSON | `ReviewInterpretationCapability` | Interpretation | Migrated |
| FAQ generation | faq.service → aiService.generateJSONLight | `FAQGenerationCapability` | Synthesis | Migrated |
| SEO/GBP audit | seo-optimizer → aiService.generateJSON | `SEOAuditCapability` | Synthesis | Migrated |
| RAG chat | search.controller → aiService.generateJSON | `ConversationCapability` | Conversation | Migrated |
| Vector search | vector.service (deterministic) | unchanged | Retrieval | Deterministic |
| Scorer / Simulator / Schema / Weekly / ReviewIntelligence | deterministic | unchanged | Deterministic | Already deterministic |

## 6. Architectural Invariant (frozen)

> Ristorante is deterministic at its core and AI-augmented at its edges. Application use-cases may request AI capabilities for extraction, interpretation, retrieval, synthesis, explanation, recommendation communication, and conversation. AI does not own scoring arithmetic, public evidence, provenance, historical calculations, benchmark calculations, identity, permissions, or business state transitions. The core Restaurant Discovery Intelligence product remains functional when every AI provider is unavailable.

### Freeze record (Aug 2026)

- **Tag:** `rist-ai-001-frozen` on commit `da81284`.
- **Hardening completed:** bounded provider timeout (`timeout` kind), operational failure taxonomy, evidence/citation grounding, retrieval isolation, search/chat authorization, menu provenance.
- **Verification at freeze:** 48/48 backend tests, frontend build green, `hermes verify` ok:true, AI ON==OFF scorecard numerically identical, all-AI-off core endpoints healthy, independent re-evaluation `PASS / P0:0 / P1:0`.
- **Frozen invariant:** RistoranteDiscovery is deterministic at its core and AI-augmented at its edges. AI may extract, interpret, retrieve, explain, synthesize, and converse over evidence, but it does **not** own canonical public evidence, scoring arithmetic, identity, provenance, benchmarks, trends, permissions, or business-state transitions. The core discovery product remains functional when all AI providers are unavailable.

// ── Declarative Factor Metadata (blueprint §5–6) ──
// Decorates base factor literals with methodology/requiredSignals/applicability/
// freshness so the registry stays declarative WITHOUT duplicating 100 literals.
// The mapping is fully deterministic. Domain-pure.
import { MarketingFactorDefinition } from '../types/marketing-factor';

/** Reusable strategy families we can already reason about for the vertical slice. */
const COMPOSITE_FACTORS = new Set<number>([17, 22, 26, 27, 28, 29, 30, 51, 53, 58]);

type Rule = Pick<
  MarketingFactorDefinition,
  'methodology' | 'requiredSignals' | 'optionalSignals' | 'applicabilityRule' | 'freshnessExpectation'
>;

/** Derive a factor's declarative metadata from its existing fields. */
export function declareFactorMetadata(def: MarketingFactorDefinition): Rule {
  const methodology = def.rdiFactorId
    ? (COMPOSITE_FACTORS.has(def.factorNumber)
        ? { type: 'composite' as const, version: 'v1' }
        : { type: 'threshold' as const, version: 'v1' })
    : def.evidenceClass === 'CONNECTED'
      ? { type: 'ratio' as const, version: 'v1' }
      : { type: 'boolean' as const, version: 'v1' };

  const requiredSignals: string[] = def.rdiFactorId ? [def.rdiFactorId] : [];

  let applicabilityRule: string | undefined;
  if (def.factorNumber === 51) applicabilityRule = 'capability:hasOnlineOrdering';
  if (def.factorNumber === 53) applicabilityRule = 'capability:hasReservations';
  if (def.factorNumber === 71) applicabilityRule = 'capability:hasLoyalty';

  return {
    methodology,
    requiredSignals,
    optionalSignals: [],
    applicabilityRule,
    freshnessExpectation: 'days:30',
  };
}

/** Return the fully-decorated factor definition (base fields + declared metadata). */
export function withDeclaredMetadata(def: MarketingFactorDefinition): MarketingFactorDefinition {
  return { ...def, ...declareFactorMetadata(def) };
}

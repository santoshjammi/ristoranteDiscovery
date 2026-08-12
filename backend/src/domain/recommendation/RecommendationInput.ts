// Domain value object — the Recommendation Input contract
// Pure domain — zero framework dependencies
// This is the stable interface every intelligence engine consumes

import { Fact } from '../../domain/fact/Fact';
import { Relationship } from '../../domain/relationship/Relationship';
import { Assertion } from '../../domain/assertion/Assertion';

export interface RecommendationInputProps {
  readonly restaurantId: string;
  readonly facts: Fact[];
  readonly relationships: Relationship[];
  readonly assertions: Assertion[];
  readonly evidenceCount: number;
  readonly lastUpdated: Date;
}

export class RecommendationInput {
  public readonly restaurantId: string;
  public readonly facts: readonly Fact[];
  public readonly relationships: readonly Relationship[];
  public readonly assertions: readonly Assertion[];
  public readonly evidenceCount: number;
  public readonly lastUpdated: Date;

  constructor(props: RecommendationInputProps) {
    this.restaurantId = props.restaurantId;
    this.facts = Object.freeze([...props.facts]);
    this.relationships = Object.freeze([...props.relationships]);
    this.assertions = Object.freeze([...props.assertions]);
    this.evidenceCount = props.evidenceCount;
    this.lastUpdated = props.lastUpdated;
  }

  getFact(attribute: string): Fact | undefined {
    return this.facts.find(f => f.attribute === attribute && f.status === 'current');
  }

  getFactsByAttribute(attribute: string): Fact[] {
    return this.facts.filter(f => f.attribute === attribute && f.status === 'current');
  }

  getRelationships(type: string): Relationship[] {
    return this.relationships.filter(r => r.type === type);
  }
}

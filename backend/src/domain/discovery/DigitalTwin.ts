// Domain aggregate — the Restaurant Digital Twin
// Central abstraction. Everything feeds this. Everything derives from this.

import { Scorecard } from './Scorecard';
import { Evidence } from './Evidence';

export type TwinStatus = 'initialized' | 'active' | 'stale' | 'archived';

export interface DigitalTwinProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly scorecard: Scorecard | null;
  readonly evidence: readonly Evidence[];
  readonly status: TwinStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class DigitalTwin {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly scorecard: Scorecard | null;
  public readonly evidence: readonly Evidence[];
  public readonly status: TwinStatus;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: DigitalTwinProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.scorecard = props.scorecard;
    this.evidence = Object.freeze([...props.evidence]);
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    Object.freeze(this);
  }

  get hasScorecard(): boolean {
    return this.scorecard !== null;
  }

  get evidenceCount(): number {
    return this.evidence.length;
  }

  get evidenceById(): Map<string, Evidence> {
    const map = new Map<string, Evidence>();
    for (const e of this.evidence) {
      map.set(e.id, e);
    }
    return map;
  }

  getEvidenceForIds(ids: string[]): Evidence[] {
    const map = this.evidenceById;
    return ids.map(id => map.get(id)).filter((e): e is Evidence => e !== undefined);
  }

  static create(restaurantId: string): DigitalTwin {
    if (!restaurantId || restaurantId.trim().length === 0) {
      throw new Error('DigitalTwin cannot be created without a restaurantId');
    }
    return new DigitalTwin({
      id: crypto.randomUUID(),
      restaurantId,
      scorecard: null,
      evidence: [],
      status: 'initialized',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  withScorecard(scorecard: Scorecard): DigitalTwin {
    if (!scorecard) {
      throw new Error('DigitalTwin cannot transition to active without a Scorecard');
    }
    return new DigitalTwin({
      ...this,
      scorecard,
      evidence: this.evidence,
      status: 'active',
      updatedAt: new Date(),
    });
  }

  withEvidence(evidence: Evidence[]): DigitalTwin {
    return new DigitalTwin({
      ...this,
      evidence: [...this.evidence, ...evidence],
      updatedAt: new Date(),
    });
  }
}

// Domain value object — a relationship between two entities
// Pure domain — zero framework dependencies

export type RelationshipType = 'located-in' | 'competes-with' | 'offers' | 'mentioned-in' | 'serves' | 'belongs-to';

export interface RelationshipProps {
  readonly id: string;
  readonly sourceEntityType: string;
  readonly sourceEntityId: string;
  readonly targetEntityType: string;
  readonly targetEntityId: string;
  readonly type: RelationshipType;
  readonly strength: number;
  readonly factIds: string[];
  readonly recordedAt: Date;
}

export class Relationship {
  public readonly id: string;
  public readonly sourceEntityType: string;
  public readonly sourceEntityId: string;
  public readonly targetEntityType: string;
  public readonly targetEntityId: string;
  public readonly type: RelationshipType;
  public readonly strength: number;
  public readonly factIds: readonly string[];
  public readonly recordedAt: Date;

  constructor(props: RelationshipProps) {
    this.id = props.id;
    this.sourceEntityType = props.sourceEntityType;
    this.sourceEntityId = props.sourceEntityId;
    this.targetEntityType = props.targetEntityType;
    this.targetEntityId = props.targetEntityId;
    this.type = props.type;
    this.strength = props.strength;
    this.factIds = Object.freeze([...props.factIds]);
    this.recordedAt = props.recordedAt;
  }
}

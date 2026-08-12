// Domain entity — a single SEO schema for a restaurant
// Pure domain — zero framework dependencies

export type SchemaType = 'Restaurant' | 'Menu' | 'FAQ' | 'Combined';

export interface SEOSchemaProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly type: SchemaType;
  readonly jsonld: object;
  readonly generatedAt: Date;
  readonly isValid: boolean;
  readonly coverageScore: number;
}

export class SEOSchema {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly type: SchemaType;
  public readonly jsonld: object;
  public readonly generatedAt: Date;
  public readonly isValid: boolean;
  public readonly coverageScore: number;

  constructor(props: SEOSchemaProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.type = props.type;
    this.jsonld = props.jsonld;
    this.generatedAt = props.generatedAt;
    this.isValid = props.isValid;
    this.coverageScore = props.coverageScore;
  }
}

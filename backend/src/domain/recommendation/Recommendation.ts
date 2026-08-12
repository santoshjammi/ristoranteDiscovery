// Domain value object — a consolidated recommendation
// Pure domain — zero framework dependencies

export type RecommendationPriority = 1 | 2 | 3 | 4 | 5;
export type RecommendationCategory = 'discovery' | 'menu' | 'review' | 'competitive' | 'seo' | 'market';

export interface RecommendationProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly category: RecommendationCategory;
  readonly title: string;
  readonly description: string;
  readonly priority: RecommendationPriority;
  readonly businessImpact: string;
  readonly implementationEffort: string;
  readonly factIds: string[];
  readonly assertionIds: string[];
  readonly evidenceIds: string[];
  readonly generatedAt: Date;
}

export class Recommendation {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly category: RecommendationCategory;
  public readonly title: string;
  public readonly description: string;
  public readonly priority: RecommendationPriority;
  public readonly businessImpact: string;
  public readonly implementationEffort: string;
  public readonly factIds: readonly string[];
  public readonly assertionIds: readonly string[];
  public readonly evidenceIds: readonly string[];
  public readonly generatedAt: Date;

  constructor(props: RecommendationProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.category = props.category;
    this.title = props.title;
    this.description = props.description;
    this.priority = props.priority;
    this.businessImpact = props.businessImpact;
    this.implementationEffort = props.implementationEffort;
    this.factIds = Object.freeze([...props.factIds]);
    this.assertionIds = Object.freeze([...props.assertionIds]);
    this.evidenceIds = Object.freeze([...props.evidenceIds]);
    this.generatedAt = props.generatedAt;
  }
}

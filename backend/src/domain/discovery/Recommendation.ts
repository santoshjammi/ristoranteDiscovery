// Domain entity — a prioritized, evidence-based recommendation
// References Evidence by ID — never embeds evidence copies

import { ConfidenceLevel } from './Evidence';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationStatus = 'identified' | 'presented' | 'accepted' | 'executed' | 'verified' | 'completed' | 'declined';

export interface RecommendationProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly title: string;
  readonly description: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: ConfidenceLevel;
  readonly businessImpact: string;
  readonly businessImpactValue: number; // estimated monthly revenue impact in USD
  readonly implementationEffort: string;
  readonly implementationEffortMinutes: number;
  readonly priority: RecommendationPriority;
  readonly status: RecommendationStatus;
  readonly category: string;
  readonly createdAt: Date;
  readonly completedAt: Date | null;
}

export class Recommendation {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly title: string;
  public readonly description: string;
  public readonly evidenceIds: readonly string[];
  public readonly confidence: ConfidenceLevel;
  public readonly businessImpact: string;
  public readonly businessImpactValue: number;
  public readonly implementationEffort: string;
  public readonly implementationEffortMinutes: number;
  public readonly priority: RecommendationPriority;
  public readonly status: RecommendationStatus;
  public readonly category: string;
  public readonly createdAt: Date;
  public readonly completedAt: Date | null;

  constructor(props: RecommendationProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.title = props.title;
    this.description = props.description;
    this.evidenceIds = Object.freeze([...props.evidenceIds]);
    this.confidence = props.confidence;
    this.businessImpact = props.businessImpact;
    this.businessImpactValue = props.businessImpactValue;
    this.implementationEffort = props.implementationEffort;
    this.implementationEffortMinutes = props.implementationEffortMinutes;
    this.priority = props.priority;
    this.status = props.status;
    this.category = props.category;
    this.createdAt = props.createdAt;
    this.completedAt = props.completedAt;
    Object.freeze(this);
  }

  get isActionable(): boolean {
    return this.status === 'identified' || this.status === 'presented';
  }

  get isCompleted(): boolean {
    return this.status === 'completed' || this.status === 'verified';
  }

  /**
   * Priority score derived from: Priority × Business Impact × Confidence × (1 / Effort)
   * Higher score = higher priority
   */
  get priorityScore(): number {
    const priorityWeight: Record<RecommendationPriority, number> = {
      critical: 10, high: 7, medium: 4, low: 1,
    };
    const confidenceWeight: Record<ConfidenceLevel, number> = {
      'very-high': 1.0, high: 0.85, medium: 0.6, low: 0.3, 'very-low': 0.1,
    };
    const impactWeight = Math.min(this.businessImpactValue / 1000, 10);
    const effortWeight = Math.max(1, 60 / Math.max(this.implementationEffortMinutes, 1));

    return priorityWeight[this.priority] * impactWeight * confidenceWeight[this.confidence] * effortWeight;
  }
}

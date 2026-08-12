// Domain value object — aggregated review intelligence
// Pure domain — zero framework dependencies

import { Review, type ReviewSentiment } from './Review';

export interface ReviewAggregateProps {
  readonly restaurantId: string;
  readonly reviews: readonly Review[];
  readonly analyzedAt: Date;
}

export class ReviewAggregate {
  public readonly restaurantId: string;
  public readonly reviews: readonly Review[];
  public readonly analyzedAt: Date;

  constructor(props: ReviewAggregateProps) {
    this.restaurantId = props.restaurantId;
    this.reviews = Object.freeze([...props.reviews]);
    this.analyzedAt = props.analyzedAt;
    Object.freeze(this);
  }

  get totalReviews(): number {
    return this.reviews.length;
  }

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((s, r) => s + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  get ratingDistribution(): Record<number, number> {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of this.reviews) {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    }
    return dist;
  }

  get sentimentBreakdown(): Record<ReviewSentiment, number> {
    const breakdown: Record<string, number> = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    for (const r of this.reviews) {
      breakdown[r.sentiment]++;
    }
    return breakdown as Record<ReviewSentiment, number>;
  }

  get positivePercentage(): number {
    if (this.reviews.length === 0) return 0;
    return Math.round((this.sentimentBreakdown.positive / this.reviews.length) * 100);
  }

  get negativePercentage(): number {
    if (this.reviews.length === 0) return 0;
    return Math.round((this.sentimentBreakdown.negative / this.reviews.length) * 100);
  }

  get responseRate(): number {
    if (this.reviews.length === 0) return 0;
    const responded = this.reviews.filter(r => r.isResponded).length;
    return Math.round((responded / this.reviews.length) * 100);
  }

  get criticalReviews(): Review[] {
    return this.reviews.filter(r => r.isCritical);
  }

  get recentReviews(): Review[] {
    return this.reviews.filter(r => r.isRecent);
  }

  get unreviewedCritical(): Review[] {
    return this.criticalReviews.filter(r => !r.isResponded);
  }

  get averageResponseLatency(): number | null {
    const latencies = this.reviews
      .map(r => r.responseLatencyDays)
      .filter((d): d is number => d !== null);
    if (latencies.length === 0) return null;
    return Math.round(latencies.reduce((s, d) => s + d, 0) / latencies.length);
  }

  get sourceBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const r of this.reviews) {
      breakdown[r.source] = (breakdown[r.source] || 0) + 1;
    }
    return breakdown;
  }

  get monthlyTrend(): Array<{ month: string; avgRating: number; count: number }> {
    const byMonth: Record<string, { total: number; count: number }> = {};
    for (const r of this.reviews) {
      const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, count: 0 };
      byMonth[key].total += r.rating;
      byMonth[key].count++;
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        avgRating: Math.round((data.total / data.count) * 10) / 10,
        count: data.count,
      }));
  }

  get ratingTrend(): 'improving' | 'declining' | 'stable' {
    const trend = this.monthlyTrend;
    if (trend.length < 2) return 'stable';
    const recent = trend.slice(-3);
    if (recent.length < 2) return 'stable';
    const first = recent[0].avgRating;
    const last = recent[recent.length - 1].avgRating;
    if (last - first > 0.3) return 'improving';
    if (first - last > 0.3) return 'declining';
    return 'stable';
  }
}

// Application service: Review Intelligence Engine
// Deterministic — ratings, frequency, keyword themes, time trends
// LLM only enriches explanations, never drives insights

import { Review } from '../../domain/reviews/Review';
import { ReviewAggregate } from '../../domain/reviews/ReviewAggregate';

// Common hospitality keywords for theme extraction (deterministic)
const THEME_KEYWORDS: Record<string, string[]> = {
  service: ['service', 'staff', 'waiter', 'server', 'host', 'friendly', 'rude', 'slow', 'attentive', 'manager', 'wait'],
  food_quality: ['taste', 'flavor', 'delicious', 'bland', 'fresh', 'spicy', 'authentic', 'undercooked', 'overcooked', 'quality', 'portion'],
  value: ['price', 'expensive', 'overpriced', 'cheap', 'worth', 'value', 'cost', 'bill', 'affordable'],
  ambiance: ['ambiance', 'atmosphere', 'decor', 'noise', 'loud', 'quiet', 'cozy', 'romantic', 'lighting', 'music', 'vibe'],
  cleanliness: ['clean', 'dirty', 'hygiene', 'bathroom', 'restroom', 'messy', 'spotless'],
  wait_time: ['wait', 'long', 'time', 'minute', 'hour', 'quick', 'fast', 'slow', 'seated', 'reservation'],
  parking: ['parking', 'park', 'lot', 'garage', 'street', 'valet'],
  location: ['location', 'area', 'neighborhood', 'nearby', 'convenient', 'accessible'],
  dietary: ['vegetarian', 'vegan', 'gluten', 'allergen', 'halal', 'dietary', 'option', 'substitute'],
  kids: ['kid', 'child', 'family', 'children', 'stroller', 'high chair', 'menu'],
};

export interface ReviewTheme {
  name: string;
  label: string;
  mentionCount: number;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  sampleQuotes: string[];
}

export interface ReviewInsight {
  type: 'volume' | 'rating' | 'response' | 'trend' | 'theme' | 'critical' | 'comparison';
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  value: string | number;
  evidenceIds: string[];
}

export interface ReviewAnalysisInput {
  restaurantId: string;
  reviews: Array<{
    id: string;
    rating: number;
    text: string;
    date: Date;
    source: string;
    responseText: string | null;
    responseDate: Date | null;
  }>;
}

export class ReviewIntelligenceEngine {
  analyze(input: ReviewAnalysisInput): { aggregate: ReviewAggregate; insights: ReviewInsight[]; themes: ReviewTheme[] } {
    const reviews = input.reviews.map(r => new Review({
      id: r.id,
      restaurantId: input.restaurantId,
      rating: r.rating,
      text: r.text,
      date: r.date,
      source: r.source,
      responseText: r.responseText,
      responseDate: r.responseDate,
    }));

    const aggregate = new ReviewAggregate({
      restaurantId: input.restaurantId,
      reviews,
      analyzedAt: new Date(),
    });

    const themes = this.extractThemes(reviews);
    const insights = this.generateInsights(aggregate, themes);

    return { aggregate, insights, themes };
  }

  private extractThemes(reviews: Review[]): ReviewTheme[] {
    const themeMentions: Record<string, { count: number; sentiments: number[]; quotes: string[] }> = {};

    for (const review of reviews) {
      const text = review.text.toLowerCase();
      for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
        const matched = keywords.filter(k => text.includes(k));
        if (matched.length > 0) {
          if (!themeMentions[theme]) {
            themeMentions[theme] = { count: 0, sentiments: [], quotes: [] };
          }
          themeMentions[theme].count++;
          themeMentions[theme].sentiments.push(review.rating);
          if (themeMentions[theme].quotes.length < 3) {
            themeMentions[theme].quotes.push(review.text.slice(0, 150));
          }
        }
      }
    }

    const themeLabels: Record<string, string> = {
      service: 'Service Quality',
      food_quality: 'Food Quality',
      value: 'Value & Pricing',
      ambiance: 'Ambiance & Atmosphere',
      cleanliness: 'Cleanliness',
      wait_time: 'Wait Times',
      parking: 'Parking',
      location: 'Location',
      dietary: 'Dietary Options',
      kids: 'Family Friendliness',
    };

    return Object.entries(themeMentions)
      .filter(([_, data]) => data.count >= 2) // Only themes with 2+ mentions
      .sort(([_, a], [__, b]) => b.count - a.count)
      .map(([theme, data]) => {
        const avgSentiment = data.sentiments.reduce((s, r) => s + r, 0) / data.sentiments.length;
        let sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
        if (avgSentiment >= 4) sentiment = 'positive';
        else if (avgSentiment <= 2.5) sentiment = 'negative';
        else if (avgSentiment > 2.5 && avgSentiment < 4) sentiment = 'mixed';
        else sentiment = 'neutral';

        return {
          name: theme,
          label: themeLabels[theme] || theme,
          mentionCount: data.count,
          sentiment,
          sampleQuotes: data.quotes,
        };
      });
  }

  private generateInsights(aggregate: ReviewAggregate, themes: ReviewTheme[]): ReviewInsight[] {
    const insights: ReviewInsight[] = [];
    let evCounter = 0;
    const nextEv = () => `ev-rev-${++evCounter}`;

    // Volume insight
    if (aggregate.totalReviews > 0) {
      insights.push({
        type: 'volume',
        title: 'Review volume',
        description: `${aggregate.totalReviews} reviews analyzed across ${Object.keys(aggregate.sourceBreakdown).length} platforms.`,
        severity: aggregate.totalReviews >= 10 ? 'positive' : 'neutral',
        value: aggregate.totalReviews,
        evidenceIds: [nextEv()],
      });
    }

    // Rating insight
    if (aggregate.averageRating > 0) {
      const ratingSeverity = aggregate.averageRating >= 4 ? 'positive' : aggregate.averageRating >= 3 ? 'neutral' : 'warning';
      insights.push({
        type: 'rating',
        title: 'Average rating',
        description: `${aggregate.averageRating}/5 across ${aggregate.totalReviews} reviews. ${aggregate.positivePercentage}% positive.`,
        severity: ratingSeverity,
        value: `${aggregate.averageRating}/5`,
        evidenceIds: [nextEv()],
      });
    }

    // Trend insight
    if (aggregate.monthlyTrend.length >= 2) {
      const trendSeverity = aggregate.ratingTrend === 'improving' ? 'positive' : aggregate.ratingTrend === 'declining' ? 'warning' : 'neutral';
      insights.push({
        type: 'trend',
        title: `Rating trend: ${aggregate.ratingTrend}`,
        description: `Rating is ${aggregate.ratingTrend} over the last ${aggregate.monthlyTrend.length} months.`,
        severity: trendSeverity,
        value: aggregate.ratingTrend,
        evidenceIds: [nextEv()],
      });
    }

    // Response rate insight
    if (aggregate.totalReviews > 0) {
      const responseSeverity = aggregate.responseRate >= 80 ? 'positive' : aggregate.responseRate >= 50 ? 'neutral' : 'warning';
      insights.push({
        type: 'response',
        title: 'Review response rate',
        description: `${aggregate.responseRate}% of reviews have owner responses. ${aggregate.unreviewedCritical.length} critical reviews need responses.`,
        severity: responseSeverity,
        value: `${aggregate.responseRate}%`,
        evidenceIds: [nextEv()],
      });
    }

    // Critical reviews insight
    if (aggregate.unreviewedCritical.length > 0) {
      insights.push({
        type: 'critical',
        title: 'Unresponded critical reviews',
        description: `${aggregate.unreviewedCritical.length} reviews with rating ≤ 2 have no owner response. Responding improves customer trust.`,
        severity: 'critical',
        value: aggregate.unreviewedCritical.length,
        evidenceIds: [nextEv()],
      });
    }

    // Theme insights (top positive and top negative)
    const positiveThemes = themes.filter(t => t.sentiment === 'positive').slice(0, 2);
    const negativeThemes = themes.filter(t => t.sentiment === 'negative').slice(0, 2);

    for (const theme of positiveThemes) {
      insights.push({
        type: 'theme',
        title: `Praised: ${theme.label}`,
        description: `${theme.mentionCount} reviews mention ${theme.label} positively. "${theme.sampleQuotes[0]?.slice(0, 100)}"`,
        severity: 'positive',
        value: theme.mentionCount,
        evidenceIds: [nextEv()],
      });
    }

    for (const theme of negativeThemes) {
      insights.push({
        type: 'theme',
        title: `Criticized: ${theme.label}`,
        description: `${theme.mentionCount} reviews mention ${theme.label} negatively. "${theme.sampleQuotes[0]?.slice(0, 100)}"`,
        severity: 'warning',
        value: theme.mentionCount,
        evidenceIds: [nextEv()],
      });
    }

    return insights;
  }
}

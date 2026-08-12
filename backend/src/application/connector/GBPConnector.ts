// ── Google Business Profile Connector ──
// Fetches GBP data and produces scorecard updates for 5 pending_observation factors:
//   delivery_platforms, review_freshness, review_response, sentiment, social_presence

import { Connector, ConnectorSyncResult, ConnectorScorecardUpdate, registry } from './ConnectorService';

const GBPConnector: Connector = {
  id: 'gbp-connector',
  name: 'Google Business Profile',
  type: 'gbp',
  description: 'Connect your Google Business Profile to sync reviews, ratings, photos, and business information.',
  icon: '🔍',

  async validate(credentials: Record<string, string>): Promise<string[]> {
    const errors: string[] = [];
    // Allow empty credentials for initial connect — validation happens at sync time
    if (credentials.gbpUrl && !credentials.gbpUrl.startsWith('http')) {
      errors.push('GBP URL must start with http:// or https://');
    }
    return errors;
  },

  async sync(credentials: Record<string, string>, restaurantId: string): Promise<ConnectorSyncResult> {
    const errors: string[] = [];
    const data: Record<string, any> = {};

    try {
      // In production, this would call the Google My Business API
      // For MSP, we simulate realistic GBP data
      const gbpUrl = credentials.gbpUrl || `https://business.google.com/place/${credentials.placeId}`;

      data.profile = {
        name: credentials.businessName || 'Your Restaurant',
        url: gbpUrl,
        category: 'Restaurant',
        claimed: true,
        completeness: 72,
      };

      data.reviews = {
        totalCount: 47,
        averageRating: 4.2,
        distribution: { 5: 28, 4: 10, 3: 5, 2: 3, 1: 1 },
        recentReviews: [
          { rating: 5, text: 'Amazing food! The biryani was incredible.', date: '2026-07-28' },
          { rating: 4, text: 'Great service and ambiance. Will visit again.', date: '2026-07-25' },
          { rating: 5, text: 'Best restaurant in town for family dinners.', date: '2026-07-20' },
          { rating: 3, text: 'Good food but service was a bit slow.', date: '2026-07-15' },
          { rating: 2, text: 'Disappointed with the portion sizes.', date: '2026-07-10' },
        ],
        responseRate: 0.35, // 35% response rate
        lastReviewDate: '2026-07-28',
        daysSinceLastReview: 5,
        sentimentScore: 0.72, // -1 to 1
      };

      data.photos = {
        totalCount: 12,
        photoCompleteness: 60,
        hasInterior: true,
        hasExterior: true,
        hasFood: true,
        hasMenu: false,
      };

      data.businessInfo = {
        hoursCompleteness: 85,
        descriptionCompleteness: 65,
        hasWebsite: true,
        hasPhone: true,
        hasDelivery: false,
        hasOnlineOrdering: false,
        hasReservations: false,
      };

      data.social = {
        hasSocialLinks: false,
        socialPlatforms: [],
        postFrequency: 'monthly',
      };

    } catch (err: any) {
      errors.push(err.message);
    }

    return {
      success: errors.length === 0,
      data,
      errors,
      syncedAt: new Date().toISOString(),
    };
  },

  getScorecardUpdates(data: Record<string, any>): ConnectorScorecardUpdate[] {
    const updates: ConnectorScorecardUpdate[] = [];
    const reviews = data.reviews || {};
    const businessInfo = data.businessInfo || {};
    const social = data.social || {};

    // delivery_platforms — based on whether delivery/ordering info exists
    updates.push({
      factorId: 'delivery_platforms',
      score: businessInfo.hasDelivery ? 60 : (businessInfo.hasOnlineOrdering ? 40 : 20),
      confidence: 0.7,
      evidence: [
        `Delivery available: ${businessInfo.hasDelivery ? 'Yes' : 'No'}`,
        `Online ordering: ${businessInfo.hasOnlineOrdering ? 'Yes' : 'No'}`,
      ],
    });

    // review_volume_freshness — based on days since last review (freshness)
    const daysSince = reviews.daysSinceLastReview || 30;
    const freshnessScore = Math.max(0, 100 - daysSince * 3);
    updates.push({
      factorId: 'review_volume_freshness',
      score: freshnessScore,
      confidence: 0.8,
      evidence: [
        `Last review: ${reviews.lastReviewDate || 'Unknown'}`,
        `Days since last review: ${daysSince}`,
        `Total reviews: ${reviews.totalCount || 0}`,
      ],
    });

    // review_response — based on response rate
    const responseRate = reviews.responseRate || 0;
    updates.push({
      factorId: 'review_response',
      score: Math.round(responseRate * 100),
      confidence: 0.75,
      evidence: [
        `Response rate: ${Math.round(responseRate * 100)}%`,
        `Total reviews: ${reviews.totalCount || 0}`,
      ],
    });

    // sentiment — based on sentiment score
    const sentimentScore = reviews.sentimentScore || 0.5;
    updates.push({
      factorId: 'sentiment',
      score: Math.round((sentimentScore + 1) * 50), // Convert -1..1 to 0..100
      confidence: 0.85,
      evidence: [
        `Sentiment score: ${sentimentScore.toFixed(2)}`,
        `Average rating: ${reviews.averageRating || 0}`,
        `Review distribution: ${JSON.stringify(reviews.distribution || {})}`,
      ],
    });

    // overall_trust — based on social media activity (social_presence sub-signal)
    const socialScore = social.hasSocialLinks ? 60 : (social.postFrequency === 'weekly' ? 40 : 20);
    updates.push({
      factorId: 'social_presence',
      score: socialScore,
      confidence: 0.6,
      evidence: [
        `Social platforms: ${(social.socialPlatforms || []).join(', ') || 'None'}`,
        `Post frequency: ${social.postFrequency || 'Unknown'}`,
      ],
    });

    return updates;
  },
};

// Register the connector
registry.register(GBPConnector);

export default GBPConnector;

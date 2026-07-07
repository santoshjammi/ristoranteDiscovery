"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = exports.ReviewService = void 0;
const ai_service_1 = require("./ai.service");
class ReviewService {
    /**
     * Run intelligence algorithms on a batch of reviews
     */
    async analyzeReviews(reviews) {
        if (reviews.length === 0) {
            throw new Error('No reviews provided for analysis');
        }
        const reviewsPayload = JSON.stringify(reviews, null, 2);
        const systemInstruction = `
You are a senior data analyst specializing in hospitality and reputation intelligence. Your goal is to transform customer reviews into actionable structured business intelligence.

Given a list of reviews with text and ratings, perform the following tasks and output a strictly valid JSON response matching this schema:
{
  "overallSentiment": 0.85, // A decimal value between -1.0 (strongly negative) and 1.0 (strongly positive)
  "sentimentSummary": "A concise paragraph summarizing customer feelings, key praise, and persistent criticisms.",
  "popularDishes": [
    {
      "dishName": "Dish name mentioned",
      "sentiment": "Positive", // "Positive", "Negative", or "Neutral"
      "mentions": 12 // Number of reviews mentioning this dish
    }
  ],
  "ambienceTags": ["cozy", "dim-lit", "noisy", "romantic", "modern"], // Relevant keywords that capture the dining vibe
  "serviceInsights": "A brief summary of findings related to staff, wait times, ordering, and friendliness.",
  "topicClusters": [
    {
      "topic": "Topic category (e.g. Price, Cleanliness, Seating, Service speed)",
      "summary": "Brief 1-2 sentence breakdown of what reviews say regarding this topic"
    }
  ],
  "complaints": [
    "List specific, actionable complaints extracted from the reviews"
  ],
  "audienceProfile": {
    "families": "Estimated % share of family diners (e.g. 30%)",
    "couples": "Estimated % share of couples (e.g. 40%)",
    "business": "Estimated % share of business diners (e.g. 10%)",
    "solo": "Estimated % share of solo diners (e.g. 20%)"
  }
}

Guidelines:
1. Aggregate trends accurately. If there are only 5 reviews, mentions should reflect exact counts.
2. Be objective. Don't hide negative feedback; highlight it in "complaints" and "topicClusters" to help the restaurant improve.
3. Compute overallSentiment by combining rating scores and text sentiments.
`;
        const prompt = `Analyze these reviews:\n\n${reviewsPayload}`;
        return await ai_service_1.aiService.generateJSON(prompt, systemInstruction);
    }
}
exports.ReviewService = ReviewService;
exports.reviewService = new ReviewService();

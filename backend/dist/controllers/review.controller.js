"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = exports.ReviewController = void 0;
const db_1 = __importDefault(require("../config/db"));
const review_service_1 = require("../services/review.service");
const scorer_service_1 = require("../services/scorer.service");
class ReviewController {
    /**
     * Ingest and analyze a batch of reviews for a restaurant.
     */
    async ingest(req, res) {
        try {
            const { restaurantId, reviews } = req.body;
            if (!restaurantId || !reviews || !Array.isArray(reviews) || reviews.length === 0) {
                return res.status(400).json({ error: 'restaurantId and a non-empty reviews array are required.' });
            }
            // Verify restaurant
            const restaurant = await db_1.default.restaurant.findUnique({
                where: { id: restaurantId }
            });
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            // Run AI Review Intelligence Engine
            const analysis = await review_service_1.reviewService.analyzeReviews(reviews);
            // Save analysis profile to db
            const savedAnalysis = await db_1.default.reviewAnalysis.create({
                data: {
                    restaurantId,
                    overallSentiment: analysis.overallSentiment,
                    sentimentSummary: analysis.sentimentSummary,
                    popularDishes: JSON.stringify(analysis.popularDishes || []),
                    ambienceTags: JSON.stringify(analysis.ambienceTags || []),
                    serviceInsights: analysis.serviceInsights,
                    topicClusters: JSON.stringify(analysis.topicClusters || []),
                    complaints: JSON.stringify(analysis.complaints || []),
                    audienceProfile: JSON.stringify(analysis.audienceProfile || {})
                }
            });
            // Update popularity scores on menu items (case-insensitive in Javascript)
            try {
                const menuItems = await db_1.default.menuItem.findMany({
                    where: { restaurantId }
                });
                for (const popularDish of analysis.popularDishes) {
                    const match = menuItems.find(item => item.name.toLowerCase() === popularDish.dishName.toLowerCase());
                    if (match) {
                        await db_1.default.menuItem.update({
                            where: { id: match.id },
                            data: {
                                popularityScore: Math.min(5.0, 1.0 + (popularDish.mentions * 0.2))
                            }
                        });
                    }
                }
            }
            catch (err) {
                console.warn('Could not update popularity scores for menu items:', err);
            }
            // Recalculate TIRDE Discoverability Scorecard
            try {
                await scorer_service_1.scorerService.computeScores(restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during review ingest:', err);
            }
            // Deserialize response before returning
            const deserializedAnalysis = {
                ...savedAnalysis,
                popularDishes: JSON.parse(savedAnalysis.popularDishes),
                ambienceTags: JSON.parse(savedAnalysis.ambienceTags),
                topicClusters: JSON.parse(savedAnalysis.topicClusters),
                complaints: JSON.parse(savedAnalysis.complaints),
                audienceProfile: JSON.parse(savedAnalysis.audienceProfile)
            };
            return res.json({
                message: 'Review analysis completed successfully',
                analysis: deserializedAnalysis
            });
        }
        catch (error) {
            console.error('Failed to ingest and analyze reviews:', error);
            return res.status(500).json({ error: 'Review intelligence analysis failed', details: error.message });
        }
    }
    /**
     * Fetch historical review analyses for a restaurant.
     */
    async getHistory(req, res) {
        try {
            const { restaurantId } = req.params;
            const history = await db_1.default.reviewAnalysis.findMany({
                where: { restaurantId },
                orderBy: { createdAt: 'desc' }
            });
            const deserializedHistory = history.map(item => ({
                ...item,
                popularDishes: JSON.parse(item.popularDishes),
                ambienceTags: JSON.parse(item.ambienceTags),
                topicClusters: JSON.parse(item.topicClusters),
                complaints: JSON.parse(item.complaints),
                audienceProfile: JSON.parse(item.audienceProfile)
            }));
            return res.json(deserializedHistory);
        }
        catch (error) {
            console.error('Failed to fetch review history:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ReviewController = ReviewController;
exports.reviewController = new ReviewController();

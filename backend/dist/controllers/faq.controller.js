"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.faqController = exports.FAQController = void 0;
const db_1 = __importDefault(require("../config/db"));
const faq_service_1 = require("../services/faq.service");
const scorer_service_1 = require("../services/scorer.service");
class FAQController {
    /**
     * Automatically generate FAQs based on restaurant profile, menu, and reviews.
     */
    async generate(req, res) {
        try {
            const { restaurantId } = req.body;
            if (!restaurantId) {
                return res.status(400).json({ error: 'restaurantId is required' });
            }
            // Fetch restaurant profile
            const restaurant = await db_1.default.restaurant.findUnique({
                where: { id: restaurantId },
                include: {
                    menuItems: true,
                    reviewAnalyses: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            // Compile summaries
            const parsedCuisines = JSON.parse(restaurant.cuisineTypes || '[]');
            const parsedDietary = JSON.parse(restaurant.dietarySupport || '[]');
            const parsedAmenities = JSON.parse(restaurant.amenities || '[]');
            const cuisineStr = parsedCuisines.join(', ');
            const dietaryStr = parsedDietary.join(', ');
            const amenitiesStr = parsedAmenities.join(', ');
            const restaurantInfo = {
                name: restaurant.name,
                address: `${restaurant.address}, ${restaurant.city}`,
                cuisineTypes: parsedCuisines,
                priceRange: restaurant.priceRange || '$$',
                timings: restaurant.timings ? JSON.parse(restaurant.timings) : {},
                dietarySupport: parsedDietary,
                amenities: parsedAmenities,
                parkingInfo: restaurant.parkingInfo || 'Not specified'
            };
            const menuSummary = restaurant.menuItems.length > 0
                ? `Dishes list: ${restaurant.menuItems.slice(0, 15).map(i => `${i.name} ($${i.price})`).join(', ')}`
                : undefined;
            const reviewSummary = restaurant.reviewAnalyses.length > 0
                ? restaurant.reviewAnalyses[0].sentimentSummary || undefined
                : undefined;
            // Trigger FAQ Service
            const result = await faq_service_1.faqService.generateFAQs(restaurantInfo, menuSummary, reviewSummary);
            // Save to database
            const savedFAQs = await db_1.default.$transaction(async (tx) => {
                // Clear old auto-generated FAQs (we could keep manually created ones, but for MVP let's replace all FAQs)
                await tx.fAQ.deleteMany({
                    where: { restaurantId }
                });
                // Insert new FAQs
                const faqsData = result.faqs.map(faq => ({
                    restaurantId,
                    question: faq.question,
                    answer: faq.answer,
                    category: faq.category,
                    voiceSnippet: faq.voiceSnippet
                }));
                await tx.fAQ.createMany({
                    data: faqsData
                });
                return tx.fAQ.findMany({
                    where: { restaurantId }
                });
            });
            // Recalculate Discoverability Scorecard
            try {
                await scorer_service_1.scorerService.computeScores(restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during FAQ generate:', err);
            }
            return res.json({
                message: 'FAQs generated successfully',
                faqs: savedFAQs
            });
        }
        catch (error) {
            console.error('Failed to generate FAQs:', error);
            return res.status(500).json({ error: 'FAQ generation failed', details: error.message });
        }
    }
    /**
     * Manually create a single FAQ
     */
    async create(req, res) {
        try {
            const { restaurantId, question, answer, category, voiceSnippet } = req.body;
            if (!restaurantId || !question || !answer || !category) {
                return res.status(400).json({ error: 'restaurantId, question, answer, and category are required' });
            }
            const faq = await db_1.default.fAQ.create({
                data: {
                    restaurantId,
                    question,
                    answer,
                    category,
                    voiceSnippet: voiceSnippet || null
                }
            });
            // Recalculate Discoverability Scorecard
            try {
                await scorer_service_1.scorerService.computeScores(restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during FAQ create:', err);
            }
            return res.status(201).json(faq);
        }
        catch (error) {
            console.error('Failed to create FAQ:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Update a specific FAQ
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const { question, answer, category, voiceSnippet } = req.body;
            const updated = await db_1.default.fAQ.update({
                where: { id },
                data: {
                    question,
                    answer,
                    category,
                    voiceSnippet
                }
            });
            // Recalculate Discoverability Scorecard
            try {
                const faq = await db_1.default.fAQ.findUnique({ where: { id } });
                if (faq)
                    await scorer_service_1.scorerService.computeScores(faq.restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during FAQ update:', err);
            }
            return res.json(updated);
        }
        catch (error) {
            console.error('Failed to update FAQ:', error);
            return res.status(500).json({ error: 'Failed to update FAQ' });
        }
    }
    /**
     * Delete a specific FAQ
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const faq = await db_1.default.fAQ.findUnique({ where: { id } });
            await db_1.default.fAQ.delete({
                where: { id }
            });
            // Recalculate Discoverability Scorecard
            try {
                if (faq)
                    await scorer_service_1.scorerService.computeScores(faq.restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during FAQ delete:', err);
            }
            return res.json({ message: 'FAQ deleted successfully' });
        }
        catch (error) {
            console.error('Failed to delete FAQ:', error);
            return res.status(500).json({ error: 'Failed to delete FAQ' });
        }
    }
}
exports.FAQController = FAQController;
exports.faqController = new FAQController();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuController = exports.MenuController = void 0;
const db_1 = __importDefault(require("../config/db"));
const parser_service_1 = require("../services/parser.service");
const scorer_service_1 = require("../services/scorer.service");
class MenuController {
    /**
     * Upload and parse a PDF menu file
     */
    async parsePDF(req, res) {
        try {
            const { restaurantId } = req.body;
            const file = req.file;
            if (!restaurantId) {
                return res.status(400).json({ error: 'restaurantId is required' });
            }
            if (!file) {
                return res.status(400).json({ error: 'No menu file uploaded' });
            }
            // Verify restaurant exists
            const restaurant = await db_1.default.restaurant.findUnique({
                where: { id: restaurantId }
            });
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            // Parse the PDF buffer
            const parsedMenu = await parser_service_1.parserService.parsePDFMenu(file.buffer);
            // Save structured menu to the database in a transaction
            const savedMenu = await db_1.default.$transaction(async (tx) => {
                // 1. Delete old sections and items (cascading delete)
                await tx.menuSection.deleteMany({
                    where: { restaurantId }
                });
                // 2. Iterate sections and items to create new ones
                const sectionsCreated = [];
                for (let i = 0; i < parsedMenu.sections.length; i++) {
                    const sec = parsedMenu.sections[i];
                    const section = await tx.menuSection.create({
                        data: {
                            restaurantId,
                            name: sec.name,
                            description: sec.description || null,
                            order: i
                        }
                    });
                    // Create items in section (serializing arrays to JSON strings for SQLite)
                    const itemsData = sec.items.map(item => ({
                        restaurantId,
                        sectionId: section.id,
                        name: item.name,
                        description: item.description || null,
                        price: item.price,
                        ingredients: JSON.stringify(item.ingredients || []),
                        dietaryType: JSON.stringify(item.dietaryType || []),
                        spiceLevel: item.spiceLevel || 'None',
                        allergens: JSON.stringify(item.allergens || []),
                        mealType: JSON.stringify(item.mealType || ['Lunch', 'Dinner']),
                        popularityScore: item.popularityScore || 0.0
                    }));
                    await tx.menuItem.createMany({
                        data: itemsData
                    });
                    sectionsCreated.push({
                        ...section,
                        items: itemsData.map(item => ({
                            ...item,
                            ingredients: JSON.parse(item.ingredients),
                            dietaryType: JSON.parse(item.dietaryType),
                            allergens: JSON.parse(item.allergens),
                            mealType: JSON.parse(item.mealType)
                        }))
                    });
                }
                return sectionsCreated;
            });
            // Recalculate TIRDE Discoverability Score
            try {
                await scorer_service_1.scorerService.computeScores(restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during PDF menu parse:', err);
            }
            return res.json({
                message: 'Menu parsed and updated successfully',
                sections: savedMenu
            });
        }
        catch (error) {
            console.error('Failed to parse PDF menu:', error);
            return res.status(500).json({ error: 'Failed to process menu upload', details: error.message });
        }
    }
    /**
     * Alternate endpoint: Parse menu from raw text input
     */
    async parseText(req, res) {
        try {
            const { restaurantId, text } = req.body;
            if (!restaurantId || !text) {
                return res.status(400).json({ error: 'restaurantId and text are required fields.' });
            }
            // Verify restaurant exists
            const restaurant = await db_1.default.restaurant.findUnique({
                where: { id: restaurantId }
            });
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            const parsedMenu = await parser_service_1.parserService.parseMenuText(text);
            const savedMenu = await db_1.default.$transaction(async (tx) => {
                // Delete old sections and items
                await tx.menuSection.deleteMany({
                    where: { restaurantId }
                });
                const sectionsCreated = [];
                for (let i = 0; i < parsedMenu.sections.length; i++) {
                    const sec = parsedMenu.sections[i];
                    const section = await tx.menuSection.create({
                        data: {
                            restaurantId,
                            name: sec.name,
                            description: sec.description || null,
                            order: i
                        }
                    });
                    const itemsData = sec.items.map(item => ({
                        restaurantId,
                        sectionId: section.id,
                        name: item.name,
                        description: item.description || null,
                        price: item.price,
                        ingredients: JSON.stringify(item.ingredients || []),
                        dietaryType: JSON.stringify(item.dietaryType || []),
                        spiceLevel: item.spiceLevel || 'None',
                        allergens: JSON.stringify(item.allergens || []),
                        mealType: JSON.stringify(item.mealType || ['Lunch', 'Dinner']),
                        popularityScore: item.popularityScore || 0.0
                    }));
                    await tx.menuItem.createMany({
                        data: itemsData
                    });
                    sectionsCreated.push({
                        ...section,
                        items: itemsData.map(item => ({
                            ...item,
                            ingredients: JSON.parse(item.ingredients),
                            dietaryType: JSON.parse(item.dietaryType),
                            allergens: JSON.parse(item.allergens),
                            mealType: JSON.parse(item.mealType)
                        }))
                    });
                }
                return sectionsCreated;
            });
            // Recalculate TIRDE Discoverability Score
            try {
                await scorer_service_1.scorerService.computeScores(restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during text menu parse:', err);
            }
            return res.json({
                message: 'Raw text menu parsed and updated successfully',
                sections: savedMenu
            });
        }
        catch (error) {
            console.error('Failed to parse text menu:', error);
            return res.status(500).json({ error: 'Failed to process text menu', details: error.message });
        }
    }
}
exports.MenuController = MenuController;
exports.menuController = new MenuController();

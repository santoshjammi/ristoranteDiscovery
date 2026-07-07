"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoController = exports.SEOController = void 0;
const db_1 = __importDefault(require("../config/db"));
const schema_service_1 = require("../services/schema.service");
const scorer_service_1 = require("../services/scorer.service");
const safeParseJSON = (str) => {
    if (!str)
        return [];
    try {
        return JSON.parse(str);
    }
    catch (e) {
        return [];
    }
};
class SEOController {
    /**
     * Generate and cache SEO JSON-LD schemas for a restaurant.
     */
    async generateSchema(req, res) {
        try {
            const { restaurantId } = req.body;
            if (!restaurantId) {
                return res.status(400).json({ error: 'restaurantId is required' });
            }
            // Fetch restaurant with menus, sections, and FAQs
            const restaurant = await db_1.default.restaurant.findUnique({
                where: { id: restaurantId },
                include: {
                    menuSections: { orderBy: { order: 'asc' } },
                    menuItems: { include: { section: true } },
                    faqs: true
                }
            });
            if (!restaurant) {
                return res.status(404).json({ error: 'Restaurant not found' });
            }
            // Deserialize restaurant lists for the schema generator
            const deserializedRestaurant = {
                ...restaurant,
                timings: restaurant.timings ? JSON.parse(restaurant.timings) : {},
                cuisineTypes: safeParseJSON(restaurant.cuisineTypes),
                dietarySupport: safeParseJSON(restaurant.dietarySupport),
                amenities: safeParseJSON(restaurant.amenities),
                ambience: safeParseJSON(restaurant.ambience)
            };
            const deserializedMenuItems = restaurant.menuItems.map(item => ({
                ...item,
                ingredients: safeParseJSON(item.ingredients),
                dietaryType: safeParseJSON(item.dietaryType),
                allergens: safeParseJSON(item.allergens),
                mealType: safeParseJSON(item.mealType)
            }));
            // Generate schemas using deserialized parameters
            const restaurantSchema = schema_service_1.schemaService.generateRestaurantSchema(deserializedRestaurant);
            const menuSchema = schema_service_1.schemaService.generateMenuSchema(restaurant.name, restaurant.menuSections, deserializedMenuItems);
            const faqSchema = schema_service_1.schemaService.generateFAQSchema(restaurant.faqs);
            const combinedSchema = schema_service_1.schemaService.generateCombinedSchema(deserializedRestaurant, restaurant.menuSections, deserializedMenuItems, restaurant.faqs);
            // Save/Upsert schemas in database as strings
            const schemasToSave = [
                { type: 'Restaurant', jsonld: restaurantSchema },
                { type: 'Menu', jsonld: menuSchema },
                { type: 'FAQ', jsonld: faqSchema },
                { type: 'Combined', jsonld: combinedSchema }
            ];
            const savedSchemas = [];
            for (const item of schemasToSave) {
                const schema = await db_1.default.sEOMarkup.upsert({
                    where: {
                        restaurantId_type: {
                            restaurantId,
                            type: item.type
                        }
                    },
                    update: {
                        jsonld: JSON.stringify(item.jsonld)
                    },
                    create: {
                        restaurantId,
                        type: item.type,
                        jsonld: JSON.stringify(item.jsonld)
                    }
                });
                savedSchemas.push({
                    ...schema,
                    jsonld: item.jsonld
                });
            }
            // Recalculate Discoverability Scorecard
            try {
                await scorer_service_1.scorerService.computeScores(restaurantId);
            }
            catch (err) {
                console.warn('Scorer service update failed during schema generate:', err);
            }
            return res.json({
                message: 'SEO JSON-LD schemas generated and cached successfully',
                schemas: savedSchemas
            });
        }
        catch (error) {
            console.error('Failed to generate SEO schema:', error);
            return res.status(500).json({ error: 'SEO Schema generation failed', details: error.message });
        }
    }
    /**
     * Fetch schemas for a restaurant.
     */
    async getSchemas(req, res) {
        try {
            const { restaurantId } = req.params;
            const schemas = await db_1.default.sEOMarkup.findMany({
                where: { restaurantId }
            });
            const deserializedSchemas = schemas.map(s => ({
                ...s,
                jsonld: JSON.parse(s.jsonld)
            }));
            return res.json(deserializedSchemas);
        }
        catch (error) {
            console.error('Failed to retrieve SEO schemas:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    /**
     * Public SEO scraper endpoint
     */
    async getPublicSchemaMarkup(req, res) {
        try {
            const { restaurantId } = req.params;
            const type = req.query.type || 'Combined';
            const schema = await db_1.default.sEOMarkup.findUnique({
                where: {
                    restaurantId_type: {
                        restaurantId,
                        type
                    }
                }
            });
            if (!schema) {
                // If not cached, let's try to generate it dynamically on the fly
                const restaurant = await db_1.default.restaurant.findUnique({
                    where: { id: restaurantId },
                    include: {
                        menuSections: { orderBy: { order: 'asc' } },
                        menuItems: { include: { section: true } },
                        faqs: true
                    }
                });
                if (!restaurant) {
                    return res.status(404).json({ error: 'Restaurant not found' });
                }
                const deserializedRestaurant = {
                    ...restaurant,
                    timings: restaurant.timings ? JSON.parse(restaurant.timings) : {},
                    cuisineTypes: safeParseJSON(restaurant.cuisineTypes),
                    dietarySupport: safeParseJSON(restaurant.dietarySupport),
                    amenities: safeParseJSON(restaurant.amenities),
                    ambience: safeParseJSON(restaurant.ambience)
                };
                const deserializedMenuItems = restaurant.menuItems.map(item => ({
                    ...item,
                    ingredients: safeParseJSON(item.ingredients),
                    dietaryType: safeParseJSON(item.dietaryType),
                    allergens: safeParseJSON(item.allergens),
                    mealType: safeParseJSON(item.mealType)
                }));
                let dynamicJSONLD;
                if (type === 'Restaurant') {
                    dynamicJSONLD = schema_service_1.schemaService.generateRestaurantSchema(deserializedRestaurant);
                }
                else if (type === 'Menu') {
                    dynamicJSONLD = schema_service_1.schemaService.generateMenuSchema(restaurant.name, restaurant.menuSections, deserializedMenuItems);
                }
                else if (type === 'FAQ') {
                    dynamicJSONLD = schema_service_1.schemaService.generateFAQSchema(restaurant.faqs);
                }
                else {
                    dynamicJSONLD = schema_service_1.schemaService.generateCombinedSchema(deserializedRestaurant, restaurant.menuSections, deserializedMenuItems, restaurant.faqs);
                }
                return res.json(dynamicJSONLD);
            }
            return res.json(JSON.parse(schema.jsonld));
        }
        catch (error) {
            console.error('Failed to serve public schema markup:', error);
            return res.status(500).json({ error: 'Failed to retrieve schema markup' });
        }
    }
}
exports.SEOController = SEOController;
exports.seoController = new SEOController();

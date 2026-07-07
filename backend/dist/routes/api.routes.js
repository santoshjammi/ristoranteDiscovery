"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const restaurant_controller_1 = require("../controllers/restaurant.controller");
const menu_controller_1 = require("../controllers/menu.controller");
const review_controller_1 = require("../controllers/review.controller");
const faq_controller_1 = require("../controllers/faq.controller");
const seo_controller_1 = require("../controllers/seo.controller");
const search_controller_1 = require("../controllers/search.controller");
const router = (0, express_1.Router)();
// Configure Multer for in-memory file buffers
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit files to 10MB
    }
});
// === Restaurant Routes ===
router.post('/restaurants', restaurant_controller_1.restaurantController.create);
router.get('/restaurants', restaurant_controller_1.restaurantController.list);
router.get('/restaurants/:id', restaurant_controller_1.restaurantController.getDetails);
router.post('/restaurants/:id/optimize/names', restaurant_controller_1.restaurantController.optimizeNames);
router.post('/restaurants/:id/optimize/landmarks', restaurant_controller_1.restaurantController.optimizeLandmarks);
// === Menu Routes ===
router.post('/menus/upload', upload.single('menu'), menu_controller_1.menuController.parsePDF);
router.post('/menus/text', menu_controller_1.menuController.parseText);
// === Review Routes ===
router.post('/reviews/ingest', review_controller_1.reviewController.ingest);
router.get('/reviews/history/:restaurantId', review_controller_1.reviewController.getHistory);
// === FAQ Routes ===
router.post('/faqs/generate', faq_controller_1.faqController.generate);
router.post('/faqs', faq_controller_1.faqController.create);
router.put('/faqs/:id', faq_controller_1.faqController.update);
router.delete('/faqs/:id', faq_controller_1.faqController.delete);
// === SEO Routes ===
router.post('/seo/generate', seo_controller_1.seoController.generateSchema);
router.get('/seo/schemas/:restaurantId', seo_controller_1.seoController.getSchemas);
router.get('/seo/public/:restaurantId', seo_controller_1.seoController.getPublicSchemaMarkup);
router.get('/seo/:restaurantId/audit', search_controller_1.searchController.audit);
// === Search & RAG Routes ===
router.post('/search/chat', search_controller_1.searchController.chat);
router.get('/search/recommend', search_controller_1.searchController.recommend);
router.post('/search/index', search_controller_1.searchController.buildIndex);
exports.default = router;

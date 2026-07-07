import { Router } from 'express';
import multer from 'multer';
import { restaurantController } from '../controllers/restaurant.controller';
import { menuController } from '../controllers/menu.controller';
import { reviewController } from '../controllers/review.controller';
import { faqController } from '../controllers/faq.controller';
import { seoController } from '../controllers/seo.controller';
import { searchController } from '../controllers/search.controller';

const router = Router();

// Configure Multer for in-memory file buffers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit files to 10MB
  }
});

// === Restaurant Routes ===
router.post('/restaurants', restaurantController.create);
router.get('/restaurants', restaurantController.list);
router.get('/restaurants/:id', restaurantController.getDetails);
router.post('/restaurants/:id/optimize/names', restaurantController.optimizeNames);
router.post('/restaurants/:id/optimize/landmarks', restaurantController.optimizeLandmarks);

// === Menu Routes ===
router.post('/menus/upload', upload.single('menu'), menuController.parsePDF);
router.post('/menus/text', menuController.parseText);

// === Review Routes ===
router.post('/reviews/ingest', reviewController.ingest);
router.get('/reviews/history/:restaurantId', reviewController.getHistory);

// === FAQ Routes ===
router.post('/faqs/generate', faqController.generate);
router.post('/faqs', faqController.create);
router.put('/faqs/:id', faqController.update);
router.delete('/faqs/:id', faqController.delete);

// === SEO Routes ===
router.post('/seo/generate', seoController.generateSchema);
router.get('/seo/schemas/:restaurantId', seoController.getSchemas);
router.get('/seo/public/:restaurantId', seoController.getPublicSchemaMarkup);
router.get('/seo/:restaurantId/audit', searchController.audit);

// === Search & RAG Routes ===
router.post('/search/chat', searchController.chat);
router.get('/search/recommend', searchController.recommend);
router.post('/search/index', searchController.buildIndex);

export default router;

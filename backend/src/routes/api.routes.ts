import { Router } from 'express';
import multer from 'multer';
import { restaurantController } from '../controllers/restaurant.controller';
import { menuController } from '../controllers/menu.controller';
import { reviewController } from '../controllers/review.controller';
import { faqController } from '../controllers/faq.controller';
import { seoController } from '../controllers/seo.controller';
import { searchController } from '../controllers/search.controller';
import discoveryRoutes from '../interfaces/routes/discovery.routes';
import menuIntelligenceRoutes from '../interfaces/routes/menu.routes';
import reviewIntelligenceRoutes from '../interfaces/routes/review.routes';
import competitiveIntelligenceRoutes from '../interfaces/routes/competitive.routes';
import seoIntelligenceRoutes from '../interfaces/routes/seo.routes';
import marketIntelligenceRoutes from '../interfaces/routes/market.routes';
import authRoutes from '../interfaces/routes/auth.routes';
import organizationRoutes from '../interfaces/routes/organization.routes';
import batch02Routes from '../interfaces/routes/batch02.routes';
import rt1Routes from '../interfaces/routes/rt1.routes';
import auditRoutes from '../interfaces/routes/audit.routes';
import subscriptionRoutes from '../interfaces/routes/subscription.routes';
import scorecardRoutes from '../interfaces/routes/scorecard.routes';
import connectorRoutes from '../interfaces/routes/connector.routes';

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
router.delete('/restaurants/:id', restaurantController.delete);
router.patch('/restaurants/:id/disable', restaurantController.toggleDisable);

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

// === Discovery Routes (RVS-001) ===
router.use('/discovery', discoveryRoutes);

// === Menu Intelligence Routes (RVS-002) ===
router.use('/menu', menuIntelligenceRoutes);

// === Review Intelligence Routes (RVS-003) ===
router.use('/reviews', reviewIntelligenceRoutes);

// === Competitive Intelligence Routes (RVS-004) ===
router.use('/competitive', competitiveIntelligenceRoutes);

// === SEO Intelligence Routes (RVS-005) ===
router.use('/seo-intelligence', seoIntelligenceRoutes);

// === Market Intelligence Routes (RVS-006) ===
router.use('/market', marketIntelligenceRoutes);

// === Auth Routes (Product Engineering Sprint 1) ===
router.use('/auth', authRoutes);

// === Organization Routes (Product Engineering Sprint 1) ===
router.use('/organizations', organizationRoutes);

// === Batch-02 Routes (Billing, Usage, Team, Connectors, Insights, Settings, Flags, Admin) ===
router.use('/', batch02Routes);

// === RT-1 Routes (Analysis, Decisions, Outcomes, Feedback, Events) ===
router.use('/', rt1Routes);

// === Audit Routes (MSP — runs all intelligence engines) ===
router.use('/audit', auditRoutes);

// === Subscription Routes (Razorpay) ===
router.use('/subscription', subscriptionRoutes);

// === Scorecard Routes (Restaurant Intelligence Scorecard v1.0) ===
router.use('/', scorecardRoutes);

// === Connector Platform Routes ===
router.use('/connectors', connectorRoutes);

export default router;

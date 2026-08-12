// Application — Audit Service
// Orchestrates all 5 intelligence engines + discovery scoring into a single audit report

import { PrismaClient } from '@prisma/client';
import { MenuIntelligenceEngine } from '../menu/MenuIntelligenceEngine';
import { ReviewIntelligenceEngine } from '../reviews/ReviewIntelligenceEngine';
import { CompetitiveIntelligenceEngine, type RestaurantProfile } from '../competitive/CompetitiveIntelligenceEngine';
import { MarketIntelligenceEngine } from '../market/MarketIntelligenceEngine';
import { SchemaAuditEngine } from '../seo/SchemaAuditEngine';
import { PrismaMenuRepository } from '../../infrastructure/persistence/menu/PrismaMenuRepository';
import { PrismaReviewRepository } from '../../infrastructure/persistence/reviews/PrismaReviewRepository';
import { PrismaCompetitiveRepository } from '../../infrastructure/persistence/competitive/PrismaCompetitiveRepository';
import { PrismaSEORepository } from '../../infrastructure/persistence/seo/PrismaSEORepository';

const SCORE_FIELDS = [
  'gbpHealthScore', 'discoverabilityScore', 'aiVisibilityScore', 'localSearchScore',
  'menuDiscoverabilityScore', 'conversationalSearchScore', 'dishRetrievalScore',
  'restaurantClarityScore', 'retrievalValidationScore', 'competitiveVisibilityScore',
  'optimizationCompleteness', 'retrievalConfidence',
] as const;

export interface AuditIssue {
  category: 'menu' | 'reviews' | 'seo' | 'competitive' | 'market' | 'discoverability';
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: string;
  evidence: string;
}

export interface AuditReport {
  restaurantId: string;
  restaurantName: string;
  overallScore: number;
  topIssues: AuditIssue[];
  allIssues: AuditIssue[];
  summary: {
    strengths: string[];
    weaknesses: string[];
    quickWins: string[];
  };
  scores: Record<string, number>;
  generatedAt: string;
}

export class AuditService {
  private menuEngine: MenuIntelligenceEngine;
  private reviewEngine: ReviewIntelligenceEngine;
  private competitiveEngine: CompetitiveIntelligenceEngine;
  private marketEngine: MarketIntelligenceEngine;
  private seoEngine: SchemaAuditEngine;
  private menuRepo: PrismaMenuRepository;
  private reviewRepo: PrismaReviewRepository;
  private competitiveRepo: PrismaCompetitiveRepository;
  private seoRepo: PrismaSEORepository;

  constructor(private prisma: PrismaClient) {
    this.menuEngine = new MenuIntelligenceEngine();
    this.reviewEngine = new ReviewIntelligenceEngine();
    this.competitiveEngine = new CompetitiveIntelligenceEngine();
    this.marketEngine = new MarketIntelligenceEngine();
    this.seoEngine = new SchemaAuditEngine();
    this.menuRepo = new PrismaMenuRepository(this.prisma);
    this.reviewRepo = new PrismaReviewRepository(this.prisma);
    this.competitiveRepo = new PrismaCompetitiveRepository(this.prisma);
    this.seoRepo = new PrismaSEORepository(this.prisma);
  }

  async runAudit(restaurantId: string): Promise<AuditReport> {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new Error('Restaurant not found');

    const issues: AuditIssue[] = [];

    // 1. Menu Intelligence
    try {
      const sections = await this.prisma.menuSection.findMany({
        where: { restaurantId },
        orderBy: { order: 'asc' },
        include: { items: { orderBy: { name: 'asc' } } },
      });
      if (sections.length > 0) {
        const { insights } = this.menuEngine.analyze({
          restaurantId,
          cuisineTypes: this.safeParseArray(restaurant.cuisineTypes),
          categories: sections.map(s => ({
            id: s.id, name: s.name, description: s.description, order: s.order,
            items: s.items.map(i => ({
              id: i.id, name: i.name, description: i.description, price: i.price,
              currency: i.currency, ingredients: this.safeParseArray(i.ingredients),
              dietaryTypes: this.safeParseArray(i.dietaryType), spiceLevel: i.spiceLevel || 'none',
              allergens: this.safeParseArray(i.allergens), mealTypes: this.safeParseArray(i.mealType),
              popularityScore: i.popularityScore,
            })),
          })),
        });
        for (const ins of insights) {
          issues.push({
            category: 'menu',
            title: ins.title,
            description: ins.description,
            severity: ins.severity === 'critical' ? 'critical' : ins.severity === 'warning' ? 'high' : 'medium',
            impact: `Menu issue affecting discoverability`,
            evidence: `Based on analysis of ${sections.reduce((s, sec) => s + sec.items.length, 0)} menu items`,
          });
        }
      }
    } catch (e) { /* skip if no menu data */ }

    // 2. Review Intelligence
    try {
      const analyses = await this.prisma.reviewAnalysis.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
      });
      if (analyses.length > 0) {
        const reviews = analyses.flatMap(a => {
          const complaints = this.safeParseArray(a.complaints);
          const items: Array<{ id: string; rating: number; text: string; date: Date; source: string; responseText: string | null; responseDate: Date | null }> = [];
          items.push({ id: a.id, rating: Math.round((a.overallSentiment + 1) * 2.5), text: a.sentimentSummary || 'No summary', date: a.createdAt, source: 'aggregated', responseText: null, responseDate: null });
          for (let i = 0; i < complaints.length; i++) {
            items.push({ id: `${a.id}-c-${i}`, rating: 2, text: complaints[i], date: a.createdAt, source: 'aggregated', responseText: null, responseDate: null });
          }
          return items;
        });
        const { insights } = this.reviewEngine.analyze({ restaurantId, reviews });
        for (const ins of insights) {
          issues.push({
            category: 'reviews',
            title: ins.title,
            description: ins.description,
            severity: ins.severity === 'critical' ? 'critical' : ins.severity === 'warning' ? 'high' : 'medium',
            impact: `Review issue affecting reputation`,
            evidence: `Based on ${reviews.length} reviews analyzed`,
          });
        }
      }
    } catch (e) { /* skip if no review data */ }

    // 3. Competitive Intelligence
    try {
      const allRestaurants = await this.prisma.restaurant.findMany({ where: { id: { not: restaurantId } } });
      if (allRestaurants.length > 0) {
        const focalProfile: RestaurantProfile = {
          id: restaurant.id, name: restaurant.name, latitude: restaurant.latitude,
          longitude: restaurant.longitude, city: restaurant.city,
          cuisineTypes: this.safeParseArray(restaurant.cuisineTypes), priceRange: restaurant.priceRange,
          deliverySupport: restaurant.deliverySupport, scores: this.extractScores(restaurant),
        };
        const candidates: RestaurantProfile[] = allRestaurants.map(r => ({
          id: r.id, name: r.name, latitude: r.latitude, longitude: r.longitude, city: r.city,
          cuisineTypes: this.safeParseArray(r.cuisineTypes), priceRange: r.priceRange,
          deliverySupport: r.deliverySupport, scores: this.extractScores(r),
        }));
        const competitiveSet = this.competitiveEngine.analyze({
          focalRestaurant: focalProfile, candidates, radiusMiles: 5, maxCompetitors: 10, cuisineFamilyMap: {},
        });
        for (const ins of competitiveSet.insights) {
          issues.push({
            category: 'competitive',
            title: ins.description,
            description: ins.description,
            severity: ins.severity === 'critical' ? 'critical' : ins.severity === 'warning' ? 'high' : 'medium',
            impact: `Competitive gap in ${ins.dimension}`,
            evidence: `Gap size: ${ins.gapSize}`,
          });
        }
      }
    } catch (e) { /* skip */ }

    // 4. SEO Intelligence
    try {
      const schemas = await this.seoRepo.findByRestaurantId(restaurantId);
      if (schemas.length > 0) {
        const audit = this.seoEngine.audit({ restaurantId, schemas });
        for (const issue of audit.issues) {
          issues.push({
            category: 'seo',
            title: `${issue.schemaType}: ${issue.description}`,
            description: issue.description,
            severity: issue.severity,
            impact: `SEO schema issue affecting search visibility`,
            evidence: `Field: ${issue.field}`,
          });
        }
      }
    } catch (e) { /* skip */ }

    // 5. Compute overall discoverability score
    const scores: Record<string, number> = {};
    for (const field of SCORE_FIELDS) {
      scores[field] = (restaurant as any)[field] ?? 0;
    }
    const overallScore = Math.round(
      (scores.discoverabilityScore * 0.25 +
       scores.aiVisibilityScore * 0.20 +
       scores.localSearchScore * 0.15 +
       scores.menuDiscoverabilityScore * 0.15 +
       scores.conversationalSearchScore * 0.10 +
       scores.competitiveVisibilityScore * 0.10 +
       scores.gbpHealthScore * 0.05) || 0
    );

    // 6. Sort and categorize
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const topIssues = sorted.slice(0, 5);
    const strengths = sorted.filter(i => i.severity === 'low' || i.severity === 'medium').slice(0, 3).map(i => i.title);
    const weaknesses = sorted.filter(i => i.severity === 'critical' || i.severity === 'high').slice(0, 3).map(i => i.title);
    const quickWins = sorted.filter(i => i.severity === 'high' || i.severity === 'medium').slice(0, 3).map(i => i.title);

    return {
      restaurantId,
      restaurantName: restaurant.name,
      overallScore,
      topIssues,
      allIssues: sorted,
      summary: { strengths, weaknesses, quickWins },
      scores,
      generatedAt: new Date().toISOString(),
    };
  }

  private safeParseArray(str: string | null): string[] {
    if (!str) return [];
    try { const p = JSON.parse(str); return Array.isArray(p) ? p : []; }
    catch { return str.split(',').map(s => s.trim()).filter(Boolean); }
  }

  private extractScores(r: any): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const field of SCORE_FIELDS) { scores[field] = (r as any)[field] ?? 0; }
    return scores;
  }
}

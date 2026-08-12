// Interface adapter: Menu Intelligence Controller
// Thin — delegates to domain/application logic, formats HTTP responses

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaMenuRepository } from '../../infrastructure/persistence/menu/PrismaMenuRepository';
import { MenuIntelligenceEngine } from '../../application/menu/MenuIntelligenceEngine';
import { PrismaDigitalTwinRepository } from '../../infrastructure/persistence/PrismaDiscoveryRepositories';

export class MenuController {
  private prisma: PrismaClient;
  private menuRepo: PrismaMenuRepository;
  private engine: MenuIntelligenceEngine;
  private twinRepo: PrismaDigitalTwinRepository;

  constructor() {
    this.prisma = new PrismaClient();
    this.menuRepo = new PrismaMenuRepository(this.prisma);
    this.engine = new MenuIntelligenceEngine();
    this.twinRepo = new PrismaDigitalTwinRepository(this.prisma);
  }

  /**
   * POST /api/v1/menu/restaurants/:id/analyze
   * Analyze a restaurant's menu: generate insights and recommendations
   */
  analyze = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const sections = await this.prisma.menuSection.findMany({
        where: { restaurantId: id },
        orderBy: { order: 'asc' },
        include: { items: { orderBy: { name: 'asc' } } },
      });

      if (sections.length === 0) {
        res.status(404).json({ error: { code: 'NO_MENU', message: 'No menu found for this restaurant' } });
        return;
      }

      // Fetch restaurant for cuisine context
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
        select: { cuisineTypes: true },
      });

      // 1. Analyze menu (pure domain logic)
      const { menu, insights } = this.engine.analyze({
        restaurantId: id,
        cuisineTypes: restaurant ? this.safeParseArray(restaurant.cuisineTypes) : [],
        categories: sections.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          order: s.order,
          items: s.items.map(i => ({
            id: i.id,
            name: i.name,
            description: i.description,
            price: i.price,
            currency: i.currency,
            ingredients: this.safeParseArray(i.ingredients),
            dietaryTypes: this.safeParseArray(i.dietaryType),
            spiceLevel: i.spiceLevel || 'none',
            allergens: this.safeParseArray(i.allergens),
            mealTypes: this.safeParseArray(i.mealType),
            popularityScore: i.popularityScore,
          })),
        })),
      });

      // 2. Enrich Digital Twin with menu intelligence
      const twin = await this.twinRepo.findByRestaurantId(id);

      res.json({
        data: {
          menu: {
            totalItems: menu.totalItems,
            categories: menu.categories.length,
            averagePrice: menu.averagePrice,
            minPrice: menu.minPrice,
            maxPrice: menu.maxPrice,
            descriptionCoverage: menu.descriptionCoverage,
            priceDistribution: menu.priceDistribution,
            dietaryBreakdown: menu.dietaryBreakdown,
            spiceBreakdown: menu.spiceBreakdown,
            popularItems: menu.popularItems.map(i => ({
              name: i.name,
              price: i.price,
              popularityScore: i.popularityScore,
            })),
          },
          insights: insights.map(i => ({
            type: i.type,
            title: i.title,
            description: i.description,
            severity: i.severity,
            value: i.value,
          })),
          twinEnriched: twin !== null,
        },
      });
    } catch (error: any) {
      console.error('Menu analysis failed:', error);
      res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
  };

  private safeParseArray(str: string): string[] {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
}

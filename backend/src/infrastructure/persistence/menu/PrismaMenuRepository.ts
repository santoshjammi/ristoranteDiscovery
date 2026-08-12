// Infrastructure: Prisma implementation of Menu repositories
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { Menu } from '../../../domain/menu/Menu';
import { MenuCategory } from '../../../domain/menu/MenuCategory';
import { MenuItem, type DietaryType, type SpiceLevel, type MealType } from '../../../domain/menu/MenuItem';

export interface MenuRepository {
  findByRestaurantId(restaurantId: string): Promise<Menu | null>;
  save(menu: Menu): Promise<void>;
}

export class PrismaMenuRepository implements MenuRepository {
  constructor(private prisma: PrismaClient) {}

  async findByRestaurantId(restaurantId: string): Promise<Menu | null> {
    const sections = await this.prisma.menuSection.findMany({
      where: { restaurantId },
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { name: 'asc' } } },
    });

    if (sections.length === 0) return null;

    const categories = sections.map(s => {
      const items = s.items.map(i => new MenuItem({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        currency: i.currency,
        ingredients: this.safeParseArray(i.ingredients),
        dietaryTypes: this.safeParseArray(i.dietaryType) as DietaryType[],
        spiceLevel: (i.spiceLevel || 'none').toLowerCase() as SpiceLevel,
        allergens: this.safeParseArray(i.allergens),
        mealTypes: this.safeParseArray(i.mealType) as MealType[],
        popularityScore: i.popularityScore,
        categoryId: s.id,
      }));

      return new MenuCategory({
        id: s.id,
        name: s.name,
        description: s.description,
        order: s.order,
        items,
      });
    });

    return new Menu({
      id: restaurantId,
      restaurantId,
      categories,
      status: 'analyzed',
      analyzedAt: new Date(),
    });
  }

  async save(menu: Menu): Promise<void> {
    // Menu is persisted through the existing Prisma MenuSection/MenuItem models
    // The controller handles persistence; this repository is for reads
    return;
  }

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

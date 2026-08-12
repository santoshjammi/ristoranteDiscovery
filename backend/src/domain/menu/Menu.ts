// Domain aggregate — the complete menu for a restaurant
// Pure domain — zero framework dependencies

import { MenuCategory } from './MenuCategory';
import { MenuItem } from './MenuItem';

export type MenuStatus = 'initialized' | 'analyzed' | 'stale';

export interface MenuProps {
  readonly id: string;
  readonly restaurantId: string;
  readonly categories: readonly MenuCategory[];
  readonly status: MenuStatus;
  readonly analyzedAt: Date | null;
}

export class Menu {
  public readonly id: string;
  public readonly restaurantId: string;
  public readonly categories: readonly MenuCategory[];
  public readonly status: MenuStatus;
  public readonly analyzedAt: Date | null;

  constructor(props: MenuProps) {
    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.categories = Object.freeze([...props.categories]);
    this.status = props.status;
    this.analyzedAt = props.analyzedAt;
    Object.freeze(this);
  }

  get allItems(): MenuItem[] {
    return this.categories.flatMap(c => [...c.items]);
  }

  get totalItems(): number {
    return this.allItems.length;
  }

  get averagePrice(): number {
    const items = this.allItems;
    if (items.length === 0) return 0;
    return items.reduce((sum, i) => sum + i.price, 0) / items.length;
  }

  get minPrice(): number {
    const items = this.allItems;
    if (items.length === 0) return 0;
    return Math.min(...items.map(i => i.price));
  }

  get maxPrice(): number {
    const items = this.allItems;
    if (items.length === 0) return 0;
    return Math.max(...items.map(i => i.price));
  }

  get itemsWithDescriptions(): MenuItem[] {
    return this.allItems.filter(i => i.hasDescription);
  }

  get itemsWithoutDescriptions(): MenuItem[] {
    return this.allItems.filter(i => !i.hasDescription);
  }

  get descriptionCoverage(): number {
    if (this.totalItems === 0) return 0;
    return Math.round((this.itemsWithDescriptions.length / this.totalItems) * 100);
  }

  get priceDistribution(): Record<string, number> {
    const items = this.allItems;
    return {
      budget: items.filter(i => i.priceCategory === 'budget').length,
      mid: items.filter(i => i.priceCategory === 'mid').length,
      premium: items.filter(i => i.priceCategory === 'premium').length,
    };
  }

  get dietaryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const item of this.allItems) {
      for (const dt of item.dietaryTypes) {
        breakdown[dt] = (breakdown[dt] || 0) + 1;
      }
    }
    return breakdown;
  }

  get spiceBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const item of this.allItems) {
      breakdown[item.spiceLevel] = (breakdown[item.spiceLevel] || 0) + 1;
    }
    return breakdown;
  }

  get popularItems(): MenuItem[] {
    return [...this.allItems]
      .filter(i => i.popularityScore > 0)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 5);
  }

  static create(restaurantId: string, categories: MenuCategory[]): Menu {
    return new Menu({
      id: crypto.randomUUID(),
      restaurantId,
      categories,
      status: 'initialized',
      analyzedAt: null,
    });
  }
}

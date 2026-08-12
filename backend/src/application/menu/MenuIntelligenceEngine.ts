// Application service: Menu Intelligence Engine
// Analyzes a menu and generates insights
// Pure domain logic — no framework dependencies

import { Menu } from '../../domain/menu/Menu';
import { MenuCategory } from '../../domain/menu/MenuCategory';
import { MenuItem, type DietaryType, type SpiceLevel, type MealType } from '../../domain/menu/MenuItem';

export interface MenuInsight {
  type: 'coverage' | 'pricing' | 'dietary' | 'spice' | 'popularity' | 'category' | 'description';
  title: string;
  description: string;
  severity: 'positive' | 'neutral' | 'warning' | 'critical';
  value: string | number;
  evidenceIds: string[];
}

export interface MenuAnalysisInput {
  restaurantId: string;
  cuisineTypes: string[];
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    order: number;
    items: Array<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      currency: string;
      ingredients: string[];
      dietaryTypes: string[];
      spiceLevel: string;
      allergens: string[];
      mealTypes: string[];
      popularityScore: number;
    }>;
  }>;
}

export class MenuIntelligenceEngine {
  analyze(input: MenuAnalysisInput): { menu: Menu; insights: MenuInsight[] } {
    const categories = input.categories.map(c => {
      const items = c.items.map(i => new MenuItem({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        currency: i.currency,
        ingredients: i.ingredients,
        dietaryTypes: i.dietaryTypes.map(d => d.toLowerCase()) as DietaryType[],
        spiceLevel: (i.spiceLevel || 'none').toLowerCase() as SpiceLevel,
        allergens: i.allergens,
        mealTypes: i.mealTypes as MealType[],
        popularityScore: i.popularityScore,
        categoryId: c.id,
      }));
      return new MenuCategory({
        id: c.id,
        name: c.name,
        description: c.description,
        order: c.order,
        items,
      });
    });

    const menu = Menu.create(input.restaurantId, categories);
    const insights = this.generateInsights(menu, input.cuisineTypes);
    return { menu, insights };
  }

  private generateInsights(menu: Menu, cuisineTypes: string[] = []): MenuInsight[] {
    const insights: MenuInsight[] = [];
    let evidenceCounter = 0;
    const nextEv = () => `ev-menu-${++evidenceCounter}`;

    // Description coverage
    if (menu.descriptionCoverage < 50) {
      insights.push({
        type: 'description',
        title: 'Low description coverage',
        description: `${menu.itemsWithoutDescriptions.length} of ${menu.totalItems} items lack descriptions. Descriptive menus perform better in semantic search.`,
        severity: menu.descriptionCoverage < 20 ? 'critical' : 'warning',
        value: `${menu.descriptionCoverage}%`,
        evidenceIds: [nextEv()],
      });
    } else if (menu.descriptionCoverage >= 80) {
      insights.push({
        type: 'description',
        title: 'Strong description coverage',
        description: `${menu.descriptionCoverage}% of items have descriptions. This improves semantic search matching.`,
        severity: 'positive',
        value: `${menu.descriptionCoverage}%`,
        evidenceIds: [nextEv()],
      });
    }

    // Category diversity
    if (menu.categories.length < 3) {
      insights.push({
        type: 'category',
        title: 'Limited menu categories',
        description: `Only ${menu.categories.length} categories. Consider adding more sections (starters, mains, desserts, beverages).`,
        severity: 'warning',
        value: menu.categories.length,
        evidenceIds: [nextEv()],
      });
    } else if (menu.categories.length >= 5) {
      insights.push({
        type: 'category',
        title: 'Good category diversity',
        description: `${menu.categories.length} categories provide good menu structure for search indexing.`,
        severity: 'positive',
        value: menu.categories.length,
        evidenceIds: [nextEv()],
      });
    }

    // Price distribution
    const dist = menu.priceDistribution;
    if (dist.premium > dist.budget && dist.premium > dist.mid) {
      insights.push({
        type: 'pricing',
        title: 'Premium-heavy menu',
        description: `${dist.premium} premium items ($${menu.maxPrice.toFixed(2)} max). Consider adding more affordable options.`,
        severity: 'neutral',
        value: `$${menu.averagePrice.toFixed(2)} avg`,
        evidenceIds: [nextEv()],
      });
    }

    // Dietary diversity
    const dietary = menu.dietaryBreakdown;
    const hasVegetarian = dietary['vegetarian'] > 0;
    const hasVegan = dietary['vegan'] > 0;
    const hasGlutenFree = dietary['gluten-free'] > 0;
    const hasHalal = dietary['halal'] > 0;

    // Skip "no vegetarian" warning if restaurant is inherently vegetarian (e.g., South Indian, Gujarati)
    const isVegetarianCuisine = cuisineTypes.some(c =>
      ['vegetarian', 'vegan', 'jain', 'gujarati', 'south indian'].includes(c.toLowerCase())
    );

    if (!hasVegetarian && !hasVegan && !isVegetarianCuisine) {
      insights.push({
        type: 'dietary',
        title: 'No vegetarian or vegan options tagged',
        description: 'Consider tagging vegetarian and vegan options. Dietary tags improve search filtering.',
        severity: 'warning',
        value: '0 tagged',
        evidenceIds: [nextEv()],
      });
    }

    if (!hasGlutenFree) {
      insights.push({
        type: 'dietary',
        title: 'No gluten-free options tagged',
        description: 'Gluten-free tagging is a common dietary filter. Consider adding it where applicable.',
        severity: 'neutral',
        value: '0 tagged',
        evidenceIds: [nextEv()],
      });
    }

    if (hasHalal) {
      insights.push({
        type: 'dietary',
        title: 'Halal options available',
        description: `${dietary['halal']} halal-tagged items. This is a strong differentiator for local search.`,
        severity: 'positive',
        value: `${dietary['halal']} items`,
        evidenceIds: [nextEv()],
      });
    }

    // Spice diversity
    const spice = menu.spiceBreakdown;
    const hasMild = spice['mild'] > 0;
    const hasHot = spice['hot'] > 0 || spice['extra-hot'] > 0;
    if (!hasMild) {
      insights.push({
        type: 'spice',
        title: 'No mild options tagged',
        description: 'Consider tagging mild options for customers with lower spice tolerance.',
        severity: 'neutral',
        value: '0 mild',
        evidenceIds: [nextEv()],
      });
    }
    if (hasHot) {
      insights.push({
        type: 'spice',
        title: 'Spicy options available',
        description: `${(spice['hot'] || 0) + (spice['extra-hot'] || 0)} hot/extra-hot items. Good for spice-seeking customers.`,
        severity: 'positive',
        value: `${(spice['hot'] || 0) + (spice['extra-hot'] || 0)} items`,
        evidenceIds: [nextEv()],
      });
    }

    // Popular items
    if (menu.popularItems.length > 0) {
      insights.push({
        type: 'popularity',
        title: 'Popular items identified',
        description: `Top item: ${menu.popularItems[0].name} (score: ${menu.popularItems[0].popularityScore}). Feature popular items prominently.`,
        severity: 'positive',
        value: menu.popularItems[0].name,
        evidenceIds: [nextEv()],
      });
    }

    return insights;
  }
}

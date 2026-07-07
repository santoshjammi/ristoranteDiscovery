import { Request, Response } from 'express';
import prisma from '../config/db';
import { schemaService } from '../services/schema.service';
import { scorerService } from '../services/scorer.service';

const safeParseJSON = (str: string | null) => {
  if (!str) return [];
  try {
    return JSON.parse(str);
  } catch (e) {
    return [];
  }
};

export class SEOController {
  /**
   * Generate and cache SEO JSON-LD schemas for a restaurant.
   */
  async generateSchema(req: Request, res: Response) {
    try {
      const { restaurantId } = req.body;

      if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
      }

      // Fetch restaurant with menus, sections, and FAQs
      const restaurant = await prisma.restaurant.findUnique({
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
      const restaurantSchema = schemaService.generateRestaurantSchema(deserializedRestaurant);
      const menuSchema = schemaService.generateMenuSchema(restaurant.name, restaurant.menuSections, deserializedMenuItems);
      const faqSchema = schemaService.generateFAQSchema(restaurant.faqs);
      const combinedSchema = schemaService.generateCombinedSchema(
        deserializedRestaurant,
        restaurant.menuSections,
        deserializedMenuItems,
        restaurant.faqs
      );

      // Save/Upsert schemas in database as strings
      const schemasToSave = [
        { type: 'Restaurant', jsonld: restaurantSchema },
        { type: 'Menu', jsonld: menuSchema },
        { type: 'FAQ', jsonld: faqSchema },
        { type: 'Combined', jsonld: combinedSchema }
      ];

      const savedSchemas = [];
      for (const item of schemasToSave) {
        const schema = await prisma.sEOMarkup.upsert({
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
        await scorerService.computeScores(restaurantId);
      } catch (err) {
        console.warn('Scorer service update failed during schema generate:', err);
      }

      return res.json({
        message: 'SEO JSON-LD schemas generated and cached successfully',
        schemas: savedSchemas
      });
    } catch (error: any) {
      console.error('Failed to generate SEO schema:', error);
      return res.status(500).json({ error: 'SEO Schema generation failed', details: error.message });
    }
  }

  /**
   * Fetch schemas for a restaurant.
   */
  async getSchemas(req: Request, res: Response) {
    try {
      const { restaurantId } = req.params;

      const schemas = await prisma.sEOMarkup.findMany({
        where: { restaurantId }
      });

      const deserializedSchemas = schemas.map(s => ({
        ...s,
        jsonld: JSON.parse(s.jsonld)
      }));

      return res.json(deserializedSchemas);
    } catch (error: any) {
      console.error('Failed to retrieve SEO schemas:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Public SEO scraper endpoint
   */
  async getPublicSchemaMarkup(req: Request, res: Response) {
    try {
      const { restaurantId } = req.params;
      const type = (req.query.type as string) || 'Combined';

      const schema = await prisma.sEOMarkup.findUnique({
        where: {
          restaurantId_type: {
            restaurantId,
            type
          }
        }
      });

      if (!schema) {
        // If not cached, let's try to generate it dynamically on the fly
        const restaurant = await prisma.restaurant.findUnique({
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
          dynamicJSONLD = schemaService.generateRestaurantSchema(deserializedRestaurant);
        } else if (type === 'Menu') {
          dynamicJSONLD = schemaService.generateMenuSchema(restaurant.name, restaurant.menuSections, deserializedMenuItems);
        } else if (type === 'FAQ') {
          dynamicJSONLD = schemaService.generateFAQSchema(restaurant.faqs);
        } else {
          dynamicJSONLD = schemaService.generateCombinedSchema(
            deserializedRestaurant,
            restaurant.menuSections,
            deserializedMenuItems,
            restaurant.faqs
          );
        }

        return res.json(dynamicJSONLD);
      }

      return res.json(JSON.parse(schema.jsonld));
    } catch (error: any) {
      console.error('Failed to serve public schema markup:', error);
      return res.status(500).json({ error: 'Failed to retrieve schema markup' });
    }
  }
}

export const seoController = new SEOController();

import { Request, Response } from 'express';
import prisma from '../config/db';
import { scorerService } from '../services/scorer.service';
import { querySimulatorService } from '../services/query-simulator.service';

const safeParseJSON = (str: string | null) => {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

const serializeRestaurant = (res: any) => {
  if (!res) return null;
  return {
    ...res,
    timings: safeParseJSON(res.timings),
    cuisineTypes: safeParseJSON(res.cuisineTypes) || [],
    dietarySupport: safeParseJSON(res.dietarySupport) || [],
    amenities: safeParseJSON(res.amenities) || [],
    ambience: safeParseJSON(res.ambience) || []
  };
};

export class RestaurantController {
  constructor() {
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getDetails = this.getDetails.bind(this);
    this.optimizeNames = this.optimizeNames.bind(this);
    this.optimizeLandmarks = this.optimizeLandmarks.bind(this);
    this.fetchAndSerializeDetails = this.fetchAndSerializeDetails.bind(this);
  }

  /**
   * Create a new restaurant profile
   */
  async create(req: Request, res: Response) {
    try {
      const {
        name,
        address,
        city,
        state,
        postalCode,
        latitude,
        longitude,
        phone,
        website,
        timings,
        cuisineTypes,
        regionalCuisine,
        priceRange,
        dietarySupport,
        amenities,
        ambience,
        parkingInfo,
        deliverySupport
      } = req.body;

      if (!name || !address || !city) {
        return res.status(400).json({ error: 'Name, address, and city are required fields.' });
      }

      const restaurant = await prisma.restaurant.create({
        data: {
          name,
          address,
          city,
          state,
          postalCode,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          phone,
          website,
          timings: timings ? JSON.stringify(timings) : JSON.stringify({}),
          cuisineTypes: JSON.stringify(cuisineTypes || []),
          regionalCuisine: regionalCuisine || null,
          priceRange: priceRange || '$$',
          dietarySupport: JSON.stringify(dietarySupport || []),
          amenities: JSON.stringify(amenities || []),
          ambience: JSON.stringify(ambience || []),
          parkingInfo,
          deliverySupport: !!deliverySupport
        }
      });

      // Recalculate baseline scorecards (will be mostly 0 initially, but initializes the columns)
      try {
        await scorerService.computeScores(restaurant.id);
      } catch (err) {
        console.warn('Scorer service update failed during restaurant creation:', err);
      }

      const freshRestaurant = await prisma.restaurant.findUnique({
        where: { id: restaurant.id }
      });

      return res.status(201).json(serializeRestaurant(freshRestaurant));
    } catch (error: any) {
      console.error('Failed to create restaurant:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * List all restaurants
   */
  async list(req: Request, res: Response) {
    try {
      const restaurants = await prisma.restaurant.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return res.json(restaurants.map(serializeRestaurant));
    } catch (error: any) {
      console.error('Failed to list restaurants:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Helper to fetch and serialize full details of a restaurant (including sections, FAQs, reviews, schemas, and simulations)
   */
  private async fetchAndSerializeDetails(id: string) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        menuSections: {
          orderBy: { order: 'asc' },
          include: { items: true }
        },
        menuItems: true,
        reviewAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        faqs: true,
        schemas: true,
        vectorCaches: true
      }
    });

    if (!restaurant) return null;

    const deserializedRestaurant = serializeRestaurant(restaurant);
    
    const sections = restaurant.menuSections.map(sec => ({
      ...sec,
      items: sec.items.map(item => ({
        ...item,
        ingredients: safeParseJSON(item.ingredients) || [],
        dietaryType: safeParseJSON(item.dietaryType) || [],
        allergens: safeParseJSON(item.allergens) || [],
        mealType: safeParseJSON(item.mealType) || []
      }))
    }));

    const reviews = restaurant.reviewAnalyses.map(rev => ({
      ...rev,
      popularDishes: safeParseJSON(rev.popularDishes) || [],
      ambienceTags: safeParseJSON(rev.ambienceTags) || [],
      topicClusters: safeParseJSON(rev.topicClusters) || [],
      complaints: safeParseJSON(rev.complaints) || [],
      audienceProfile: safeParseJSON(rev.audienceProfile) || {}
    }));

    const schemas = restaurant.schemas.map(sch => ({
      ...sch,
      jsonld: safeParseJSON(sch.jsonld)
    }));

    const querySimulation = querySimulatorService.simulateQueries(restaurant);

    return {
      ...deserializedRestaurant,
      menuSections: sections,
      reviewAnalyses: reviews,
      schemas,
      querySimulation
    };
  }

  /**
   * Fetch complete restaurant dashboard profile
   */
  async getDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const details = await this.fetchAndSerializeDetails(id);
      if (!details) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      return res.json(details);
    } catch (error: any) {
      console.error('Failed to get restaurant details:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * One-click generic name optimization
   */
  async optimizeNames(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const restaurant = await prisma.restaurant.findUnique({
        where: { id },
        include: { menuItems: true }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const highAmbiguity = ['curry', 'meals', 'special', 'masala', 'chaman'];
      const medAmbiguity = ['korma', 'fry', '65'];

      let updatedCount = 0;
      for (const item of restaurant.menuItems) {
        const nameLower = item.name.toLowerCase().trim();
        const isHigh = highAmbiguity.some(word => nameLower === word || (nameLower.endsWith(' ' + word) && nameLower.split(' ').length <= 2));
        const isMed = medAmbiguity.some(word => nameLower === word || (nameLower.endsWith(' ' + word) && nameLower.split(' ').length <= 2));

        if (isHigh || isMed) {
          const regionalPrefix = restaurant.regionalCuisine || 'Traditional';
          const newName = `${regionalPrefix} ${item.name}`;
          
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { name: newName }
          });
          updatedCount++;
        }
      }

      // Recompute scores
      await scorerService.computeScores(id);

      // Return fully updated details payload
      const details = await this.fetchAndSerializeDetails(id);
      return res.json({
        success: true,
        message: `Successfully optimized ${updatedCount} ambiguous dish names.`,
        restaurant: details
      });
    } catch (error: any) {
      console.error('Failed to optimize dish names:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * One-click corporate landmarks synchronization
   */
  async optimizeLandmarks(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const restaurant = await prisma.restaurant.findUnique({
        where: { id }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const triangleLandmarks = [
        "Lenovo Cary Campus",
        "Cisco Systems RTP",
        "MetLife Cary Offices",
        "RTP Corridor",
        "Lake Crabtree County Park"
      ];

      let currentLandmarks: string[] = [];
      try {
        currentLandmarks = typeof restaurant.nearbyLandmarks === 'string'
          ? JSON.parse(restaurant.nearbyLandmarks)
          : (Array.isArray(restaurant.nearbyLandmarks) ? restaurant.nearbyLandmarks : []);
      } catch {
        if (restaurant.nearbyLandmarks) {
          currentLandmarks = restaurant.nearbyLandmarks.split(',').map(s => s.trim()).filter(Boolean);
        }
      }

      const mergedLandmarks = [...new Set([...currentLandmarks, ...triangleLandmarks])];

      await prisma.restaurant.update({
        where: { id },
        data: {
          nearbyLandmarks: JSON.stringify(mergedLandmarks)
        }
      });

      // Recompute scores
      await scorerService.computeScores(id);

      // Return fully updated details payload
      const details = await this.fetchAndSerializeDetails(id);
      return res.json({
        success: true,
        message: "Successfully synchronized NC Triangle corporate landmarks.",
        restaurant: details
      });
    } catch (error: any) {
      console.error('Failed to optimize landmarks:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const restaurantController = new RestaurantController();

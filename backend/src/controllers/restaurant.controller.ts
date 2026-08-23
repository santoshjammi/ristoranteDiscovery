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
    this.delete = this.delete.bind(this);
    this.toggleDisable = this.toggleDisable.bind(this);
    this.mergeSelected = this.mergeSelected.bind(this);
    this.listMembers = this.listMembers.bind(this);
    this.addMember = this.addMember.bind(this);
    this.removeMember = this.removeMember.bind(this);
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

  /**
   * Merge a manually selected set of restaurant records into one keeper
   */
  async mergeSelected(req: Request, res: Response) {
    try {
      const { keeperId, mergeIds } = req.body ?? {};
      const ids: string[] = Array.isArray(mergeIds) ? mergeIds.filter(Boolean) : [];
      if (!keeperId || ids.length < 1) {
        return res.status(400).json({ error: 'keeperId and mergeIds are required' });
      }
      if (ids.includes(keeperId)) {
        return res.status(400).json({ error: 'mergeIds must not include keeperId' });
      }

      const keeper = await prisma.restaurant.findUnique({ where: { id: keeperId } });
      if (!keeper) return res.status(404).json({ error: 'Keeper restaurant not found' });

      const duplicates = await prisma.restaurant.findMany({ where: { id: { in: ids } } });
      if (duplicates.length !== ids.length) {
        return res.status(404).json({ error: 'One or more restaurants to merge were not found' });
      }

      const mergedFrom: string[] = [];
      const movedTables: string[] = [];

      await prisma.$transaction(async (tx) => {
        for (const source of duplicates) {
          if (source.id === keeperId) continue;
          const sourceName = source.name || '';
          const sourceAddress = source.address || '';
          const sourceCity = source.city || '';

          // Move one-to-many references. If a target row already exists, delete the duplicate child row.
          const moveSections = await tx.menuSection.findMany({ where: { restaurantId: source.id } });
          for (const section of moveSections) {
            const conflict = await tx.menuSection.findFirst({ where: { restaurantId: keeperId, name: section.name } });
            if (conflict) {
              await tx.menuItem.deleteMany({ where: { sectionId: section.id } });
              await tx.menuSection.delete({ where: { id: section.id } });
            } else {
              await tx.menuSection.update({ where: { id: section.id }, data: { restaurantId: keeperId } });
            }
          }
          movedTables.push('menuSections');

          const moveItems = await tx.menuItem.findMany({ where: { restaurantId: source.id } });
          for (const item of moveItems) {
            const section = await tx.menuSection.findFirst({ where: { restaurantId: keeperId, name: { not: '' } }, orderBy: { order: 'asc' } });
            if (section) {
              await tx.menuItem.update({ where: { id: item.id }, data: { restaurantId: keeperId, sectionId: section.id } });
            }
          }
          if (moveItems.length) movedTables.push('menuItems');

          await tx.reviewAnalysis.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.fAQ.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.sEOMarkup.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.vectorCache.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.competitiveSet.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.organizationRestaurant.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.decision.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.scorecardSnapshot.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          await tx.benchmark.updateMany({ where: { restaurantId: source.id }, data: { restaurantId: keeperId } });
          movedTables.push('content/timeline/benchmarks');

          // Merge scalar fields conservatively: keep existing keeper values unless missing.
          await tx.restaurant.update({
            where: { id: keeperId },
            data: {
              phone: keeper.phone || source.phone || null,
              website: keeper.website || source.website || null,
              latitude: keeper.latitude || source.latitude || null,
              longitude: keeper.longitude || source.longitude || null,
              regionalCuisine: keeper.regionalCuisine || source.regionalCuisine || null,
              priceRange: keeper.priceRange || source.priceRange || null,
              parkingInfo: keeper.parkingInfo || source.parkingInfo || null,
              timings: keeper.timings || source.timings || JSON.stringify({}),
              cuisineTypes: keeper.cuisineTypes || source.cuisineTypes,
              dietarySupport: keeper.dietarySupport || source.dietarySupport,
              amenities: keeper.amenities || source.amenities,
              ambience: keeper.ambience || source.ambience,
              nearbyLandmarks: keeper.nearbyLandmarks || source.nearbyLandmarks,
            },
          });

          await tx.restaurant.delete({ where: { id: source.id } });
          mergedFrom.push(source.id);
        }
      });

      return res.json({
        success: true,
        keeperId,
        mergedFrom,
        movedTables: Array.from(new Set(movedTables)),
        message: `Merged ${mergedFrom.length} restaurant(s) into ${keeper.name}`,
      });
    } catch (error: any) {
      console.error('Failed to merge selected restaurants:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Fetch restaurant-scoped members
   */
  async listMembers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const members = await (prisma as any).restaurantMember.findMany({
        where: { restaurantId: id },
        include: { user: true },
        orderBy: { addedAt: 'desc' },
      });
      return res.json({
        data: members.map((m: any) => ({
          id: m.id,
          restaurantId: m.restaurantId,
          userId: m.userId,
          role: m.role,
          addedAt: m.addedAt,
          user: { id: m.user.id, name: m.user.name, email: m.user.email },
        })),
      });
    } catch (error: any) {
      console.error('Failed to list restaurant members:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Add or update a restaurant-scoped member
   */
  async addMember(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, role } = req.body ?? {};
      if (!email) return res.status(400).json({ error: 'email is required' });
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const member = await (prisma as any).restaurantMember.upsert({
        where: { restaurantId_userId: { restaurantId: id, userId: user.id } },
        update: { role: role || 'editor' },
        create: { restaurantId: id, userId: user.id, role: role || 'editor' },
      });
      return res.status(201).json({
        data: {
          id: member.id,
          restaurantId: member.restaurantId,
          userId: member.userId,
          role: member.role,
          addedAt: member.addedAt,
        },
      });
    } catch (error: any) {
      console.error('Failed to add restaurant member:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  /**
   * Remove a restaurant-scoped member
   */
  async removeMember(req: Request, res: Response) {
    try {
      const { id, userId } = req.params;
      await prisma.restaurantMember.delete({ where: { restaurantId_userId: { restaurantId: id, userId } } });
      return res.json({ success: true });
    } catch (error: any) {
      console.error('Failed to remove restaurant member:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const restaurant = await prisma.restaurant.findUnique({ where: { id } });
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
      await prisma.restaurant.delete({ where: { id } });
      return res.json({ success: true, message: 'Restaurant deleted' });
    } catch (error: any) {
      console.error('Failed to delete restaurant:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Toggle restaurant disabled status (for subscription expiry, admin actions)
   */
  async toggleDisable(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const restaurant = await prisma.restaurant.findUnique({ where: { id } });
      if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
      const updated = await prisma.restaurant.update({
        where: { id },
        data: { disabled: !restaurant.disabled },
      });
      return res.json({ success: true, disabled: updated.disabled });
    } catch (error: any) {
      console.error('Failed to toggle restaurant status:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const restaurantController = new RestaurantController();

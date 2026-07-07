import { Request, Response } from 'express';
import prisma from '../config/db';
import { parserService } from '../services/parser.service';
import { scorerService } from '../services/scorer.service';

export class MenuController {
  /**
   * Upload and parse a PDF menu file
   */
  async parsePDF(req: Request, res: Response) {
    try {
      const { restaurantId } = req.body;
      const file = req.file;

      if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
      }

      if (!file) {
        return res.status(400).json({ error: 'No menu file uploaded' });
      }

      // Verify restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      // Parse the PDF buffer
      const parsedMenu = await parserService.parsePDFMenu(file.buffer);

      // Save structured menu to the database in a transaction
      const savedMenu = await prisma.$transaction(async (tx) => {
        // 1. Delete old sections and items (cascading delete)
        await tx.menuSection.deleteMany({
          where: { restaurantId }
        });

        // 2. Iterate sections and items to create new ones
        const sectionsCreated = [];
        for (let i = 0; i < parsedMenu.sections.length; i++) {
          const sec = parsedMenu.sections[i];
          const section = await tx.menuSection.create({
            data: {
              restaurantId,
              name: sec.name,
              description: sec.description || null,
              order: i
            }
          });

          // Create items in section (serializing arrays to JSON strings for SQLite)
          const itemsData = sec.items.map(item => ({
            restaurantId,
            sectionId: section.id,
            name: item.name,
            description: item.description || null,
            price: item.price,
            ingredients: JSON.stringify(item.ingredients || []),
            dietaryType: JSON.stringify(item.dietaryType || []),
            spiceLevel: item.spiceLevel || 'None',
            allergens: JSON.stringify(item.allergens || []),
            mealType: JSON.stringify(item.mealType || ['Lunch', 'Dinner']),
            popularityScore: item.popularityScore || 0.0
          }));

          await tx.menuItem.createMany({
            data: itemsData
          });

          sectionsCreated.push({
            ...section,
            items: itemsData.map(item => ({
              ...item,
              ingredients: JSON.parse(item.ingredients),
              dietaryType: JSON.parse(item.dietaryType),
              allergens: JSON.parse(item.allergens),
              mealType: JSON.parse(item.mealType)
            }))
          });
        }

        return sectionsCreated;
      });

      // Recalculate TIRDE Discoverability Score
      try {
        await scorerService.computeScores(restaurantId);
      } catch (err) {
        console.warn('Scorer service update failed during PDF menu parse:', err);
      }

      return res.json({
        message: 'Menu parsed and updated successfully',
        sections: savedMenu
      });
    } catch (error: any) {
      console.error('Failed to parse PDF menu:', error);
      return res.status(500).json({ error: 'Failed to process menu upload', details: error.message });
    }
  }

  /**
   * Alternate endpoint: Parse menu from raw text input
   */
  async parseText(req: Request, res: Response) {
    try {
      const { restaurantId, text } = req.body;

      if (!restaurantId || !text) {
        return res.status(400).json({ error: 'restaurantId and text are required fields.' });
      }

      // Verify restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const parsedMenu = await parserService.parseMenuText(text);

      const savedMenu = await prisma.$transaction(async (tx) => {
        // Delete old sections and items
        await tx.menuSection.deleteMany({
          where: { restaurantId }
        });

        const sectionsCreated = [];
        for (let i = 0; i < parsedMenu.sections.length; i++) {
          const sec = parsedMenu.sections[i];
          const section = await tx.menuSection.create({
            data: {
              restaurantId,
              name: sec.name,
              description: sec.description || null,
              order: i
            }
          });

          const itemsData = sec.items.map(item => ({
            restaurantId,
            sectionId: section.id,
            name: item.name,
            description: item.description || null,
            price: item.price,
            ingredients: JSON.stringify(item.ingredients || []),
            dietaryType: JSON.stringify(item.dietaryType || []),
            spiceLevel: item.spiceLevel || 'None',
            allergens: JSON.stringify(item.allergens || []),
            mealType: JSON.stringify(item.mealType || ['Lunch', 'Dinner']),
            popularityScore: item.popularityScore || 0.0
          }));

          await tx.menuItem.createMany({
            data: itemsData
          });

          sectionsCreated.push({
            ...section,
            items: itemsData.map(item => ({
              ...item,
              ingredients: JSON.parse(item.ingredients),
              dietaryType: JSON.parse(item.dietaryType),
              allergens: JSON.parse(item.allergens),
              mealType: JSON.parse(item.mealType)
            }))
          });
        }

        return sectionsCreated;
      });

      // Recalculate TIRDE Discoverability Score
      try {
        await scorerService.computeScores(restaurantId);
      } catch (err) {
        console.warn('Scorer service update failed during text menu parse:', err);
      }

      return res.json({
        message: 'Raw text menu parsed and updated successfully',
        sections: savedMenu
      });
    } catch (error: any) {
      console.error('Failed to parse text menu:', error);
      return res.status(500).json({ error: 'Failed to process text menu', details: error.message });
    }
  }
}

export const menuController = new MenuController();

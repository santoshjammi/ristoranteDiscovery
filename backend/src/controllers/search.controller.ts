import { Request, Response } from 'express';
import prisma from '../config/db';
import { vectorService } from '../services/vector.service';
import { aiService } from '../services/ai.service';
import { seoOptimizerService } from '../services/seo-optimizer.service';

export interface ChatResponse {
  answer: string;
  citations: Array<{
    restaurantId: string;
    restaurantName: string;
    entityType: string; // "menuItem", "faq", "restaurant"
    entityName: string; // Dish name or FAQ question
    details: string;    // Price or voice snippet
  }>;
}

export class SearchController {
  /**
   * Conversational RAG Search: Vector retrieval + LLM synthesis
   */
  async chat(req: Request, res: Response) {
    try {
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required as a string.' });
      }

      // 1. Semantic retrieval of top 4 matching chunks
      const matches = await vectorService.searchSemantic(query, 4);

      if (matches.length === 0) {
        return res.json({
          answer: "I couldn't find any restaurants, menu items, or FAQs matching your query in the discovery index. Try looking for something like 'cozy Italian place serving risotto' or 'gluten free pasta options'.",
          citations: []
        });
      }

      // 2. Prepare RAG context payload
      const contextString = matches.map((match, idx) => {
        return `[Chunk #${idx + 1}] Entity Type: ${match.chunk.entityType} (ID: ${match.chunk.entityId}) belonging to Restaurant "${match.chunk.restaurant.name}" (ID: ${match.chunk.restaurantId}). Content: ${match.chunk.textChunk}`;
      }).join('\n\n');

      const systemInstruction = `
You are the RDI conversational restaurant assistant. Your job is to answer customer dining search queries using ONLY the retrieved context chunks.

Provide a highly helpful, premium, and friendly recommendation response matching this JSON structure:
{
  "answer": "A clear, descriptive response summarizing matching restaurants, specific dishes, prices, and vibe elements mentioned. Be concise and write in a natural conversational tone.",
  "citations": [
    {
      "restaurantId": "ID of the restaurant cited",
      "restaurantName": "Name of the restaurant cited",
      "entityType": "menuItem", // "menuItem", "faq", "restaurant", or "reviewTopic"
      "entityName": "Specific name of the dish or FAQ question cited",
      "details": "$24.00" // Specific detail, e.g. price for menuItems, voiceSnippet for FAQs, sentiment for reviews
    }
  ]
}

Guidelines:
1. Do not make up facts. Only reference details present in the context.
2. If a dish price is present in the chunk, include it in both the answer and the citations array.
3. Be friendly and conversational, as if speaking to someone looking for dining recommendations.
`;

      const prompt = `Customer search query: "${query}"\n\nRetrieved Context Chunks:\n${contextString}`;

      const chatOutput = await aiService.generateJSON<ChatResponse>(prompt, systemInstruction);

      // Handle mock fallback checks
      // In mock mode, ensure we populate logical citations matching the retrieved chunks
      if (!chatOutput.citations || chatOutput.citations.length === 0) {
        chatOutput.citations = matches.map(m => ({
          restaurantId: m.chunk.restaurantId,
          restaurantName: m.chunk.restaurant.name,
          entityType: m.chunk.entityType,
          entityName: m.chunk.entityType === 'menuItem' ? m.chunk.textChunk.split('Dish name: ')[1]?.split(' (')[0] || 'Dish' : 'Details',
          details: m.chunk.entityType === 'menuItem' ? '$' + m.chunk.textChunk.split('($')[1]?.split(')')[0] || 'Item' : 'Info'
        }));
      }

      return res.json(chatOutput);
    } catch (error: any) {
      console.error('RAG conversational search failed:', error);
      return res.status(500).json({ error: 'Search retrieval failed', details: error.message });
    }
  }

  /**
   * Standard semantic search endpoint returning raw chunks and similarity scores
   */
  async recommend(req: Request, res: Response) {
    try {
      const query = (req.query.q as string) || '';
      if (!query) {
        return res.status(400).json({ error: 'Query parameter q is required.' });
      }

      const results = await vectorService.searchSemantic(query, 6);
      return res.json(results);
    } catch (error: any) {
      console.error('Semantic recommendation failed:', error);
      return res.status(500).json({ error: 'Search failed' });
    }
  }

  /**
   * Perform a local SEO audit and update restaurant metrics
   */
  async audit(req: Request, res: Response) {
    try {
      const { restaurantId } = req.params;

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: restaurantId },
        include: {
          reviewAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      });

      if (!restaurant) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }

      const parsedRestaurant = {
        name: restaurant.name,
        address: restaurant.address,
        city: restaurant.city,
        cuisineTypes: JSON.parse(restaurant.cuisineTypes || '[]'),
        amenities: JSON.parse(restaurant.amenities || '[]')
      };

      const reviewSummary = restaurant.reviewAnalyses.length > 0 
        ? restaurant.reviewAnalyses[0].sentimentSummary || undefined
        : undefined;

      // Run AI audit
      const auditResult = await seoOptimizerService.auditRestaurant(parsedRestaurant, reviewSummary);

      // Save/Cache landmarks and health score directly back to the restaurant record!
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          gbpHealthScore: auditResult.scorecard.overallScore,
          nearbyLandmarks: JSON.stringify(auditResult.landmarks)
        }
      });

      // Also trigger a re-indexing in the background to ensure new landmarks are vectorized!
      try {
        await vectorService.indexRestaurant(restaurantId);
      } catch (err) {
        console.warn('Background vector re-index failed during audit:', err);
      }

      return res.json(auditResult);
    } catch (error: any) {
      console.error('Failed to run local SEO audit:', error);
      return res.status(500).json({ error: 'SEO audit execution failed', details: error.message });
    }
  }

  /**
   * Explicit endpoint to build/refresh vector index for a restaurant
   */
  async buildIndex(req: Request, res: Response) {
    try {
      const { restaurantId } = req.body;
      if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
      }

      const chunkCount = await vectorService.indexRestaurant(restaurantId);
      return res.json({
        message: 'Vector index built successfully',
        indexedChunks: chunkCount
      });
    } catch (error: any) {
      console.error('Failed to build vector index:', error);
      return res.status(500).json({ error: 'Index build failed', details: error.message });
    }
  }
}

export const searchController = new SearchController();

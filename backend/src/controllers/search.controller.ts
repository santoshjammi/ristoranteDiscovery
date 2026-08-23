import { Request, Response } from 'express';
import prisma from '../config/db';
import { vectorService } from '../services/vector.service';
import { conversationCapability } from '../infrastructure/ai/capabilities/ConversationCapability';
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

/** Build a deterministic citation from a retrieved chunk (all in-scope). */
function citationFromChunk(match: { chunk: any }): ChatResponse['citations'][number] {
  const c = match.chunk;
  return {
    restaurantId: c.restaurantId,
    restaurantName: c.restaurant?.name ?? '',
    entityType: c.entityType,
    entityName: c.entityType === 'menuItem' ? c.textChunk.split('Dish name: ')[1]?.split(' (')[0] || 'Dish' : 'Details',
    details: c.entityType === 'menuItem' ? '$' + c.textChunk.split('($')[1]?.split(')')[0] || 'Item' : 'Info',
  };
}

export class SearchController {
  /**
   * Conversational RAG Search: Vector retrieval + LLM synthesis
   *
   * Authorization: requires an authenticated user (authMiddleware). Retrieval
   * is scoped to the restaurant IDs the user is authorized to access, and the
   * deterministic evidence allow-list is passed into the capability so AI
   * citations cannot be fabricated.
   */
  async chat(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required as a string.' });
      }

      // Retrieve the deterministic set of restaurant IDs this user may access.
      const authorizedIds = await vectorService.resolveAuthorizedRestaurantIds(userId);

      // A user with no restaurant membership/org links has NO authorized scope.
      // Return an empty result rather than falling back to an unscoped query.
      if (authorizedIds.size === 0) {
        return res.json({
          answer: "I couldn't find any restaurants matching your query in the discovery index.",
          citations: []
        });
      }

      // 1. Semantic retrieval of top 4 matching chunks, restricted to scope.
      const matches = await vectorService.searchSemantic(query, 4, authorizedIds);

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

      // Evidence allow-list derived from deterministic retrieval — the only
      // references the AI may cite. The model never determines scope.
      const retrievedEvidence = matches.map((m) => ({
        restaurantId: m.chunk.restaurantId,
        entityId: m.chunk.entityId,
        entityType: m.chunk.entityType,
      }));

      // AI synthesis of the conversational answer via the ConversationCapability.
      // Deterministic retrieval (above) stays in this controller; AI never owns it.
      const synthesis = await conversationCapability.converse({
        query,
        contextString,
        retrievedEvidence,
      });

      if (!synthesis.ok) {
        console.warn(
          `⚠️ [RAG chat] conversation capability failed (${synthesis.failure.kind}: ${synthesis.failure.message}); returning deterministic fallback.`,
        );
        return res.json({
          answer: "I couldn't synthesize a recommendation right now, but here are the most relevant matches I found.",
          citations: matches.map(citationFromChunk)
        });
      }

      // Grounding already removed any hallucinated citations inside the
      // capability. If none survive grounding, fall back to deterministic
      // citations rebuilt from retrieved chunks (which are all in-scope).
      let citations = synthesis.data.citations ?? [];
      if (citations.length === 0) {
        citations = matches.map(citationFromChunk);
      }

      const chatOutput: ChatResponse = {
        answer: synthesis.data.answer,
        citations,
      };

      return res.json(chatOutput);
    } catch (error: any) {
      console.error('RAG conversational search failed:', error);
      return res.status(500).json({ error: 'Search retrieval failed', details: error.message });
    }
  }

  /**
   * Standard semantic search endpoint returning raw chunks and similarity scores.
   * Scoped to the authenticated user's authorized restaurants.
   */
  async recommend(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const query = (req.query.q as string) || '';
      if (!query) {
        return res.status(400).json({ error: 'Query parameter q is required.' });
      }

      const authorizedIds = await vectorService.resolveAuthorizedRestaurantIds(userId);
      if (authorizedIds.size === 0) {
        return res.json([]);
      }
      const results = await vectorService.searchSemantic(query, 6, authorizedIds);
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
   * Explicit endpoint to build/refresh vector index for a restaurant.
   * Now protected by authMiddleware; scopes the target restaurant to the
   * authorized set before indexing.
   */
  async buildIndex(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { restaurantId } = req.body;
      if (!restaurantId) {
        return res.status(400).json({ error: 'restaurantId is required' });
      }

      const authorizedIds = await vectorService.resolveAuthorizedRestaurantIds(userId);
      if (!authorizedIds.has(restaurantId)) {
        return res.status(403).json({ error: 'Not authorized to index this restaurant' });
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

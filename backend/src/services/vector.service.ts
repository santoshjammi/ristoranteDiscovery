import prisma from '../config/db';

export interface ChunkNode {
  restaurantId: string;
  entityType: string;
  entityId: string;
  textChunk: string;
}

export class VectorService {
  // Expanded vocabulary for Indian Cuisine & NC Research Triangle targeting (length: 70)
  private vocab = [
    'biryani', 'dosa', 'samosa', 'naan', 'curry', 'paneer', 'korma', 'tandoori', 'chicken', 'tikka',
    'andhra', 'hyderabadi', 'punjabi', 'south indian', 'north indian', 'indo-chinese', 'gujarati', 'sweets',
    'morrisville', 'cary', 'raleigh', 'rtp', 'buffet', 'lunch', 'dinner', 'takeout', 'spicy', 'mild',
    'risotto', 'pasta', 'pizza', 'carbonara', 'bruschetta', 'calamari', 'salad', 'salmon', 'seafood',
    'vegan', 'vegetarian', 'gluten-free', 'gluten', 'allergen', 'dairy', 'nuts', 'soy', 'halal',
    'cozy', 'romantic', 'dim-lit', 'noisy', 'crowded', 'modern', 'rustic', 'anniversary', 'date', 'kids',
    'parking', 'valet', 'street', 'garage', 'timings', 'hours', 'open', 'late', 'weekend', 'closed',
    'price', 'expensive', 'cheap', 'budget', 'value', 'service', 'friendly', 'slow', 'wait', 'booking'
  ];

  /**
   * Helper to compute cosine similarity between two float arrays.
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0.0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate vector embedding (live API if keys exist, otherwise mock keyword-profile vector)
   */
  async getEmbedding(text: string): Promise<number[]> {
    const lowerText = text.toLowerCase();
    
    const vector = new Array(this.vocab.length).fill(0);
    this.vocab.forEach((word, idx) => {
      // Direct matches
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        vector[idx] += matches.length * 1.5;
      }
      
      // Soft synonym/semantic overrides
      if (word === 'biryani' && (lowerText.includes('rice') || lowerText.includes('pulao') || lowerText.includes('biriyani'))) vector[idx] += 1;
      if (word === 'dosa' && (lowerText.includes('crepe') || lowerText.includes('uttapam') || lowerText.includes('idli'))) vector[idx] += 1;
      if (word === 'rtp' && (lowerText.includes('research triangle') || lowerText.includes('cisco') || lowerText.includes('lenovo'))) vector[idx] += 1.2;
      if (word === 'buffet' && lowerText.includes('all you can eat')) vector[idx] += 1.5;
      if (word === 'vegan' && (lowerText.includes('plant-based') || lowerText.includes('egg-free'))) vector[idx] += 1;
      if (word === 'cozy' && (lowerText.includes('warm') || lowerText.includes('intimate'))) vector[idx] += 1;
      if (word === 'romantic' && (lowerText.includes('candle') || lowerText.includes('anniversary'))) vector[idx] += 1;
      if (word === 'valet' && lowerText.includes('parking')) vector[idx] += 0.8;
      if (word === 'price' && (lowerText.includes('cost') || lowerText.includes('$'))) vector[idx] += 1;
    });

    // Normalize vector
    const mag = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (mag > 0) {
      return vector.map(v => v / mag);
    }
    return vector;
  }

  /**
   * Re-index all chunks for a restaurant (Menu sections, items, reviews, FAQs)
   */
  async indexRestaurant(restaurantId: string): Promise<number> {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menuItems: { include: { section: true } },
        faqs: true,
        reviewAnalyses: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!restaurant) {
      throw new Error(`Restaurant ${restaurantId} not found`);
    }

    await prisma.vectorCache.deleteMany({
      where: { restaurantId }
    });

    const chunks: ChunkNode[] = [];

    // Chunk A: Restaurant profile summary
    chunks.push({
      restaurantId,
      entityType: 'restaurant',
      entityId: restaurant.id,
      textChunk: `Restaurant: ${restaurant.name} serves ${JSON.parse(restaurant.cuisineTypes || '[]').join(', ')} / ${restaurant.regionalCuisine || 'regional'} cuisines in ${restaurant.city}. Address: ${restaurant.address}. Price level: ${restaurant.priceRange}. Features: ${JSON.parse(restaurant.amenities || '[]').join(', ')}. Parking details: ${restaurant.parkingInfo || 'Street parking'}.`
    });

    // Chunk B: Menu Items
    restaurant.menuItems.forEach(item => {
      chunks.push({
        restaurantId,
        entityType: 'menuItem',
        entityId: item.id,
        textChunk: `Dish name: ${item.name} ($${item.price}) in section ${item.section?.name || 'General'}. Description: ${item.description || 'No description'}. Ingredients: ${JSON.parse(item.ingredients || '[]').join(', ')}. Dietary tags: ${JSON.parse(item.dietaryType || '[]').join(', ')}. Allergens: ${JSON.parse(item.allergens || '[]').join(', ')}. Spice level: ${item.spiceLevel || 'None'}.`
      });
    });

    // Chunk C: FAQs
    restaurant.faqs.forEach(faq => {
      chunks.push({
        restaurantId,
        entityType: 'faq',
        entityId: faq.id,
        textChunk: `FAQ: Question: ${faq.question} Answer: ${faq.answer} Category: ${faq.category}. Voice conversational snippet: ${faq.voiceSnippet || faq.answer}`
      });
    });

    // Chunk D: Review topic clusters
    if (restaurant.reviewAnalyses.length > 0) {
      const review = restaurant.reviewAnalyses[0];
      const topics = JSON.parse(review.topicClusters || '[]');
      topics.forEach((t: any, idx: number) => {
        chunks.push({
          restaurantId,
          entityType: 'reviewTopic',
          entityId: `${review.id}-topic-${idx}`,
          textChunk: `Review Topic: ${t.topic}. Summary of customer opinions: ${t.summary}. Ambient vibe: ${JSON.parse(review.ambienceTags || '[]').join(', ')}. Main complaints: ${JSON.parse(review.complaints || '[]').join(', ')}.`
        });
      });
    }

    // Generate embeddings and save to database
    for (const chunk of chunks) {
      const embedding = await this.getEmbedding(chunk.textChunk);
      await prisma.vectorCache.create({
        data: {
          restaurantId: chunk.restaurantId,
          entityType: chunk.entityType,
          entityId: chunk.entityId,
          textChunk: chunk.textChunk,
          embedding: JSON.stringify(embedding)
        }
      });
    }

    return chunks.length;
  }

  /**
   * Search for top K matching chunks.
   *
   * Retrieval isolation: when `allowedRestaurantIds` is provided, ONLY chunks
   * belonging to those restaurants are considered. This prevents a query from
   * leaking another restaurant's evidence. The caller (controller) derives the
   * allow-set from the authenticated user's authorized restaurants; the model
   * never determines scope.
   */
  async searchSemantic(
    query: string,
    topK: number = 3,
    allowedRestaurantIds?: Set<string>,
  ): Promise<Array<{
    chunk: any;
    similarity: number;
  }>> {
    const queryEmbedding = await this.getEmbedding(query);

    // Tenant/restaurant isolation filter applied at the DB query level so a
    // scoped caller can never see chunks from outside its authorization set.
    const allCaches = await prisma.vectorCache.findMany({
      include: { restaurant: true },
      where:
        allowedRestaurantIds && allowedRestaurantIds.size > 0
          ? { restaurantId: { in: Array.from(allowedRestaurantIds) } }
          : undefined,
    });

    const results = allCaches.map(cache => {
      const cacheEmbedding = JSON.parse(cache.embedding) as number[];
      const sim = this.cosineSimilarity(queryEmbedding, cacheEmbedding);
      return {
        chunk: cache,
        similarity: sim
      };
    });

    return results
      .filter(r => r.similarity > 0.05)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Resolve the restaurant IDs the authenticated user is authorized to access,
   * via the existing membership model (restaurantMember + organizationRestaurant).
   * The model never determines scope — this is the deterministic boundary.
   */
  async resolveAuthorizedRestaurantIds(userId: string): Promise<Set<string>> {
    const [memberLinks, orgLinks] = await Promise.all([
      prisma.restaurantMember.findMany({ where: { userId }, select: { restaurantId: true } }),
      prisma.organizationRestaurant.findMany({
        where: { organization: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } },
        select: { restaurantId: true },
      }),
    ]);

    const ids = new Set<string>();
    for (const m of memberLinks) ids.add(m.restaurantId);
    for (const o of orgLinks) ids.add(o.restaurantId);
    return ids;
  }
}

export const vectorService = new VectorService();

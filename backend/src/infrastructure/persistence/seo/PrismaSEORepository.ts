// Infrastructure: Prisma implementation of SEO repository
// Maps between domain entities and Prisma persistence model

import { PrismaClient } from '@prisma/client';
import { SEOSchema, type SchemaType } from '../../../domain/seo/SEOSchema';

export class PrismaSEORepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByRestaurantId(restaurantId: string): Promise<SEOSchema[]> {
    const records = await this.prisma.sEOMarkup.findMany({
      where: { restaurantId },
    });

    return records.map(r => new SEOSchema({
      id: r.id,
      restaurantId: r.restaurantId,
      type: r.type as SchemaType,
      jsonld: JSON.parse(r.jsonld),
      generatedAt: r.createdAt,
      isValid: true, // Will be re-validated by the audit engine
      coverageScore: 100, // Will be recalculated by the audit engine
    }));
  }

  async findAll(): Promise<SEOSchema[]> {
    const records = await this.prisma.sEOMarkup.findMany();

    return records.map(r => new SEOSchema({
      id: r.id,
      restaurantId: r.restaurantId,
      type: r.type as SchemaType,
      jsonld: JSON.parse(r.jsonld),
      generatedAt: r.createdAt,
      isValid: true,
      coverageScore: 100,
    }));
  }
}

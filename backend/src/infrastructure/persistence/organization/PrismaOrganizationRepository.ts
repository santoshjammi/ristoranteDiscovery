// Infrastructure: Prisma implementation of Organization repository

import { PrismaClient } from '@prisma/client';
import { Organization } from '../../../domain/organization/Organization';
import { type OrganizationRepository } from '../../../application/organization/OrganizationService';

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(org: Organization): Promise<void> {
    await this.prisma.organization.upsert({
      where: { id: org.id },
      update: { name: org.name },
      create: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        ownerId: org.ownerId,
      },
    });
  }

  async findById(id: string): Promise<Organization | null> {
    const record = await this.prisma.organization.findUnique({ where: { id } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const record = await this.prisma.organization.findUnique({ where: { slug } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByOwnerId(ownerId: string): Promise<Organization[]> {
    const records = await this.prisma.organization.findMany({ where: { ownerId } });
    return records.map(r => this.toDomain(r));
  }

  async addMember(orgId: string, userId: string, role: string): Promise<void> {
    await this.prisma.organizationMember.create({
      data: { organizationId: orgId, userId, role },
    });
  }

  async findMembers(orgId: string): Promise<Array<{ userId: string; name: string; email: string; role: string }>> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      include: { user: true },
    });
    return members.map(m => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));
  }

  async addRestaurant(orgId: string, restaurantId: string): Promise<void> {
    await this.prisma.organizationRestaurant.create({
      data: { organizationId: orgId, restaurantId },
    });
  }

  async findRestaurants(orgId: string): Promise<string[]> {
    const records = await this.prisma.organizationRestaurant.findMany({
      where: { organizationId: orgId },
    });
    return records.map(r => r.restaurantId);
  }

  private toDomain(record: any): Organization {
    return new Organization({
      id: record.id,
      name: record.name,
      slug: record.slug,
      ownerId: record.ownerId,
      createdAt: record.createdAt,
    });
  }
}

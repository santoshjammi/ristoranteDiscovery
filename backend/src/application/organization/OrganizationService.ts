// Application service: Organization management
// Handles organization creation, membership, restaurant linking

import { Organization } from '../../domain/organization/Organization';
import { User } from '../../domain/auth/User';

export interface OrganizationRepository {
  save(org: Organization): Promise<void>;
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByOwnerId(ownerId: string): Promise<Organization[]>;
  addMember(orgId: string, userId: string, role: string): Promise<void>;
  findMembers(orgId: string): Promise<Array<{ userId: string; name: string; email: string; role: string }>>;
  addRestaurant(orgId: string, restaurantId: string): Promise<void>;
  findRestaurants(orgId: string): Promise<string[]>;
}

export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async create(input: { name: string; ownerId: string }): Promise<Organization> {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const org = new Organization({
      id: `org-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: input.name,
      slug,
      ownerId: input.ownerId,
      createdAt: new Date(),
    });

    await this.repository.save(org);
    await this.repository.addMember(org.id, input.ownerId, 'admin');

    return org;
  }

  async getById(id: string): Promise<Organization | null> {
    return this.repository.findById(id);
  }

  async getByOwner(ownerId: string): Promise<Organization[]> {
    return this.repository.findByOwnerId(ownerId);
  }

  async getMembers(orgId: string): Promise<Array<{ userId: string; name: string; email: string; role: string }>> {
    return this.repository.findMembers(orgId);
  }

  async addMember(orgId: string, userId: string, role: string): Promise<void> {
    await this.repository.addMember(orgId, userId, role);
  }

  async addRestaurant(orgId: string, restaurantId: string): Promise<void> {
    await this.repository.addRestaurant(orgId, restaurantId);
  }

  async getRestaurants(orgId: string): Promise<string[]> {
    return this.repository.findRestaurants(orgId);
  }
}

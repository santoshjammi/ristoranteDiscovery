// Interface adapter: Organization Controller

import { Request, Response } from 'express';
import { OrganizationService } from '../../application/organization/OrganizationService';
import { PrismaOrganizationRepository } from '../../infrastructure/persistence/organization/PrismaOrganizationRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const repo = new PrismaOrganizationRepository(prisma);
const orgService = new OrganizationService(repo);

export class OrganizationController {
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.body;
      const ownerId = (req as any).userId;
      if (!name) { res.status(400).json({ error: 'name is required' }); return; }
      const org = await orgService.create({ name, ownerId });
      res.status(201).json({ data: { id: org.id, name: org.name, slug: org.slug } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const org = await orgService.getById(id);
      if (!org) { res.status(404).json({ error: 'Organization not found' }); return; }
      const members = await orgService.getMembers(id);
      const restaurantIds = await orgService.getRestaurants(id);
      res.json({ data: { id: org.id, name: org.name, slug: org.slug, members, restaurantIds } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    try {
      const ownerId = (req as any).userId;
      const orgs = await orgService.getByOwner(ownerId);
      res.json({ data: orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug })) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  addRestaurant = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { restaurantId } = req.body;
      if (!restaurantId) { res.status(400).json({ error: 'restaurantId is required' }); return; }
      await orgService.addRestaurant(id, restaurantId);
      res.status(201).json({ message: 'Restaurant added to organization' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  getMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const members = await orgService.getMembers(id);
      res.json({ data: members });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  inviteMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email, role } = req.body;
      if (!email) { res.status(400).json({ error: 'email is required' }); return; }
      // Find user by email
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      await orgService.addMember(id, user.id, role || 'member');
      res.status(201).json({ message: 'Invitation sent' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, memberId } = req.params;
      const prisma = new PrismaClient();
      await prisma.organizationMember.delete({
        where: { id: memberId },
      });
      res.json({ message: 'Member removed' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}

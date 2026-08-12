// Application — Verification Service
import { PrismaClient } from '@prisma/client';
export class VerificationService {
  constructor(private prisma: PrismaClient) {}
  async startGBPVerification(restaurantId: string) {
    // In production, this would initiate OAuth flow with Google
    // For MSP, we simulate verification
    return { status: 'pending', method: 'gbp', restaurantId, message: 'Verification initiated. Check your Google Business Profile.' };
  }
  async startDomainVerification(restaurantId: string, domain: string) {
    // In production, this would generate a DNS TXT record or meta tag
    const token = `rdi-verify-${Math.random().toString(36).slice(2, 10)}`;
    return { status: 'pending', method: 'domain', domain, token, message: `Add this TXT record to your DNS: ${token}` };
  }
  async confirm(restaurantId: string, method: string) {
    await this.prisma.organizationRestaurant.updateMany({
      where: { restaurantId },
      data: { ownershipVerified: true },
    });
    return { status: 'verified', method, restaurantId };
  }
  async getStatus(restaurantId: string) {
    const link = await this.prisma.organizationRestaurant.findFirst({ where: { restaurantId } });
    return { verified: link?.ownershipVerified || false, method: null };
  }
}

/**
 * seed-plans.ts — Populates SubscriptionPlan with the 3 US pricing tiers.
 *
 * Usage: npx ts-node scripts/seed-plans.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TIERS = [
  {
    slug: 'free',
    name: 'Free',
    description: 'Basic discoverability scorecard for a single restaurant.',
    priceMonthly: 0,
    priceYearly: 0,
    maxRestaurants: 1,
    maxMembers: 1,
    features: JSON.stringify(['1 restaurant', 'Basic scorecard', 'Community support']),
  },
  {
    slug: 'starter',
    name: 'Starter',
    description: 'Full AI-powered visibility suite for growing restaurants.',
    priceMonthly: 29,
    priceYearly: 290,
    maxRestaurants: 5,
    maxMembers: 3,
    features: JSON.stringify([
      'Up to 5 restaurants',
      'All AI visibility features',
      'Menu intelligence',
      'Review analysis',
      'Competitive intelligence',
      'Priority email support',
    ]),
  },
  {
    slug: 'growth',
    name: 'Growth',
    description: 'Multi-location suite with connectors and advanced analytics.',
    priceMonthly: 99,
    priceYearly: 990,
    maxRestaurants: 10,
    maxMembers: 10,
    features: JSON.stringify([
      'Up to 10 restaurants',
      'Full AI suite + all connectors',
      'GBP & Zomato integrations',
      'Advanced competitive intelligence',
      'Custom SEO markup',
      'Team collaboration (up to 10)',
      'Dedicated support',
    ]),
  },
];

async function seed() {
  console.log('Seeding subscription plans...');
  for (const tier of TIERS) {
    const plan = await prisma.subscriptionPlan.upsert({
      where: { slug: tier.slug },
      create: { ...tier, isActive: true },
      update: { ...tier, isActive: true },
    });
    console.log(`  ✓ ${plan.name} ($${plan.priceMonthly}/mo)`);
  }
  await prisma.$disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

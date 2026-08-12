// Seed: default admin user + connector platform definitions
// Creates admin@ristorante.app / admin123 and 5 default connectors on first run

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@ristorante.app';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Admin';

/* ── default admin ─────────────────────────────────────── */

export async function seedDefaultAdmin(): Promise<void> {
  try {
    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log(`[seed] Default admin already exists: ${ADMIN_EMAIL}`);
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        emailVerified: true,
      },
    });

    console.log(`[seed] Default admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('[seed] Failed to create default admin:', error);
  }
}

/* ── default connectors ─────────────────────────────────── */

const DEFAULT_CONNECTORS = [
  { type: 'gbp',        label: 'Google Business Profile' },
  { type: 'zomato',     label: 'Zomato' },
  { type: 'swiggy',     label: 'Swiggy' },
  { type: 'justdial',   label: 'JustDial' },
  { type: 'tripadvisor',label: 'TripAdvisor' },
];

export async function seedDefaultConnectors(): Promise<void> {
  try {
    const existing = await prisma.connector.findMany();
    const existingTypes = new Set(existing.map((c: any) => c.type));
    
    let created = 0;
    for (const conn of DEFAULT_CONNECTORS) {
      if (!existingTypes.has(conn.type)) {
        await prisma.connector.create({
          data: {
            type: conn.type,
            label: conn.label,
            status: 'not_configured',
          },
        });
        created++;
      }
    }
    
    if (created > 0) {
      const names = DEFAULT_CONNECTORS.filter(c => !existingTypes.has(c.type)).map(c => c.label);
      console.log(`[seed] Created ${created} default connector(s): ${names.join(', ')}`);
    } else {
      console.log('[seed] Default connectors already exist');
    }
  } catch (error) {
    console.error('[seed] Failed to create default connectors:', error);
  }
}

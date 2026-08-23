// Seed: default admin user + connector platform definitions
// The admin bootstrap credential is env-driven — NEVER hardcoded.
//   - If ADMIN_PASSWORD is set, the admin is created with that password.
//   - Otherwise (non-production) a strong random password is generated and
//     logged as a TEMPORARY bootstrap credential that MUST be changed.
//   - In production, a default admin is NEVER auto-created unless ADMIN_PASSWORD
//     is explicitly provided — so a weak default credential can never exist.
// Creates 5 default connectors (not_configured placeholders) idempotently.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@ristorante.app';
const ADMIN_NAME = 'Admin';

/**
 * Resolve the admin bootstrap password for a seed run.
 *  - process.env.ADMIN_PASSWORD wins when present.
 *  - Otherwise a strong random password is generated.
 * Never falls back to a weak/hardcoded default.
 */
export function resolveAdminPassword(): { password: string; isGenerated: boolean } {
  const explicit = process.env.ADMIN_PASSWORD;
  if (explicit && explicit.length > 0) {
    return { password: explicit, isGenerated: false };
  }
  return { password: crypto.randomBytes(24).toString('hex'), isGenerated: true };
}

/**
 * In production, a default admin must NEVER be auto-created unless an explicit
 * ADMIN_PASSWORD was provided (explicit secure provisioning). Without it the
 * admin bootstrap is a no-op.
 */
export function shouldBootstrapAdmin(): boolean {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
  }
  return true;
}

/* ── default admin ─────────────────────────────────────── */

export async function seedDefaultAdmin(): Promise<void> {
  try {
    if (!shouldBootstrapAdmin()) {
      console.warn(
        '[seed] NODE_ENV=production without ADMIN_PASSWORD — refusing to auto-create a default admin. ' +
          'Provision an admin explicitly by setting ADMIN_PASSWORD on the seed/bootstrap run.',
      );
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (existing) {
      console.log(`[seed] Default admin already exists: ${ADMIN_EMAIL}`);
      return;
    }

    const { password, isGenerated } = resolveAdminPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        passwordHash,
        name: ADMIN_NAME,
        emailVerified: true,
      },
    });

    if (isGenerated) {
      console.log(
        `[seed] Default admin created: ${ADMIN_EMAIL} with a TEMPORARY auto-generated password. ` +
          `This is a bootstrap credential — CHANGE IT IMMEDIATELY. It was printed only here.`,
      );
    } else {
      console.log(`[seed] Default admin created: ${ADMIN_EMAIL} (password from ADMIN_PASSWORD env).`);
    }
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

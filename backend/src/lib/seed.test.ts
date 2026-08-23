// Seed security tests — RIST-RDI-003.
// Verifies that a weak default admin credential (admin@ristorante.app / admin123)
// is NEVER created:
//   - In production, seedDefaultAdmin() NO-OPs (creates no admin) unless
//     ADMIN_PASSWORD is explicitly provided.
//   - When ADMIN_PASSWORD is set, the admin is created with that password —
//     not admin123.
//   - Outside production without ADMIN_PASSWORD, a strong random bootstrap
//     password is generated — still never admin123.
//
// These are deterministic unit tests; the Prisma client is mocked so no real
// database is touched.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  connector: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    user = prismaMock.user;
    connector = prismaMock.connector;
  },
}));

import { seedDefaultAdmin, seedDefaultConnectors, resolveAdminPassword, shouldBootstrapAdmin } from './seed';

const ADMIN_EMAIL = 'admin@ristorante.app';
const LEGACY_WEAK = 'admin123';

const originalNodeEnv = process.env.NODE_ENV;
const originalAdminPassword = process.env.ADMIN_PASSWORD;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // Restore env to avoid leaking state across tests.
  process.env.NODE_ENV = originalNodeEnv;
  if (originalAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalAdminPassword;
  vi.restoreAllMocks();
});

describe('seedDefaultAdmin — production default-credential guard', () => {
  it('NO-OPs in production without ADMIN_PASSWORD: creates no default admin', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_PASSWORD;

    // No existing admin (findUnique returns null).
    prismaMock.user.findUnique.mockResolvedValue(null);

    await seedDefaultAdmin();

    // Must not attempt to look up or create any user at all.
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('in production with ADMIN_PASSWORD, creates the admin with that (non-admin123) password', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_PASSWORD = 'S3cure-Random-Str0ng!';

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ email: ADMIN_EMAIL });

    await seedDefaultAdmin();

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    const createData = prismaMock.user.create.mock.calls[0][0].data;
    expect(createData.email).toBe(ADMIN_EMAIL);

    // The stored hash corresponds to the env password, NOT admin123.
    const hash: string = createData.passwordHash;
    expect(await bcrypt.compare(process.env.ADMIN_PASSWORD, hash)).toBe(true);
    expect(await bcrypt.compare(LEGACY_WEAK, hash)).toBe(false);
  });

  it('outside production without ADMIN_PASSWORD, uses a strong random password, never admin123', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ADMIN_PASSWORD;

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ email: ADMIN_EMAIL });

    await seedDefaultAdmin();

    expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    const createData = prismaMock.user.create.mock.calls[0][0].data;
    const hash: string = createData.passwordHash;
    expect(await bcrypt.compare(LEGACY_WEAK, hash)).toBe(false);
  });

  it('keeps idempotency — does not recreate an existing admin', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ADMIN_PASSWORD = 'anything';

    prismaMock.user.findUnique.mockResolvedValue({ email: ADMIN_EMAIL });

    await seedDefaultAdmin();

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('resolveAdminPassword / shouldBootstrapAdmin', () => {
  it('uses ADMIN_PASSWORD when explicitly set (not generated)', () => {
    process.env.ADMIN_PASSWORD = 'explicit-pass';
    const { password, isGenerated } = resolveAdminPassword();
    expect(password).toBe('explicit-pass');
    expect(isGenerated).toBe(false);
  });

  it('generates a strong random password when ADMIN_PASSWORD is not set (never admin123)', () => {
    delete process.env.ADMIN_PASSWORD;
    const { password, isGenerated } = resolveAdminPassword();
    expect(isGenerated).toBe(true);
    expect(password.length).toBeGreaterThanOrEqual(32);
    expect(password).not.toBe(LEGACY_WEAK);
  });

  it('returns false in production when ADMIN_PASSWORD is not set', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ADMIN_PASSWORD;
    expect(shouldBootstrapAdmin()).toBe(false);
  });

  it('returns true in production when ADMIN_PASSWORD is set', () => {
    process.env.NODE_ENV = 'production';
    process.env.ADMIN_PASSWORD = 'explicit-pass';
    expect(shouldBootstrapAdmin()).toBe(true);
  });
});

describe('seedDefaultConnectors — idempotent placeholders', () => {
  it('creates the 5 default connectors when none exist', async () => {
    prismaMock.connector.findMany.mockResolvedValue([]);
    await seedDefaultConnectors();
    expect(prismaMock.connector.create).toHaveBeenCalledTimes(5);
  });

  it('does not duplicate existing connectors', async () => {
    prismaMock.connector.findMany.mockResolvedValue([
      { type: 'gbp', label: 'Google Business Profile' },
    ]);
    await seedDefaultConnectors();
    expect(prismaMock.connector.create).toHaveBeenCalledTimes(4);
  });
});

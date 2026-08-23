-- AlterTable (additive: menu provenance, nullable columns, no data backfill)
ALTER TABLE "MenuItem" ADD COLUMN "sourceRef" TEXT;
ALTER TABLE "MenuSection" ADD COLUMN "sourceRef" TEXT;

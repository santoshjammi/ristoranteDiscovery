-- CreateTable
CREATE TABLE "VectorCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "textChunk" TEXT NOT NULL,
    "embedding" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VectorCache_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "postalCode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "phone" TEXT,
    "website" TEXT,
    "timings" TEXT,
    "cuisineTypes" TEXT NOT NULL,
    "priceRange" TEXT,
    "dietarySupport" TEXT NOT NULL,
    "amenities" TEXT NOT NULL,
    "ambience" TEXT NOT NULL,
    "parkingInfo" TEXT,
    "nearbyLandmarks" TEXT,
    "gbpHealthScore" INTEGER NOT NULL DEFAULT 70,
    "deliverySupport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("address", "ambience", "amenities", "city", "createdAt", "cuisineTypes", "deliverySupport", "dietarySupport", "id", "latitude", "longitude", "name", "parkingInfo", "phone", "postalCode", "priceRange", "state", "timings", "updatedAt", "website") SELECT "address", "ambience", "amenities", "city", "createdAt", "cuisineTypes", "deliverySupport", "dietarySupport", "id", "latitude", "longitude", "name", "parkingInfo", "phone", "postalCode", "priceRange", "state", "timings", "updatedAt", "website" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "VectorCache_restaurantId_entityType_idx" ON "VectorCache"("restaurantId", "entityType");

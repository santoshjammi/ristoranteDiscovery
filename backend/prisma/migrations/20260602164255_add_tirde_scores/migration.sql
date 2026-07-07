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
    "regionalCuisine" TEXT,
    "priceRange" TEXT,
    "dietarySupport" TEXT NOT NULL,
    "amenities" TEXT NOT NULL,
    "ambience" TEXT NOT NULL,
    "parkingInfo" TEXT,
    "nearbyLandmarks" TEXT,
    "gbpHealthScore" INTEGER NOT NULL DEFAULT 70,
    "deliverySupport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "discoverabilityScore" INTEGER NOT NULL DEFAULT 0,
    "aiVisibilityScore" INTEGER NOT NULL DEFAULT 0,
    "localSearchScore" INTEGER NOT NULL DEFAULT 0,
    "menuDiscoverabilityScore" INTEGER NOT NULL DEFAULT 0,
    "conversationalSearchScore" INTEGER NOT NULL DEFAULT 0,
    "dishRetrievalScore" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Restaurant" ("address", "ambience", "amenities", "city", "createdAt", "cuisineTypes", "deliverySupport", "dietarySupport", "gbpHealthScore", "id", "latitude", "longitude", "name", "nearbyLandmarks", "parkingInfo", "phone", "postalCode", "priceRange", "state", "timings", "updatedAt", "website") SELECT "address", "ambience", "amenities", "city", "createdAt", "cuisineTypes", "deliverySupport", "dietarySupport", "gbpHealthScore", "id", "latitude", "longitude", "name", "nearbyLandmarks", "parkingInfo", "phone", "postalCode", "priceRange", "state", "timings", "updatedAt", "website" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

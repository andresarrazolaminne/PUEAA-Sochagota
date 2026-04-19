-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "basePoints" INTEGER NOT NULL,
    "earlyBirdEndsAt" DATETIME,
    "earlyBirdSlots" INTEGER,
    "optimalPerCapitaM3" REAL,
    "requiresEvidence" BOOLEAN NOT NULL DEFAULT false,
    "platformManaged" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Challenge" ("basePoints", "createdAt", "description", "earlyBirdEndsAt", "earlyBirdSlots", "endsAt", "id", "optimalPerCapitaM3", "requiresEvidence", "startsAt", "title", "type", "updatedAt") SELECT "basePoints", "createdAt", "description", "earlyBirdEndsAt", "earlyBirdSlots", "endsAt", "id", "optimalPerCapitaM3", "requiresEvidence", "startsAt", "title", "type", "updatedAt" FROM "Challenge";
DROP TABLE "Challenge";
ALTER TABLE "new_Challenge" RENAME TO "Challenge";
CREATE UNIQUE INDEX "Challenge_code_key" ON "Challenge"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

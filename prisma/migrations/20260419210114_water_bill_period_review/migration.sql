-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WaterBillPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "totalM3" REAL NOT NULL,
    "householdMembers" INTEGER NOT NULL,
    "computedPerCapitaM3" REAL NOT NULL,
    "evidenceFilePath" TEXT,
    "improvementPointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "maintenancePointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaterBillPeriod_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaterBillPeriod_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaterBillPeriod_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WaterBillPeriod" ("challengeId", "computedPerCapitaM3", "createdAt", "employeeId", "evidenceFilePath", "householdMembers", "id", "improvementPointsAwarded", "maintenancePointsAwarded", "periodStart", "totalM3", "updatedAt") SELECT "challengeId", "computedPerCapitaM3", "createdAt", "employeeId", "evidenceFilePath", "householdMembers", "id", "improvementPointsAwarded", "maintenancePointsAwarded", "periodStart", "totalM3", "updatedAt" FROM "WaterBillPeriod";
DROP TABLE "WaterBillPeriod";
ALTER TABLE "new_WaterBillPeriod" RENAME TO "WaterBillPeriod";
CREATE INDEX "WaterBillPeriod_employeeId_challengeId_idx" ON "WaterBillPeriod"("employeeId", "challengeId");
CREATE INDEX "WaterBillPeriod_reviewedById_idx" ON "WaterBillPeriod"("reviewedById");
CREATE UNIQUE INDEX "WaterBillPeriod_employeeId_challengeId_periodStart_key" ON "WaterBillPeriod"("employeeId", "challengeId", "periodStart");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

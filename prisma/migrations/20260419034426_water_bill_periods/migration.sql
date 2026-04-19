-- CreateTable
CREATE TABLE "WaterBillPeriod" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WaterBillPeriod_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WaterBillPeriod_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WaterBillPeriod_employeeId_challengeId_idx" ON "WaterBillPeriod"("employeeId", "challengeId");

-- CreateIndex
CREATE UNIQUE INDEX "WaterBillPeriod_employeeId_challengeId_periodStart_key" ON "WaterBillPeriod"("employeeId", "challengeId", "periodStart");

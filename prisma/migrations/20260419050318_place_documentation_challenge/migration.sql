-- AlterTable
ALTER TABLE "DirectoryPlace" ADD COLUMN "phone" TEXT;
ALTER TABLE "DirectoryPlace" ADD COLUMN "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "PlaceDocumentationSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participationId" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "photoFilePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "rejectReason" TEXT,
    "directoryPlaceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlaceDocumentationSubmission_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "ChallengeParticipation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlaceDocumentationSubmission_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PlaceDocumentationSubmission_directoryPlaceId_fkey" FOREIGN KEY ("directoryPlaceId") REFERENCES "DirectoryPlace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaceDocumentationSubmission_directoryPlaceId_key" ON "PlaceDocumentationSubmission"("directoryPlaceId");

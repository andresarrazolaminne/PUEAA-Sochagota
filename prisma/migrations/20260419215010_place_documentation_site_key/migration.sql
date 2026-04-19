-- AlterTable
ALTER TABLE "PlaceDocumentationSubmission" ADD COLUMN "siteKey" TEXT;

-- CreateIndex
CREATE INDEX "PlaceDocumentationSubmission_siteKey_idx" ON "PlaceDocumentationSubmission"("siteKey");

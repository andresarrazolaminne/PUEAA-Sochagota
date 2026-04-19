-- AlterTable
ALTER TABLE "EvidenceSubmission" ADD COLUMN "siteAddress" TEXT;
ALTER TABLE "EvidenceSubmission" ADD COLUMN "siteKey" TEXT;
ALTER TABLE "EvidenceSubmission" ADD COLUMN "siteName" TEXT;

-- CreateIndex
CREATE INDEX "EvidenceSubmission_siteKey_idx" ON "EvidenceSubmission"("siteKey");

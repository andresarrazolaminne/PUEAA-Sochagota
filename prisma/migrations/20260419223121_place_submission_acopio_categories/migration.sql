-- CreateTable
CREATE TABLE "PlaceDocumentationSubmissionCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "PlaceDocumentationSubmissionCategory_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "PlaceDocumentationSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlaceDocumentationSubmissionCategory_category_idx" ON "PlaceDocumentationSubmissionCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceDocumentationSubmissionCategory_submissionId_category_key" ON "PlaceDocumentationSubmissionCategory"("submissionId", "category");

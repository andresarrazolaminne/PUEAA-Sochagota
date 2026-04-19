-- CreateTable
CREATE TABLE "DirectoryPlaceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placeId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "DirectoryPlaceCategory_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "DirectoryPlace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DirectoryPlaceCategory_category_idx" ON "DirectoryPlaceCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryPlaceCategory_placeId_category_key" ON "DirectoryPlaceCategory"("placeId", "category");

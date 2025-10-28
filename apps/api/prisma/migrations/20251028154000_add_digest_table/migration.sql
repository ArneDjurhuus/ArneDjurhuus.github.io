-- CreateDigest table
CREATE TABLE "Digest" (
  "id" TEXT PRIMARY KEY,
  "spaceId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Digest_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Index for latest-by-space queries
CREATE INDEX "Digest_spaceId_createdAt_idx" ON "Digest" ("spaceId", "createdAt");

CREATE TYPE "BillSplitHistoryStatus" AS ENUM ('SAVED', 'CLOSED');

CREATE TABLE "BillSplitHistory" (
  "id" TEXT NOT NULL,
  "sourceSessionId" TEXT NOT NULL,
  "hostId" TEXT NOT NULL,
  "hostName" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NPR',
  "totalAmount" DECIMAL(12,2) NOT NULL,
  "status" "BillSplitHistoryStatus" NOT NULL DEFAULT 'SAVED',
  "summary" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillSplitHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillSplitHistory_sourceSessionId_key" ON "BillSplitHistory"("sourceSessionId");
CREATE INDEX "BillSplitHistory_hostId_createdAt_idx" ON "BillSplitHistory"("hostId", "createdAt");
CREATE INDEX "BillSplitHistory_updatedAt_idx" ON "BillSplitHistory"("updatedAt");

ALTER TABLE "BillSplitHistory"
  ADD CONSTRAINT "BillSplitHistory_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

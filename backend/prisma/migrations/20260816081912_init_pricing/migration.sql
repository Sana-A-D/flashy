-- CreateEnum
CREATE TYPE "ResearchStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "PricingSource" AS ENUM ('MARKET_COMPS', 'USER_HISTORY', 'ESTIMATE', 'MANUAL');

-- AlterTable
ALTER TABLE "ListingDraft" ADD COLUMN     "price" INTEGER;

-- CreateTable
CREATE TABLE "PricingResearch" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "ResearchStatus" NOT NULL DEFAULT 'NONE',
    "recommendedPrice" INTEGER,
    "lowPrice" INTEGER,
    "highPrice" INTEGER,
    "confidence" "ConfidenceLevel" NOT NULL DEFAULT 'LOW',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "source" "PricingSource" NOT NULL DEFAULT 'ESTIMATE',
    "factors" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingResearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingResearch_itemId_key" ON "PricingResearch"("itemId");

-- CreateIndex
CREATE INDEX "PricingResearch_itemId_idx" ON "PricingResearch"("itemId");

-- AddForeignKey
ALTER TABLE "PricingResearch" ADD CONSTRAINT "PricingResearch_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

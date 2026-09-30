-- CreateTable
CREATE TABLE "EbayAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "ebayUserId" TEXT,
    "ebayUsername" TEXT,
    "marketplaceId" TEXT NOT NULL DEFAULT 'EBAY_US',
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "merchantLocationKey" TEXT,
    "fulfillmentPolicyId" TEXT,
    "paymentPolicyId" TEXT,
    "returnPolicyId" TEXT,
    "connectionStatus" TEXT NOT NULL DEFAULT 'CONNECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbayAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EbayAccount_userId_idx" ON "EbayAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EbayAccount_userId_environment_marketplaceId_key" ON "EbayAccount"("userId", "environment", "marketplaceId");

-- AddForeignKey
ALTER TABLE "EbayAccount" ADD CONSTRAINT "EbayAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

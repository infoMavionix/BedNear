-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY');

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "listingId" TEXT,
ADD COLUMN     "planCode" TEXT NOT NULL DEFAULT 'STARTER';

-- CreateIndex
CREATE INDEX "Subscription_listingId_status_idx" ON "Subscription"("listingId", "status");

-- CreateIndex
CREATE INDEX "Subscription_planCode_billingCycle_idx" ON "Subscription"("planCode", "billingCycle");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "EnquiryContactMethod" AS ENUM ('INTERESTED', 'CALL', 'WHATSAPP', 'VISIT');

-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "contactMethods" "EnquiryContactMethod"[] DEFAULT ARRAY[]::"EnquiryContactMethod"[],
ADD COLUMN     "visitCompletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "candidateId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_listingId_createdAt_idx" ON "Review"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_candidateId_idx" ON "Review"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_candidateId_listingId_key" ON "Review"("candidateId", "listingId");

-- CreateIndex
CREATE INDEX "Enquiry_visitCompletedAt_idx" ON "Enquiry"("visitCompletedAt");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

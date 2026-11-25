-- AlterTable
ALTER TABLE "Enquiry" ADD COLUMN     "candidateId" TEXT;

-- CreateIndex
CREATE INDEX "Enquiry_candidateId_createdAt_idx" ON "Enquiry"("candidateId", "createdAt");

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

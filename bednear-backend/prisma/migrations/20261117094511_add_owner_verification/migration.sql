-- CreateEnum
CREATE TYPE "OwnerVerificationStatus" AS ENUM ('PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED');

-- AlterEnum
ALTER TYPE "VerificationDocumentType" ADD VALUE 'PG_LICENSE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "verificationStatus" "OwnerVerificationStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateTable
CREATE TABLE "OwnerProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL DEFAULT 'Individual Owner',
    "address" TEXT,
    "locality" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Bengaluru',
    "state" TEXT NOT NULL DEFAULT 'Karnataka',
    "pincode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerProfile_ownerId_key" ON "OwnerProfile"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerProfile_city_locality_idx" ON "OwnerProfile"("city", "locality");

-- AddForeignKey
ALTER TABLE "OwnerProfile" ADD CONSTRAINT "OwnerProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

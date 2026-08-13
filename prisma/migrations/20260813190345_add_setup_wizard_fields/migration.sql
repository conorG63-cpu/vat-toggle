-- AlterTable
ALTER TABLE "VatSettings" ADD COLUMN     "activated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "setupCompleted" BOOLEAN NOT NULL DEFAULT false;

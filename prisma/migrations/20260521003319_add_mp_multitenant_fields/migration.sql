-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "mpAccessToken" TEXT,
ADD COLUMN     "mpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mpPublicKey" TEXT;

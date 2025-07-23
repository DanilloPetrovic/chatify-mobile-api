-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailChangeCode" TEXT;
ALTER TABLE "User" ADD COLUMN "emailChangeCodeExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;

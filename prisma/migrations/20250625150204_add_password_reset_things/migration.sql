-- AlterTable
ALTER TABLE "User" ADD COLUMN "passwordResetCode" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiresAt" DATETIME;

/*
  Warnings:

  - You are about to drop the column `relatedBetId` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_relatedBetId_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "relatedBetId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Аноним',
ADD COLUMN     "username" TEXT;

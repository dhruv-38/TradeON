/*
  Warnings:

  - You are about to drop the column `profitLoss` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "profitLoss";

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "liquidationPrice" DECIMAL(65,30);

/*
  Warnings:

  - Added the required column `expectedPrice` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expectedPrice" DECIMAL(65,30) NOT NULL;

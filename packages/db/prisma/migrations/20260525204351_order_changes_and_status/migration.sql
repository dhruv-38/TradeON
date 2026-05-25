/*
  Warnings:

  - The values [Market,Limit] on the enum `OrderType` will be removed. If these variants are still used in the database, this will fail.
  - The values [btc,sol,eth] on the enum `Symbol` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `openPrice` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `openTime` on the `Order` table. All the data in the column will be lost.
  - Added the required column `marginUsed` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `side` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Order` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderSide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'OPEN', 'FILLED', 'CANCELLED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderType_new" AS ENUM ('MARKET', 'LIMIT');
ALTER TABLE "Order" ALTER COLUMN "orderType" TYPE "OrderType_new" USING ("orderType"::text::"OrderType_new");
ALTER TYPE "OrderType" RENAME TO "OrderType_old";
ALTER TYPE "OrderType_new" RENAME TO "OrderType";
DROP TYPE "public"."OrderType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Symbol_new" AS ENUM ('BTC_USDC', 'ETH_USDC', 'SOL_USDC');
ALTER TABLE "Order" ALTER COLUMN "symbol" TYPE "Symbol_new" USING ("symbol"::text::"Symbol_new");
ALTER TYPE "Symbol" RENAME TO "Symbol_old";
ALTER TYPE "Symbol_new" RENAME TO "Symbol";
DROP TYPE "public"."Symbol_old";
COMMIT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "openPrice",
DROP COLUMN "openTime",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "executionPrice" DECIMAL(65,30),
ADD COLUMN     "marginUsed" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "side",
ADD COLUMN     "side" "OrderSide" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- DropEnum
DROP TYPE "Side";

-- DropEnum
DROP TYPE "Status";

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_symbol_idx" ON "Order"("symbol");

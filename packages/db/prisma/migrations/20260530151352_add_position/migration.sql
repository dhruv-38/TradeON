-- CreateEnum
CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "Position" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "symbol" "Symbol" NOT NULL,
    "side" "OrderSide" NOT NULL,
    "qty" DECIMAL(65,30) NOT NULL,
    "leverage" INTEGER NOT NULL,
    "entryPrice" DECIMAL(65,30) NOT NULL,
    "unrealizedPnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "realizedPnl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "PositionStatus" NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Position_orderId_key" ON "Position"("orderId");

-- CreateIndex
CREATE INDEX "Position_userId_idx" ON "Position"("userId");

-- CreateIndex
CREATE INDEX "Position_status_idx" ON "Position"("status");

-- CreateIndex
CREATE INDEX "Position_symbol_idx" ON "Position"("symbol");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

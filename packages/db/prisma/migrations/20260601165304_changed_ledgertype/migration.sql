/*
  Warnings:

  - The values [FEE,REFUND] on the enum `LedgerType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LedgerType_new" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ORDER_RESERVE', 'ORDER_RELEASE', 'TRADE', 'LIQUIDATION');
ALTER TABLE "LedgerEntry" ALTER COLUMN "type" TYPE "LedgerType_new" USING ("type"::text::"LedgerType_new");
ALTER TYPE "LedgerType" RENAME TO "LedgerType_old";
ALTER TYPE "LedgerType_new" RENAME TO "LedgerType";
DROP TYPE "public"."LedgerType_old";
COMMIT;

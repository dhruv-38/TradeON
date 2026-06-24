ALTER TABLE "Wallet" ALTER COLUMN "asset" SET DEFAULT 'USDC';
UPDATE "Wallet" SET "asset" = 'USDC' WHERE "asset" = 'USD';

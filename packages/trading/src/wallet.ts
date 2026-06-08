import {Prisma,LedgerType, LedgerStatus} from "@repo/db";

export const releaseFundsTx = async (tx: Prisma.TransactionClient, userId: number, amount: number) => {
  const result = await tx.wallet.updateMany({
    where: {
      userId,
      lockedBalance: {
        gte: amount,
      },
    },
    data: {
      availableBalance: {
        increment: amount,
      },
      lockedBalance: {
        decrement: amount,
      }
    }
  });
  if (result.count === 0) {
    throw new Error("Insufficent funds");
  }
  const wallet =
    await tx.wallet.findUnique({
      where: {
        userId,
      },
    });

  if (!wallet) {
    throw new Error("Wallet not found");
  }
  await tx.ledgerEntry.create({
    data: {
      walletId: wallet.id,
      amount,
      type: LedgerType.ORDER_RELEASE,
      status: LedgerStatus.COMPLETED

    }
  });
  return wallet;
};
import { LedgerStatus, LedgerType, prisma } from "@repo/db";
import { InsufficientFundsError } from "../../lib/errors/InsufficientFundsError.js";

export const createWallet = async (userId: number) => {
    return await prisma.wallet.create({
        data: {
            userId: userId,
            asset: "USD",
        }
    })
};

export const findWalletByUserId = async (userId: number) => {
    return await prisma.wallet.findUnique({
        where: {
            userId: userId,
        }
    })
};

export const updateBalance = async (userId: number, amount: number) => {
    return await prisma.wallet.update({
        where: {
            userId,
        },
        data: {
            availableBalance: {
                increment: amount,
            },
        }
    })
};

export const depositFunds = async (userId: number, amount: number) => {
    return await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.update({
            where: {
                userId,
            },
            data: {
                availableBalance: {
                    increment: amount,
                },
            }
        });
        await tx.ledgerEntry.create({
            data: {
                walletId: wallet.id,
                amount,
                type: LedgerType.DEPOSIT,
                status: LedgerStatus.COMPLETED

            }
        });
        return wallet;
    })
};

export const withdrawFunds = async (userId: number, amount: number) => {
    return await prisma.$transaction(async (tx) => {
        const result = await tx.wallet.updateMany({
            where: {
                userId,
                availableBalance: {
                    gte: amount,
                },
            },
            data: {
                availableBalance: {
                    decrement: amount,
                },
            }
        });
        if (result.count === 0) {
        throw new InsufficientFundsError();
      }
      const wallet =
        await tx.wallet.findUnique({
          where: {
            userId,
          },
        });

      if (!wallet) {
        throw new InsufficientFundsError("Wallet not found");
      }
        await tx.ledgerEntry.create({
            data: {
                walletId: wallet.id,
                amount,
                type: LedgerType.WITHDRAWAL,
                status: LedgerStatus.COMPLETED

            }
        });
        return wallet;
    })
};

export const checkFunds = async (userId: number) => {
    return await prisma.wallet.findUnique({
        where: {
            userId,
        }
    }
    )
}
export const reserveFunds = async (userId: number, amount: number) => {
    return await prisma.$transaction(async (tx) => {
        const result = await tx.wallet.updateMany({
            where: {
                userId,
                availableBalance: {
                    gte: amount,
                },
            },
            data: {
                availableBalance: {
                    decrement: amount,
                },
                lockedBalance:{
                    increment: amount,
                }
            }
        });
        if (result.count === 0) {
        throw new InsufficientFundsError();
      }
      const wallet =
        await tx.wallet.findUnique({
          where: {
            userId,
          },
        });

      if (!wallet) {
        throw new InsufficientFundsError("Wallet not found");
      }
        await tx.ledgerEntry.create({
            data: {
                walletId: wallet.id,
                amount,
                type: LedgerType.ORDER_RESERVE,
                status: LedgerStatus.COMPLETED

            }
        });
        return wallet;
    })
};


export const releaseFunds = async (userId: number, amount: number) => {
    return await prisma.$transaction(async (tx) => {
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
                lockedBalance:{
                    decrement: amount,
                }
            }
        });
        if (result.count === 0) {
        throw new InsufficientFundsError();
      }
      const wallet =
        await tx.wallet.findUnique({
          where: {
            userId,
          },
        });

      if (!wallet) {
        throw new InsufficientFundsError("Wallet not found");
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
    })
};

export const getLedgerEntries = async (userId: number) => {
    const wallet = await prisma.wallet.findUnique({
        where: {
          userId,
        },
      });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    return prisma.ledgerEntry.findMany({
      where: {
        walletId: wallet.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  };
import { LedgerStatus, LedgerType, prisma } from "@repo/db";

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
    return await prisma.$transaction(async (tx)=>{
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
            data:{
                walletId:wallet.id,
                amount,
                type:LedgerType.DEPOSIT,
                status:LedgerStatus.COMPLETED

            }
        });
        return wallet
})
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

export const withdrawFunds = async (userId: number, amount: number) => {
    return await prisma.wallet.update({
        where: {
            userId,
        },
        data: {
            availableBalance: {
                decrement: amount,
            },
        }
    })
};

export const reserveFunds = async (userId: number, amount: number) => {
    return await prisma.wallet.update({
        where: {
            userId,
        },
        data: {
            availableBalance: {
                decrement: amount,
            },

            lockedBalance: {
                increment: amount,
            },
        },
    })
};


export const releaseFunds = async (userId: number, amount: number) => {
    return await prisma.wallet.update({
        where: {
            userId,
        },
        data: {
            availableBalance: {
                increment: amount,
            },

            lockedBalance: {
                decrement: amount,
            },
        },
    })
};
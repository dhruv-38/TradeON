import { prisma, PositionStatus, OrderSide, LedgerType, LedgerStatus } from "@repo/db";
import { publishUserEvent } from "@repo/redis";

export const checkLiquidations = async (symbol: string, currentPrice: number) => {
    const positions = await prisma.position.findMany({
        where: {
            symbol: symbol as any,
            status:
                PositionStatus.OPEN,
        },
    });

    for (const position of positions) {
        if (!position.liquidationPrice) {
            continue;
        }

        if (position.side === OrderSide.BUY) {
            if (currentPrice <= Number(position.liquidationPrice)) {
                console.log(`LIQUIDATED ${position.id}`);

                await liquidatePosition(position.id);
                await publishUserEvent(position.userId, "position.liquidated",
                    {
                        positionId: String(position.id),
                    }
                );
            }
        }

        if (position.side === OrderSide.SELL) {
            if (currentPrice >= Number(position.liquidationPrice)) {
                console.log(`LIQUIDATED ${position.id}`);
                await liquidatePosition(position.id);
                await publishUserEvent(position.userId, "position.liquidated",
                    {
                        positionId: String(position.id),
                    }
                );

            }
        }
    }
};

const liquidatePosition = async (positionId: number) => {
    await prisma.$transaction(async (tx) => {
        const position = await tx.position.findUnique({
            where: {
                id: positionId,
            },
        });

        if (!position) {
            throw new Error("Position not found");
        }

        const wallet = await tx.wallet.findUnique({
            where: {
                userId: position.userId,
            },
        });

        if (!wallet) {
            throw new Error("Wallet not found");
        }

        const result = await tx.wallet.updateMany({
            where: {
                userId: position.userId,
                lockedBalance: {
                    gte: position.marginUsed,
                },
            },
            data: {
                lockedBalance: {
                    decrement:
                        position.marginUsed,
                },
            },
        });

        if (result.count === 0) {
            throw new Error(
                "Locked margin missing"
            );
        }

        await tx.ledgerEntry.create({
            data: {
                walletId: wallet.id,

                amount:
                    position.marginUsed,

                type:
                    LedgerType.LIQUIDATION,

                status:
                    LedgerStatus.COMPLETED,

                referenceId:
                    position.id,

                referenceType:
                    "POSITION",
            },
        });

        await tx.position.update({
            where: {
                id: position.id,
            },
            data: {
                status:
                    PositionStatus.LIQUIDATED,

                closedAt:
                    new Date(),
            },
        });

        await tx.order.update({
            where: {
                id: position.orderId,
            },
            data: {
                closeTime:
                    new Date(),
            },
        });
    });
};
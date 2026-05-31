import { LedgerStatus, LedgerType, PositionStatus, Prisma, prisma } from "@repo/db";
import { getMarketPrice } from "@repo/market";
import { releaseFundsTx } from "./execution.engine.js";

export const closePosition = async (userId: number, positionId: number) => {
    const position = await prisma.position.findFirst({
        where: {
            id: positionId,
            userId,
            status: PositionStatus.OPEN,
        },
    });

    if (!position) {
        throw new Error("Position not found");
    }

    const marketPrice = await getMarketPrice(position.symbol, position.side);

    let pnl = 0;

    if (position.side === "BUY") {
        pnl = (marketPrice - Number(position.entryPrice)) * Number(position.qty);
    } else {
        pnl = (Number(position.entryPrice) - marketPrice) * Number(position.qty);
    }

    return prisma.$transaction(async (tx) => {
        await releaseFundsTx(tx, userId, Number(position.marginUsed));
        const wallet = await tx.wallet.findUnique({
            where: {
                userId
            }
        });
        if (!wallet) {
            throw new Error("Wallet not found");
        }

        await tx.wallet.update({
            where: {
                userId,
            },
            data: {
                availableBalance: {
                    increment: pnl,
                },
            },
        });

        await tx.ledgerEntry.create({
            data: {
                walletId: wallet.id,
                amount: pnl,
                type: LedgerType.TRADE,
                status: LedgerStatus.COMPLETED,
                referenceId: position.id,
                referenceType: "POSITION",
            },
        });
        const updatedPosition = await tx.position.update({
            where: {
                id: position.id,
            },
            data: {
                status: PositionStatus.CLOSED,
                realizedPnl: new Prisma.Decimal(pnl),
                closedAt: new Date(),
            },
        });

        await tx.order.update({
            where: {
                id: position.orderId,
            },
            data: {
                closePrice: new Prisma.Decimal(marketPrice),
                closeTime: new Date(),
            },
        });

        return updatedPosition;
    }
    );
};
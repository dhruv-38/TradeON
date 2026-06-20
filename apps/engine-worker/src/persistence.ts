import {
  LedgerStatus,
  LedgerType,
  OrderStatus,
  PositionStatus,
  Prisma,
  prisma,
} from "@repo/db";
import { redis, type EngineDbEvent, type EngineSnapshot } from "@repo/redis";
import { serializeOrder, serializePosition } from "./serialization.js";

const releaseRejectedOrder = async (
  event: Extract<EngineDbEvent, { type: "order.rejected" }>,
) => {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: event.orderId, status: OrderStatus.PENDING },
      data: { status: OrderStatus.REJECTED },
    });
    if (updated.count === 0) return false;

    const wallet = await tx.wallet.findUnique({
      where: { userId: event.userId },
    });
    if (!wallet) throw new Error("Wallet not found");

    const margin = new Prisma.Decimal(event.marginUsed);
    const released = await tx.wallet.updateMany({
      where: {
        userId: event.userId,
        lockedBalance: { gte: margin },
      },
      data: {
        availableBalance: { increment: margin },
        lockedBalance: { decrement: margin },
      },
    });
    if (released.count === 0) throw new Error("Locked margin missing");

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: margin,
        type: LedgerType.ORDER_RELEASE,
        status: LedgerStatus.COMPLETED,
        referenceId: event.orderId,
        referenceType: "ORDER",
        description: event.reason,
      },
    });

    return true;
  });
};

const persistOpenedPosition = async (
  event: Extract<EngineDbEvent, { type: "position.opened" }>,
) => {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: event.order.id, status: OrderStatus.PENDING },
      data: {
        status: OrderStatus.FILLED,
        executionPrice: new Prisma.Decimal(event.order.executionPrice!),
        executedAt: new Date(event.order.executedAt!),
      },
    });
    if (updated.count === 0) return null;

    return tx.position.create({
      data: {
        id: event.position.id,
        userId: event.position.userId,
        orderId: event.position.orderId,
        symbol: event.position.symbol,
        side: event.position.side,
        qty: new Prisma.Decimal(event.position.qty),
        leverage: event.position.leverage,
        entryPrice: new Prisma.Decimal(event.position.entryPrice),
        marginUsed: new Prisma.Decimal(event.position.marginUsed),
        liquidationPrice:
          event.position.liquidationPrice === null
            ? null
            : new Prisma.Decimal(event.position.liquidationPrice),
        maintenanceMargin: new Prisma.Decimal(event.position.maintenanceMargin),
        status: PositionStatus.OPEN,
        openedAt: new Date(event.position.openedAt),
      },
    });
  });
};

const persistClosedPosition = async (
  event: Extract<EngineDbEvent, { type: "position.closed" }>,
) => {
  await prisma.$transaction(async (tx) => {
    const position = await tx.position.findUnique({
      where: { id: event.positionId },
    });
    if (
      !position ||
      position.userId !== event.userId ||
      position.status !== PositionStatus.OPEN
    ) {
      return null;
    }

    const claimed = await tx.position.updateMany({
      where: {
        id: event.positionId,
        status: PositionStatus.OPEN,
      },
      data: {
        status: PositionStatus.CLOSED,
        realizedPnl: new Prisma.Decimal(event.realizedPnl),
        closedAt: new Date(event.closedAt),
      },
    });
    if (claimed.count === 0) return null;

    const wallet = await tx.wallet.findUnique({
      where: { userId: event.userId },
    });
    if (!wallet) throw new Error("Wallet not found");

    const returnedAmount = new Prisma.Decimal(position.marginUsed).plus(
      event.realizedPnl,
    );
    const updatedWallet = await tx.wallet.updateMany({
      where: {
        userId: event.userId,
        lockedBalance: { gte: position.marginUsed },
      },
      data: {
        availableBalance: { increment: returnedAmount },
        lockedBalance: { decrement: position.marginUsed },
      },
    });
    if (updatedWallet.count === 0) throw new Error("Locked margin missing");

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: new Prisma.Decimal(event.realizedPnl),
        type: LedgerType.TRADE,
        status: LedgerStatus.COMPLETED,
        referenceType: "POSITION",
        description: `${event.reason}:${position.id}`,
      },
    });

    await tx.order.update({
      where: { id: position.orderId },
      data: {
        closePrice: new Prisma.Decimal(event.exitPrice),
        closeTime: new Date(event.closedAt),
      },
    });

    return position;
  });
};

const persistLiquidation = async (
  event: Extract<EngineDbEvent, { type: "position.liquidated" }>,
) => {
  await prisma.$transaction(async (tx) => {
    const position = await tx.position.findUnique({
      where: { id: event.positionId },
    });
    if (
      !position ||
      position.userId !== event.userId ||
      position.status !== PositionStatus.OPEN
    ) {
      return null;
    }

    const claimed = await tx.position.updateMany({
      where: {
        id: event.positionId,
        status: PositionStatus.OPEN,
      },
      data: {
        status: PositionStatus.LIQUIDATED,
        closedAt: new Date(event.closedAt),
      },
    });
    if (claimed.count === 0) return null;

    const wallet = await tx.wallet.findUnique({
      where: { userId: event.userId },
    });
    if (!wallet) throw new Error("Wallet not found");

    const updatedWallet = await tx.wallet.updateMany({
      where: {
        userId: event.userId,
        lockedBalance: { gte: position.marginUsed },
      },
      data: {
        lockedBalance: { decrement: position.marginUsed },
      },
    });
    if (updatedWallet.count === 0) throw new Error("Locked margin missing");

    await tx.ledgerEntry.create({
      data: {
        walletId: wallet.id,
        amount: position.marginUsed,
        type: LedgerType.LIQUIDATION,
        status: LedgerStatus.COMPLETED,
        referenceType: "POSITION",
        description: position.id,
      },
    });

    await tx.order.update({
      where: { id: position.orderId },
      data: {
        closePrice: new Prisma.Decimal(event.exitPrice),
        closeTime: new Date(event.closedAt),
      },
    });

    return position;
  });
};

const sendSnapshot = async (
  event: Extract<EngineDbEvent, { type: "engine.snapshot.requested" }>,
) => {
  const [pendingOrders, positions] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: [OrderStatus.PENDING, OrderStatus.OPEN] } },
    }),
    prisma.position.findMany({
      where: { status: PositionStatus.OPEN },
      include: { order: true },
    }),
  ]);

  const ordersById = new Map(
    pendingOrders.map((order) => [order.id, serializeOrder(order)]),
  );

  for (const position of positions) {
    ordersById.set(position.order.id, serializeOrder(position.order));
  }

  const snapshot: EngineSnapshot = {
    orders: [...ordersById.values()],
    positions: positions.map(serializePosition),
  };

  await redis.xAdd(event.responseStream, "*", {
    payload: JSON.stringify(snapshot),
  });
  await redis.expire(event.responseStream, 60);
};

export const persistEngineEvent = (event: EngineDbEvent) => {
  switch (event.type) {
    case "order.rejected":
      return releaseRejectedOrder(event);
    case "position.opened":
      return persistOpenedPosition(event);
    case "position.closed":
      return persistClosedPosition(event);
    case "position.liquidated":
      return persistLiquidation(event);
    case "engine.snapshot.requested":
      return sendSnapshot(event);
  }
};

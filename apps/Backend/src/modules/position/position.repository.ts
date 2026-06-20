import { prisma, PositionStatus } from "@repo/db";

export const getOpenPositions = async (userId: number) => {
  return prisma.position.findMany({
    where: {
      userId,
      status: PositionStatus.OPEN,
    },
    orderBy: {
      openedAt: "desc",
    },
  });
};

export const getClosedPositions = async (userId: number) => {
  return prisma.position.findMany({
    where: {
      userId,
      status: {
        in: [PositionStatus.CLOSED, PositionStatus.LIQUIDATED],
      },
    },
    orderBy: {
      closedAt: "desc",
    },
  });
};

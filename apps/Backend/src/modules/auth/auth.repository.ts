import { Prisma, prisma } from "@repo/db";

export const userExist = async (email: string) => {
  return await prisma.user.findUnique({
    where: {
      email,
    },
  });
};

export const createUser = async (
  name: string,
  email: string,
  password: string,
) => {
  return await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        password,
      },
    });
    const wallet = await tx.wallet.create({
      data: {
        userId: newUser.id,
        asset: "USDC",
        availableBalance: new Prisma.Decimal(100000),
      },
    });

    return { newUser, wallet };
  });
};

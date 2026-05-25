// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient,Prisma,Side,OrderType,Symbol,Status,LedgerType,LedgerStatus } from "../generated/prisma/client";

// const connectionString = `${process.env.DATABASE_URL}`;

// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });
// export { prisma, Prisma,Side,OrderType,Symbol,Status,LedgerType,LedgerStatus};

export { prisma } from "./client"; // exports instance of prisma
export * from "../generated/prisma/client"; // exports generated types from prisma
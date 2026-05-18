import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { prisma, Prisma } from "@repo/db";
import { config } from '@repo/config';
import { errorMiddleware } from './middleware/error.middleware.js';
import { walletRouter } from './modules/wallet/wallet.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';

const app = express();

app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/wallet', walletRouter);


app.get("/", async (req, res) => {
  // const users = await prisma.user.findMany();
  // console.log(users);
  // res.json(users);
  const a = new Prisma.Decimal("0.1")
  const b = new Prisma.Decimal("0.2")

  console.log(a.plus(b).toString())
  res.json({
  amount: new Prisma.Decimal("100.55")
})

});

app.use(errorMiddleware);
app.listen(3003, async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }

  console.log("server is running");
});

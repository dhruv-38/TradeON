import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma, Prisma } from "@repo/db";
import { config } from '@repo/config';
import { errorMiddleware } from './middleware/error.middleware.js';
import { walletRouter } from './modules/wallet/wallet.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { orderRouter } from './modules/order/order.routes.js';
import { positionRouter } from './modules/position/position.routes.js';
import { marketRouter } from './modules/market/market.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
  }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/wallet', walletRouter);
app.use('/api/v1/orders',orderRouter);
app.use("/api/v1/positions",positionRouter);
app.use("/api/v1/market",marketRouter);
app.get("/test-race", async (req, res) => {

  const responses = await Promise.all([
    fetch("http://localhost:3003/api/v1/wallet/withdraw", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },

      body: JSON.stringify({
        amount: 800,
      }),
    }),

    fetch("http://localhost:3003/api/v1/wallet/withdraw", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },

      body: JSON.stringify({
        amount: 500,
      }),
    }),
  ]);

  const data =
    await Promise.all(
      responses.map((r) => r.json())
    );

  res.json(data);
});


app.get("/health", (req, res) => {
  console.log("Running perfect");
  res.json({
    status:"perfect"
  });
});

app.use(errorMiddleware);
app.listen(3003, async () => {
  try {
    console.log(config.DATABASE_URL);
    await prisma.$connect();

    // REAL database test
    await prisma.$queryRaw`SELECT 1`;

    console.log("✅ REAL database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }

  console.log("server is running");
});

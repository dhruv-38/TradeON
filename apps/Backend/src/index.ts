import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middleware/error.middleware.js';
import { walletRouter } from './modules/wallet/wallet.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { orderRouter } from './modules/order/order.routes.js';
import { positionRouter } from './modules/position/position.routes.js';
import { marketRouter } from './modules/market/market.routes.js';
import { startLivePriceCache } from '@repo/market';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
      "http://localhost:3000",
      "http://tradeon.100xdc.com",
      "https://tradeon.100xdc.com"],
    credentials: true,
  }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/wallet', walletRouter);
app.use('/api/v1/orders',orderRouter);
app.use("/api/v1/positions",positionRouter);
app.use("/api/v1/market",marketRouter);


app.get("/health", (_, res) => {
  console.log("Running perfect");
  res.json({
    status:"perfect"
  });
});

app.use(errorMiddleware);

await startLivePriceCache();

app.listen(8000, () => {
  console.log("Server is running");
});

import { z } from "zod";

export const CreateOrderSchema = z.object({
  symbol: z.enum([
    "BTC_USDC",
    "ETH_USDC",
    "SOL_USDC"
  ]),

  side: z.enum([
    "BUY",
    "SELL"
  ]),

  orderType: z.enum([
    "MARKET",
    "LIMIT"
  ]),

  qty: z.number().positive(),

  leverage: z.number().int().positive(),

  takeProfit: z.number().positive().optional(),

  stopLoss: z.number().positive().optional(),

  slippage: z.number().positive().optional(),
});

export type CreateOrderInput =
  z.infer<typeof CreateOrderSchema>;
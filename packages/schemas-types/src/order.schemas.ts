import { z } from "zod";

export const CreateOrderSchema = z.object({
  symbol: z.enum(["BTC_USDC", "ETH_USDC", "SOL_USDC"]),

  side: z.enum(["BUY", "SELL"]),

  orderType: z.literal("MARKET"),

  qty: z.number().positive(),

  leverage: z.number().int().min(1).max(100),

  takeProfit: z.number().positive().optional(),

  stopLoss: z.number().positive().optional(),

  slippage: z.number().positive().max(100).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

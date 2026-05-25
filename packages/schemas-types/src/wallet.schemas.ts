import { z } from "zod";

export const DepositSchema = z.object({
  amount: z.number().positive(),
});

export const WithdrawSchema = z.object({
  amount: z.number().positive(),
});

export const ReserveSchema = z.object({
  amount: z.number().positive(),
});

export type DepositInput = z.infer<typeof DepositSchema>;
export type WithdrawInput = z.infer<typeof WithdrawSchema>;
export type ReserveInput = z.infer<typeof ReserveSchema>;
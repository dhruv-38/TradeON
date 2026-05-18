import { z } from "zod";

export const DepositSchema = z.object({
  amount: z.number().positive(),
});

export type DepositInput = z.infer<typeof DepositSchema>;
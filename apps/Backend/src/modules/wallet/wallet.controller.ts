import type { Request, Response } from "express";
import { DepositSchema, WithdrawSchema } from "@repo/schemas-types";

import { asyncHandler } from "../../lib/asyncHandler.js";

import { ValidationError } from "../../lib/errors/ValidationError.js";
import {
  depositFundsService,
  getLedgerService,
  getWalletService,
  withdrawFundsService,
} from "./wallet.service.js";

export const getWalletController = asyncHandler(async (req: Request, res: Response) => {
  const wallet = await getWalletService(req.user.id);

  return res.json({
    success: true,
    data: wallet,
  });
});

export const depositController = asyncHandler(async (
  req: Request,
  res: Response
) => {

  const result = DepositSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  const userId = req.user.id;
  const { wallet } = await depositFundsService(userId, result.data);

  return res.status(200).json({
    success: true,
    message:
      "Funds deposited successfully",
    wallet,
  });
}
);

export const withdrawController = asyncHandler(async (req: Request, res: Response) => {
  const result = WithdrawSchema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError(result.error.message);
  }
  const userId = req.user.id;
  const { wallet  } = await withdrawFundsService(userId, result.data);
  return res.status(200).json({
    success: true,
    message:
      "Funds Withdraw successfully",
    wallet,
  });
});

export const getLedgerController = asyncHandler(async (req: Request,res: Response) => {
      const entries = await getLedgerService(req.user.id);
      return res.json({
        success: true,
        data: entries,
      });
    }
  );

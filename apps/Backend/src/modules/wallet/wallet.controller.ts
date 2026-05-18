import type {Request,Response} from "express";
import { DepositSchema} from "@repo/schemas-types";

import { asyncHandler } from "../../lib/asyncHandler.js";

import { ValidationError } from "../../lib/errors/ValidationError.js";
import { depositFundsService} from "./wallet.service.js";

export const depositController = asyncHandler(async (
      req: Request,
      res: Response
    ) => {

      const result = DepositSchema.safeParse(req.body);
      if (!result.success) {
        throw new ValidationError(result.error.message);
      }
      const userId = req.user.id;
      const { wallet } = await depositFundsService(userId,result.data);

      return res.status(200).json({
        success: true,
        message:
          "Funds deposited successfully",
        wallet,
      });
    }
  );
import type {Request, Response} from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { getCandlesService } from "./market.service.js";

export const getCandlesController = asyncHandler(async (req: Request, res: Response) => {
      const symbol = String(req.query.symbol);
      const limit = Number(req.query.limit) || 500;
      const interval = String(req.query.interval || "1m");

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: "Symbol is required",
        });
      }

      const candles = await getCandlesService(symbol, limit, interval);

      return res.json({
        success: true,
        data: candles,
      });
    }
  );

import type {Request, Response} from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { getCandlesService } from "./market.service.js";

export const getCandlesController = asyncHandler(async (req: Request, res: Response) => {
      const symbol = String(req.query.symbol);
      const limit = Number(req.query.limit) || 120;
      const interval = String(req.query.interval || "1m");
      const before = typeof req.query.before === "string" ? req.query.before : undefined;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: "Symbol is required",
        });
      }

      if (before && Number.isNaN(Date.parse(before))) {
        return res.status(400).json({
          success: false,
          error: "Invalid candle cursor",
        });
      }

      const page = await getCandlesService(symbol, limit, interval, before);

      return res.json({
        success: true,
        data: page.candles,
        pagination: {
          hasMore: page.hasMore,
          nextCursor: page.nextCursor,
        },
      });
    }
  );

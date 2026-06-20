import type { Request, Response } from "express";
import { closePositionService, getLivePositionsService, getPositionHistoryService, getPositionsService } from "./position.service.js";
import { asyncHandler } from "../../lib/asyncHandler.js";

export const getPositionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const positions = await getPositionsService(req.user.id);
    return res.json({
      success: true,
      data: positions,
    });
  },
);

export const getLivePositionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const state = await getLivePositionsService(req.user.id);
    return res.json({
      success: true,
      data: state,
    });
  },
);

export const closePositionController = asyncHandler(
  async (req: Request, res: Response) => {
    const position = await closePositionService(
      req.user.id,
      String(req.params.id),
    );
    return res.json({
      success: true,
      data: position,
    });
  },
);

export const getPositionHistoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const positions = await getPositionHistoryService(req.user.id);
    return res.json({
      success: true,
      data: positions,
    });
  },
);

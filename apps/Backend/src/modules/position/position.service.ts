import {getOpenPositions, getClosedPositions } from "./position.repository.js";
import { closePosition } from "@repo/trading"
export const getPositionsService = async (userId: number) => {
    return getOpenPositions(userId);
  };

export const closePositionService = async (userId: number, positionId: number) => {
    return closePosition(userId,positionId);
  };

  export const getPositionHistoryService = async (userId: number) => {
    return getClosedPositions(userId);
  };
import { redis } from "./client.js";
import { REDIS_STREAMS } from "./streams.js";

export type SerializedOrder = {
  id: number;
  userId: number;
  orderType: "MARKET" | "LIMIT";
  side: "BUY" | "SELL";
  symbol: "BTC_USDC" | "ETH_USDC" | "SOL_USDC";
  qty: string;
  leverage: number;
  expectedPrice: string;
  takeProfit: string | null;
  stopLoss: string | null;
  slippage: string | null;
  marginUsed: string;
  executionPrice: string | null;
  closePrice: string | null;
  executedAt: string | null;
  closeTime: string | null;
  status: "PENDING" | "OPEN" | "FILLED" | "CANCELLED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
};

export type SerializedPosition = {
  id: string;
  userId: number;
  orderId: number;
  order: SerializedOrder;
  symbol: SerializedOrder["symbol"];
  side: SerializedOrder["side"];
  qty: string;
  leverage: number;
  entryPrice: string;
  marginUsed: string;
  liquidationPrice: string | null;
  maintenanceMargin: string;
  unrealizedPnl: string;
  realizedPnl: string;
  status: "OPEN" | "CLOSED" | "LIQUIDATED";
  openedAt: string;
  closedAt: string | null;
};

export type EngineCommand =
  | { type: "order.loaded"; order: SerializedOrder }
  | { type: "position.external.closed"; positionId: string }
  | {
      type: "positions.live.requested";
      userId: number;
      responseStream: string;
    };

export type LivePositionState = {
  openPositions: SerializedPosition[];
  recentHistory: SerializedPosition[];
};

export type EngineDbEvent =
  | {
      type: "order.rejected";
      orderId: number;
      userId: number;
      marginUsed: string;
      reason: "SLIPPAGE" | "MARGIN_EXCEEDED";
    }
  | {
      type: "position.opened";
      order: SerializedOrder;
      position: SerializedPosition;
    }
  | {
      type: "position.closed";
      positionId: string;
      userId: number;
      exitPrice: string;
      realizedPnl: string;
      closedAt: string;
      reason: "USER" | "TAKE_PROFIT" | "STOP_LOSS";
    }
  | {
      type: "position.liquidated";
      positionId: string;
      userId: number;
      exitPrice: string;
      closedAt: string;
    }
  | {
      type: "engine.snapshot.requested";
      responseStream: string;
    };

export type EngineSnapshot = {
  orders: SerializedOrder[];
  positions: SerializedPosition[];
};

const addJsonEvent = (stream: string, event: { type: string }) =>
  redis.xAdd(stream, "*", {
    event: event.type,
    payload: JSON.stringify(event),
  });

export const publishEngineCommand = (command: EngineCommand) =>
  addJsonEvent(REDIS_STREAMS.ENGINE_COMMANDS_STREAM, command);

export const publishEngineDbEvent = (event: EngineDbEvent) =>
  addJsonEvent(REDIS_STREAMS.ENGINE_DB_STREAM, event);

export const parseJsonEvent = <T>(payload: string | undefined): T => {
  if (!payload) {
    throw new Error("Redis event payload is missing");
  }

  return JSON.parse(payload) as T;
};

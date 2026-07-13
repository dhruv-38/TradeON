import { api } from "../../lib/api";
import type {
  Candle,
  CandlePage,
  CreateOrderPayload,
  DashboardUser,
  LedgerEntry,
  LivePositionState,
  Order,
  Position,
  SymbolCode,
  Timeframe,
  Wallet,
} from "./types";

type DataResponse<T> = {
  success: boolean;
  data: T;
};

type CandlePageResponse = DataResponse<Candle[]> & {
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
};

const CANDLE_PAGE_SIZE = 120;

export async function getCurrentUser() {
  const response = await api.get<{ success: boolean; user: DashboardUser }>(
    "/auth/me",
  );
  return response.data.user;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function getWallet() {
  const response = await api.get<DataResponse<Wallet>>("/wallet");
  return response.data.data;
}

export async function depositFunds(amount: number) {
  const response = await api.post<{ success: boolean; wallet: Wallet }>(
    "/wallet/deposit",
    {
      amount,
    },
  );
  return response.data.wallet;
}

export async function getCandles(
  symbol: SymbolCode,
  interval: Timeframe,
  options: { before?: string; signal?: AbortSignal } = {},
): Promise<CandlePage> {
  const response = await api.get<CandlePageResponse>("/market/candles", {
    params: {
      symbol,
      interval,
      limit: CANDLE_PAGE_SIZE,
      before: options.before,
    },
    signal: options.signal,
  });
  return {
    candles: response.data.data,
    hasMore: response.data.pagination.hasMore,
    nextCursor: response.data.pagination.nextCursor,
  };
}

export async function getOrders() {
  const response = await api.get<DataResponse<Order[]>>("/orders");
  return response.data.data;
}

export async function createOrder(payload: CreateOrderPayload) {
  const response = await api.post<DataResponse<Order>>("/orders", payload);
  return response.data.data;
}

export async function getPositions() {
  const response = await api.get<DataResponse<Position[]>>("/positions");
  return response.data.data;
}

export async function getLivePositionState() {
  const response =
    await api.get<DataResponse<LivePositionState>>("/positions/live");
  return response.data.data;
}

export async function getPositionHistory() {
  const response =
    await api.get<DataResponse<Position[]>>("/positions/history");
  return response.data.data;
}

export async function closePosition(positionId: string) {
  const response = await api.post<DataResponse<Position>>(
    `/positions/${positionId}/close`,
  );
  return response.data.data;
}

export async function getLedger() {
  const response = await api.get<DataResponse<LedgerEntry[]>>("/wallet/ledger");
  return response.data.data;
}

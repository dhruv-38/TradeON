import { api } from "../../lib/api";
import type {
  Candle,
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

export async function getCandles(symbol: SymbolCode, interval: Timeframe) {
  const response = await api.get<DataResponse<Candle[]>>("/market/candles", {
    params: { symbol, interval, limit: 240 },
  });
  return response.data.data;
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

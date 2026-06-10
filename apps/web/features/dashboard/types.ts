export type SymbolCode = "BTC_USDC" | "ETH_USDC" | "SOL_USDC";
export type Timeframe = "1m" | "5m" | "1h" | "4h" | "1d";
export type OrderSide = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";

export type DashboardUser = {
  id: number;
  email: string;
  name: string;
};

export type Wallet = {
  id: number;
  userId: number;
  asset: string;
  availableBalance: string;
  lockedBalance: string;
};

export type MarketPrice = {
  bid: number;
  ask: number;
  timestamp: number;
};

export type Candle = {
  bucket: string;
  symbol: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: number | string;
};

export type Order = {
  id: number;
  symbol: SymbolCode;
  side: OrderSide;
  orderType: OrderType;
  qty: string;
  leverage: number;
  expectedPrice: string;
  executionPrice: string | null;
  closePrice: string | null;
  marginUsed: string;
  takeProfit: string | null;
  stopLoss: string | null;
  status: "PENDING" | "OPEN" | "FILLED" | "CANCELLED" | "REJECTED";
  createdAt: string;
  executedAt: string | null;
};

export type Position = {
  id: number;
  symbol: SymbolCode;
  side: OrderSide;
  qty: string;
  leverage: number;
  entryPrice: string;
  marginUsed: string;
  liquidationPrice: string | null;
  unrealizedPnl: string;
  realizedPnl: string;
  status: "OPEN" | "CLOSED" | "LIQUIDATED";
  openedAt: string;
  closedAt: string | null;
};

export type LedgerEntry = {
  id: number;
  amount: string;
  type:
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "ORDER_RESERVE"
    | "ORDER_RELEASE"
    | "TRADE"
    | "LIQUIDATION";
  status: "PENDING" | "COMPLETED" | "FAILED";
  description: string | null;
  createdAt: string;
};

export type CreateOrderPayload = {
  symbol: SymbolCode;
  side: OrderSide;
  orderType: OrderType;
  qty: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  slippage?: number;
};

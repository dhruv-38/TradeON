"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActivityPanel } from "../../components/dashboard/activity-panel";
import { ChartPanel } from "../../components/dashboard/chart-panel";
import { OrderTicket } from "../../components/dashboard/order-ticket";
import { getApiErrorMessage } from "../../lib/api";
import { useAuthStore } from "../../store/auth.store";
import {
  closePosition,
  createOrder,
  depositFunds,
  getCandles,
  getCurrentUser,
  getLedger,
  getOrders,
  getPositionHistory,
  getPositions,
  getWallet,
  logout,
} from "./api";
import type {
  Candle,
  CreateOrderPayload,
  LedgerEntry,
  LivePriceMap,
  MarketPrice,
  Order,
  Position,
  SymbolCode,
  Timeframe,
  Wallet,
} from "./types";

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
const SYMBOL_OPTIONS: Array<{
  symbol: SymbolCode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    symbol: "BTC_USDC",
    label: "BTC / USDC",
    shortLabel: "BTC",
    description: "Bitcoin perpetual",
  },
  {
    symbol: "ETH_USDC",
    label: "ETH / USDC",
    shortLabel: "ETH",
    description: "Ethereum perpetual",
  },
  {
    symbol: "SOL_USDC",
    label: "SOL / USDC",
    shortLabel: "SOL",
    description: "Solana perpetual",
  },
];

export function DashboardClient() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const [userName, setUserName] = useState("");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionHistory, setPositionHistory] = useState<Position[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolCode>("BTC_USDC");
  const [livePrices, setLivePrices] = useState<LivePriceMap>({});
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [loadedTimeframe, setLoadedTimeframe] = useState<Timeframe>("1h");
  const [isAccountLoading, setIsAccountLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isFundingWallet, setIsFundingWallet] = useState(false);
  const [closingPositionId, setClosingPositionId] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const selectedMarket =
    SYMBOL_OPTIONS.find((option) => option.symbol === selectedSymbol) ?? SYMBOL_OPTIONS[0]!;
  const livePrice = livePrices[selectedSymbol] ?? null;

  const refreshAccountData = async () => {
    const [nextWallet, nextOrders, nextPositions, nextHistory, nextLedger] =
      await Promise.all([
        getWallet(),
        getOrders(),
        getPositions(),
        getPositionHistory(),
        getLedger(),
      ]);

    setWallet(nextWallet);
    setOrders(nextOrders);
    setPositions(nextPositions);
    setPositionHistory(nextHistory);
    setLedger(nextLedger);
  };

  useEffect(() => {
    let isActive = true;

    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (!isActive) {
          return;
        }

        setUser(currentUser);
        setUserName(currentUser.name);
        await refreshAccountData();
      } catch (error) {
        if (!isActive) {
          return;
        }

        clearUser();
        setConnectionError(getApiErrorMessage(error));
        router.replace("/auth/login");
      } finally {
        if (isActive) {
          setIsAccountLoading(false);
        }
      }
    };

    initialize();
    return () => {
      isActive = false;
    };
  }, [clearUser, router, setUser]);

  useEffect(() => {
    let isActive = true;
    setIsChartLoading(true);

    getCandles(selectedSymbol, timeframe)
      .then((data) => {
        if (isActive) {
          setCandles(data);
          setLoadedTimeframe(timeframe);
          setConnectionError(null);
        }
      })
      .catch((error) => {
        if (isActive) {
          setConnectionError(getApiErrorMessage(error));
          setCandles([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsChartLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedSymbol, timeframe]);

  useEffect(() => {
    const socket = new WebSocket(WEBSOCKET_URL);

    socket.addEventListener("open", () => {
      setConnectionError(null);
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as {
        type?: string;
      } & Partial<Record<SymbolCode, MarketPrice | null>>;

      if (message.type === "prices") {
        setLivePrices((current) => ({
          ...current,
          BTC_USDC: message.BTC_USDC ?? current.BTC_USDC ?? null,
          ETH_USDC: message.ETH_USDC ?? current.ETH_USDC ?? null,
          SOL_USDC: message.SOL_USDC ?? current.SOL_USDC ?? null,
        }));
      }
    });
    socket.addEventListener("error", () => {
      setConnectionError("Live prices are temporarily unavailable.");
    });

    return () => socket.close();
  }, []);

  const handleCreateOrder = async (payload: CreateOrderPayload) => {
    setOrderError(null);
    setOrderMessage(null);
    setIsSubmittingOrder(true);

    try {
      await createOrder(payload);
      setOrderMessage("Order submitted successfully.");
      await refreshAccountData();
      window.setTimeout(() => {
        refreshAccountData().catch(() => undefined);
      }, 1000);
    } catch (error) {
      setOrderError(getApiErrorMessage(error));
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleDeposit = async (amount: number) => {
    setOrderError(null);
    setOrderMessage(null);
    setIsFundingWallet(true);

    try {
      const nextWallet = await depositFunds(amount);
      setWallet(nextWallet);
      setOrderMessage("Funds added successfully.");
      setLedger(await getLedger());
    } catch (error) {
      setOrderError(getApiErrorMessage(error));
    } finally {
      setIsFundingWallet(false);
    }
  };

  const handleClosePosition = async (positionId: number) => {
    setClosingPositionId(positionId);
    setConnectionError(null);

    try {
      await closePosition(positionId);
      await refreshAccountData();
    } catch (error) {
      setConnectionError(getApiErrorMessage(error));
    } finally {
      setClosingPositionId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearUser();
      router.replace("/auth/login");
    }
  };

  const marketSummary = getMarketSummary(candles, livePrice);

  return (
    <main className="flex h-screen flex-col gap-1 overflow-hidden bg-[#e8eef3] p-1 font-['Segoe_UI_Variable','Segoe_UI',sans-serif] text-[#263747]">
      <header className="flex h-13 shrink-0 items-center border-b border-[#d7e0e8] bg-white px-5">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TradeON home">
          <span className="relative h-8 w-8 shrink-0 overflow-hidden">
            <Image
              src="/tradeon-logo.png"
              alt=""
              width={1211}
              height={732}
              className="absolute left-1/2 top-[-13px] h-auto w-[128px] max-w-none -translate-x-1/2"
              priority
            />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.03em] text-[#263747]">
            TradeON
          </span>
        </Link>

        {connectionError ? (
          <p className="ml-5 hidden text-[11px] font-semibold text-[#d44946] md:block">
            {connectionError}
          </p>
        ) : (
          <span className="ml-5 hidden items-center gap-1.5 text-[10px] font-semibold text-[#6a89a7] md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#19a974]" />
            Live
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7b8d9d]">
              Equity
            </p>
            <p className="text-xs font-bold text-[#263747]">
              {formatCurrency(
                Number(wallet?.availableBalance ?? 0) + Number(wallet?.lockedBalance ?? 0),
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={userName ? `Log out ${userName}` : "Log out"}
            aria-label="Log out"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#cad6e0] bg-white text-xs font-bold text-[#384959] transition hover:border-[#6a89a7] hover:bg-[#f3f7fa]"
          >
            {userName.charAt(0).toUpperCase() || "U"}
          </button>
        </div>
      </header>

      <section className="flex h-16 shrink-0 items-center justify-between border-b border-[#d7e0e8] bg-[#fbfcfd] px-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {SYMBOL_OPTIONS.map((option) => {
              const isActive = option.symbol === selectedSymbol;
              return (
                <button
                  key={option.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(option.symbol)}
                  className={`flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-left transition ${
                    isActive
                      ? "border-[#6a89a7] bg-[#edf4fa] shadow-[inset_0_0_0_1px_rgba(136,189,242,0.3)]"
                      : "border-[#d7e0e8] bg-white hover:border-[#a9bac8] hover:bg-[#f8fbfd]"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black ${
                      isActive
                        ? "bg-[#f59e0b] text-white"
                        : "bg-[#eef3f7] text-[#58758e]"
                    }`}
                  >
                    {option.shortLabel}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-[#263747]">
                      {option.label}
                    </span>
                    <span className="block text-[10px] font-medium text-[#7b8d9d]">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="hidden md:block">
            <span className="rounded bg-[#e7f1f9] px-1.5 py-0.5 text-[10px] font-bold text-[#58758e]">
              {livePrice ? selectedMarket.description : `Waiting for ${selectedMarket.shortLabel} price`}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-9 md:flex">
          <MarketStat label="Mark Price" value={formatPrice(marketSummary.mark)} accent />
          <MarketStat
            label="Period Change"
            value={formatPercent(marketSummary.changePercent)}
            accent={marketSummary.changePercent >= 0}
            negative={marketSummary.changePercent < 0}
          />
          <MarketStat label="Period High" value={formatPrice(marketSummary.high)} />
          <MarketStat label="Period Low" value={formatPrice(marketSummary.low)} />
          <MarketStat label="Available" value={formatCurrency(Number(wallet?.availableBalance ?? 0))} />
        </div>
      </section>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-1 bg-[#e8eef3] lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-h-0 grid-rows-[minmax(360px,64%)_minmax(180px,36%)] gap-1 bg-[#e8eef3]">
          <ChartPanel
            candles={candles}
            livePrice={livePrice}
            symbol={selectedSymbol}
            timeframe={timeframe}
            loadedTimeframe={loadedTimeframe}
            isLoading={isChartLoading}
            onTimeframeChange={setTimeframe}
          />
          <ActivityPanel
            positions={positions}
            orders={orders}
            positionHistory={positionHistory}
            ledger={ledger}
            livePrices={livePrices}
            isLoading={isAccountLoading}
            closingPositionId={closingPositionId}
            onClosePosition={handleClosePosition}
          />
        </div>

        <div className="hidden min-h-0 bg-white lg:block">
          <OrderTicket
            symbol={selectedSymbol}
            wallet={wallet}
            livePrice={livePrice}
            isSubmitting={isSubmittingOrder}
            isFunding={isFundingWallet}
            errorMessage={orderError}
            successMessage={orderMessage}
            onSubmit={handleCreateOrder}
            onDeposit={handleDeposit}
          />
        </div>
      </div>
    </main>
  );
}

function MarketStat({
  label,
  value,
  accent = false,
  negative = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  negative?: boolean;
}) {
  const color = negative ? "text-[#ef5350]" : accent ? "text-[#119b68]" : "text-[#263747]";

  return (
    <div className="min-w-20">
      <p className="text-[10px] font-medium text-[#7b8d9d]">{label}</p>
      <p className={`mt-1 text-xs font-bold ${color}`}>{value}</p>
    </div>
  );
}

function getMarketSummary(candles: Candle[], livePrice: MarketPrice | null) {
  if (candles.length === 0) {
    return {
      mark: livePrice?.ask,
      high: undefined,
      low: undefined,
      changePercent: 0,
    };
  }

  const first = candles[0];
  const last = candles.at(-1);
  const open = Number(first?.open ?? 0);
  const close = Number(livePrice?.ask ?? last?.close ?? 0);

  return {
    mark: close,
    high: Math.max(...candles.map((candle) => Number(candle.high))),
    low: Math.min(...candles.map((candle) => Number(candle.low))),
    changePercent: open > 0 ? ((close - open) / open) * 100 : 0,
  };
}

function formatPrice(value: number | undefined) {
  return value === undefined
    ? "—"
    : value.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

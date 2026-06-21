"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
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
  getLivePositionState,
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
    description: "Bitcoin",
  },
  {
    symbol: "ETH_USDC",
    label: "ETH / USDC",
    shortLabel: "ETH",
    description: "Ethereum",
  },
  {
    symbol: "SOL_USDC",
    label: "SOL / USDC",
    shortLabel: "SOL",
    description: "Solana",
  },
];

export function DashboardClient() {
  const router = useRouter();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
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
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isDepositFormOpen, setIsDepositFormOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [closingPositionId, setClosingPositionId] = useState<string | null>(
    null,
  );
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const selectedMarket =
    SYMBOL_OPTIONS.find((option) => option.symbol === selectedSymbol) ??
    SYMBOL_OPTIONS[0]!;
  const livePrice = livePrices[selectedSymbol] ?? null;

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return;
    }

    const closeAccountMenu = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
        setIsDepositFormOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, [isAccountMenuOpen]);

  const refreshAccountData = async () => {
    const [nextWallet, nextOrders, liveState, nextHistory, nextLedger] =
      await Promise.all([
        getWallet(),
        getOrders(),
        getLivePositionState(),
        getPositionHistory(),
        getLedger(),
      ]);

    setWallet(nextWallet);
    setOrders(nextOrders);
    setPositions(liveState.openPositions);
    setPositionHistory(
      mergePositionHistory(liveState.recentHistory, nextHistory),
    );
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
    if (currentUserId === null) {
      return;
    }

    const socket = new WebSocket(WEBSOCKET_URL);
    let liveRefreshTimer: number | undefined;

    const scheduleLivePositionRefresh = () => {
      if (liveRefreshTimer !== undefined) {
        window.clearTimeout(liveRefreshTimer);
      }

      liveRefreshTimer = window.setTimeout(() => {
        getLivePositionState()
          .then((state) => {
            setPositions(state.openPositions);
            setPositionHistory((current) =>
              mergePositionHistory(state.recentHistory, current),
            );
          })
          .catch((error) => {
            setConnectionError(getApiErrorMessage(error));
          });
      }, 50);
    };

    socket.addEventListener("open", () => {
      setConnectionError(null);
      socket.send(JSON.stringify({ type: "subscribe", userId: currentUserId }));
      socket.send(JSON.stringify({ type: "positions", userId: currentUserId }));
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as {
        type?: string;
        event?: string;
        positionId?: string;
        unrealizedPnl?: number;
      } & Partial<Record<SymbolCode, MarketPrice | null>>;

      if (message.type === "prices") {
        setLivePrices((current) => ({
          ...current,
          BTC_USDC: message.BTC_USDC ?? current.BTC_USDC ?? null,
          ETH_USDC: message.ETH_USDC ?? current.ETH_USDC ?? null,
          SOL_USDC: message.SOL_USDC ?? current.SOL_USDC ?? null,
        }));
        return;
      }

      if (
        message.type === "position.update" &&
        message.positionId &&
        message.unrealizedPnl !== undefined
      ) {
        setPositions((current) =>
          current.map((position) =>
            position.id === message.positionId
              ? {
                  ...position,
                  unrealizedPnl: String(message.unrealizedPnl),
                }
              : position,
          ),
        );
        return;
      }

      if (
        message.event === "position.opened" ||
        message.event === "position.closed" ||
        message.event === "position.liquidated"
      ) {
        scheduleLivePositionRefresh();
      }
    });

    socket.addEventListener("error", () => {
      setConnectionError("Live market updates are temporarily unavailable.");
    });

    return () => {
      if (liveRefreshTimer !== undefined) {
        window.clearTimeout(liveRefreshTimer);
      }
      socket.close();
    };
  }, [currentUserId]);

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
      return true;
    } catch (error) {
      setOrderError(getApiErrorMessage(error));
      return false;
    } finally {
      setIsFundingWallet(false);
    }
  };

  const handleDepositSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(depositAmount);
    if (amount <= 0) {
      return;
    }

    const succeeded = await handleDeposit(amount);
    if (succeeded) {
      setDepositAmount("");
      setIsDepositFormOpen(false);
      setIsAccountMenuOpen(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    setClosingPositionId(positionId);
    setConnectionError(null);

    try {
      const closedPosition = await closePosition(positionId);
      setPositions((current) =>
        current.filter((position) => position.id !== positionId),
      );
      setPositionHistory((current) =>
        mergePositionHistory([closedPosition], current),
      );
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
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="TradeON home"
        >
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
                Number(wallet?.availableBalance ?? 0) +
                  Number(wallet?.lockedBalance ?? 0),
              )}
            </p>
          </div>
          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsAccountMenuOpen((open) => !open);
                setIsDepositFormOpen(false);
              }}
              title={userName ? `${userName} account menu` : "Account menu"}
              aria-label="Open account menu"
              aria-expanded={isAccountMenuOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#cad6e0] bg-white text-xs font-bold text-[#384959] transition hover:border-[#6a89a7] hover:bg-[#f3f7fa]"
            >
              {userName.charAt(0).toUpperCase() || "U"}
            </button>

            {isAccountMenuOpen ? (
              <div className="absolute right-0 top-10 z-50 w-60 rounded-md border border-[#d7e0e8] bg-white p-2 shadow-[0_12px_32px_rgba(38,55,71,0.16)]">
                {isDepositFormOpen ? (
                  <form
                    onSubmit={handleDepositSubmit}
                    className="space-y-3 p-2"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#263747]">
                        Deposit funds
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#7b8d9d]">
                        Add USDC to your trading balance.
                      </p>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-[11px] font-medium text-[#7b8d9d]">
                        Amount
                      </span>
                      <input
                        suppressHydrationWarning
                        autoFocus
                        type="number"
                        min="1"
                        step="any"
                        value={depositAmount}
                        onChange={(event) =>
                          setDepositAmount(event.target.value)
                        }
                        placeholder="0.00"
                        className="h-9 w-full rounded border border-[#d3dce4] bg-[#f8fafb] px-3 text-sm font-semibold outline-none focus:border-[#6a89a7] focus:bg-white"
                      />
                    </label>
                    {orderError ? (
                      <p className="text-[11px] font-medium text-[#d44946]">
                        {orderError}
                      </p>
                    ) : null}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsDepositFormOpen(false);
                          setDepositAmount("");
                        }}
                        className="h-9 rounded border border-[#d3dce4] text-xs font-bold text-[#58758e] transition hover:bg-[#f3f7fa]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isFundingWallet || Number(depositAmount) <= 0}
                        className="h-9 rounded bg-[#263747] text-xs font-bold text-white transition hover:bg-[#384959] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isFundingWallet ? "Adding..." : "Deposit"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setOrderError(null);
                        setOrderMessage(null);
                        setIsDepositFormOpen(true);
                      }}
                      className="flex h-10 w-full items-center rounded px-3 text-left text-xs font-semibold text-[#263747] transition hover:bg-[#f3f7fa]"
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-10 w-full items-center rounded px-3 text-left text-xs font-semibold text-[#d44946] transition hover:bg-[#ef5350]/5"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
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
              {livePrice
                ? selectedMarket.description
                : `Waiting for ${selectedMarket.shortLabel} price`}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-9 md:flex">
          <MarketStat
            label="Mark Price"
            value={formatPrice(marketSummary.mark)}
            accent
          />
          <MarketStat
            label="Period Change"
            value={formatPercent(marketSummary.changePercent)}
            accent={marketSummary.changePercent >= 0}
            negative={marketSummary.changePercent < 0}
          />
          <MarketStat
            label="Period High"
            value={formatPrice(marketSummary.high)}
          />
          <MarketStat
            label="Period Low"
            value={formatPrice(marketSummary.low)}
          />
          <MarketStat
            label="Available"
            value={formatCurrency(Number(wallet?.availableBalance ?? 0))}
          />
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
            errorMessage={orderError}
            successMessage={orderMessage}
            onSubmit={handleCreateOrder}
          />
        </div>
      </div>
    </main>
  );
}

function mergePositionHistory(recent: Position[], persisted: Position[]) {
  const positionsById = new Map(
    persisted.map((position) => [position.id, position]),
  );

  for (const position of recent) {
    positionsById.set(position.id, position);
  }

  return [...positionsById.values()].sort((left, right) => {
    const leftTime = left.closedAt ? new Date(left.closedAt).getTime() : 0;
    const rightTime = right.closedAt ? new Date(right.closedAt).getTime() : 0;
    return rightTime - leftTime;
  });
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
  const color = negative
    ? "text-[#ef5350]"
    : accent
      ? "text-[#119b68]"
      : "text-[#263747]";

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

"use client";

import { useState } from "react";
import type {
  LedgerEntry,
  LivePriceMap,
  Order,
  Position,
} from "../../features/dashboard/types";

const tabs = [
  "Positions",
  "Order History",
  "Position History",
  "Ledger",
] as const;

type Tab = (typeof tabs)[number];

type ActivityPanelProps = {
  positions: Position[];
  orders: Order[];
  positionHistory: Position[];
  ledger: LedgerEntry[];
  livePrices: LivePriceMap;
  isLoading: boolean;
  closingPositionId: string | null;
  onClosePosition: (positionId: string) => Promise<void>;
};

export function ActivityPanel({
  positions,
  orders,
  positionHistory,
  ledger,
  livePrices,
  isLoading,
  closingPositionId,
  onClosePosition,
}: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Positions");

  return (
    <section className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex h-11 shrink-0 items-center gap-7 overflow-x-auto border-b border-[#e1e7ec] bg-white px-5">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`h-full shrink-0 border-b-2 text-xs font-semibold transition ${
              activeTab === tab
                ? "border-[#263747] text-[#263747]"
                : "border-transparent text-[#7b8d9d] hover:text-[#263747]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {isLoading ? (
          <EmptyState message={`Loading ${activeTab.toLowerCase()}...`} />
        ) : (
          <TabContent
            activeTab={activeTab}
            positions={positions}
            orders={orders}
            positionHistory={positionHistory}
            ledger={ledger}
            livePrices={livePrices}
            closingPositionId={closingPositionId}
            onClosePosition={onClosePosition}
          />
        )}
      </div>
    </section>
  );
}

function TabContent({
  activeTab,
  positions,
  orders,
  positionHistory,
  ledger,
  livePrices,
  closingPositionId,
  onClosePosition,
}: Omit<ActivityPanelProps, "isLoading"> & { activeTab: Tab }) {
  if (activeTab === "Positions") {
    if (positions.length === 0) {
      return <EmptyState message="No open positions." />;
    }

    return (
      <DataTable
        headings={[
          "Market",
          "Side",
          "Size",
          "Entry Price",
          "Mark Price",
          "Liquidation",
          "Unrealized PnL",
          "Action",
        ]}
      >
        {positions.map((position) => {
          const symbolPrice = livePrices[position.symbol] ?? null;
          const markPrice =
            position.side === "BUY" ? symbolPrice?.bid : symbolPrice?.ask;
          const pnl = calculatePnl(position, markPrice);
          const asset = getBaseAsset(position.symbol);

          return (
            <tr
              key={position.id}
              className="border-b border-[#edf1f4] hover:bg-[#fafcfd]"
            >
              <Cell strong>{formatSymbol(position.symbol)}</Cell>
              <SideCell side={position.side} />
              <Cell>
                {formatNumber(position.qty)} {asset}
              </Cell>
              <Cell>{formatPrice(position.entryPrice)}</Cell>
              <Cell>{formatPrice(markPrice)}</Cell>
              <Cell>{formatPrice(position.liquidationPrice)}</Cell>
              <PnlCell value={pnl} />
              <td className="px-5 py-3">
                <button
                  type="button"
                  disabled={closingPositionId === position.id}
                  onClick={() => onClosePosition(position.id)}
                  className="rounded border border-[#cad6e0] bg-white px-3 py-1.5 font-semibold text-[#35495b] transition hover:border-[#6a89a7] hover:bg-[#f3f7fa] disabled:opacity-50"
                >
                  {closingPositionId === position.id ? "Closing..." : "Close"}
                </button>
              </td>
            </tr>
          );
        })}
      </DataTable>
    );
  }

  if (activeTab === "Order History") {
    return orders.length ? (
      <OrdersTable orders={orders} />
    ) : (
      <EmptyState message="No order history." />
    );
  }

  if (activeTab === "Position History") {
    if (positionHistory.length === 0) {
      return <EmptyState message="No closed positions." />;
    }

    return (
      <DataTable
        headings={[
          "Market",
          "Side",
          "Size",
          "Entry",
          "Realized PnL",
          "Status",
          "Closed",
        ]}
      >
        {positionHistory.map((position) => (
          <tr
            key={position.id}
            className="border-b border-[#edf1f4] hover:bg-[#fafcfd]"
          >
            <Cell strong>{formatSymbol(position.symbol)}</Cell>
            <SideCell side={position.side} />
            <Cell>
              {formatNumber(position.qty)} {getBaseAsset(position.symbol)}
            </Cell>
            <Cell>{formatPrice(position.entryPrice)}</Cell>
            <PnlCell value={Number(position.realizedPnl)} />
            <Cell>{position.status}</Cell>
            <Cell>{formatDate(position.closedAt)}</Cell>
          </tr>
        ))}
      </DataTable>
    );
  }

  if (ledger.length === 0) {
    return <EmptyState message="No wallet activity yet." />;
  }

  return (
    <DataTable headings={["Type", "Amount", "Status", "Description", "Date"]}>
      {ledger.map((entry) => (
        <tr
          key={entry.id}
          className="border-b border-[#edf1f4] hover:bg-[#fafcfd]"
        >
          <Cell strong>{entry.type.replaceAll("_", " ")}</Cell>
          <Cell>{formatPrice(entry.amount)} USDC</Cell>
          <Cell>{entry.status}</Cell>
          <Cell>{entry.description ?? "—"}</Cell>
          <Cell>{formatDate(entry.createdAt)}</Cell>
        </tr>
      ))}
    </DataTable>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  return (
    <DataTable
      headings={[
        "Market",
        "Side",
        "Type",
        "Size",
        "Expected Price",
        "Leverage",
        "Status",
        "Created",
      ]}
    >
      {orders.map((order) => (
        <tr
          key={order.id}
          className="border-b border-[#edf1f4] hover:bg-[#fafcfd]"
        >
          <Cell strong>{formatSymbol(order.symbol)}</Cell>
          <SideCell side={order.side} />
          <Cell>{order.orderType}</Cell>
          <Cell>
            {formatNumber(order.qty)} {getBaseAsset(order.symbol)}
          </Cell>
          <Cell>
            {formatPrice(order.executionPrice ?? order.expectedPrice)}
          </Cell>
          <Cell>{order.leverage}x</Cell>
          <Cell>{order.status}</Cell>
          <Cell>{formatDate(order.createdAt)}</Cell>
        </tr>
      ))}
    </DataTable>
  );
}

function DataTable({
  headings,
  children,
}: {
  headings: string[];
  children: React.ReactNode;
}) {
  return (
    <table className="w-full min-w-[920px] border-collapse text-left text-xs">
      <thead className="sticky top-0 bg-[#f7f9fb] text-[#718596]">
        <tr>
          {headings.map((heading) => (
            <th
              key={heading}
              className="border-b border-[#e1e7ec] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.03em]"
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-[#35495b]">{children}</tbody>
    </table>
  );
}

function Cell({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td className={`px-5 py-3 ${strong ? "font-semibold text-[#263747]" : ""}`}>
      {children}
    </td>
  );
}

function SideCell({ side }: { side: "BUY" | "SELL" }) {
  return (
    <td
      className={`px-5 py-3 font-semibold ${side === "BUY" ? "text-[#19a974]" : "text-[#ef5350]"}`}
    >
      {side === "BUY" ? "Long" : "Short"}
    </td>
  );
}

function PnlCell({ value }: { value: number }) {
  return (
    <td
      className={`px-5 py-3 font-semibold ${value >= 0 ? "text-[#19a974]" : "text-[#ef5350]"}`}
    >
      {value >= 0 ? "+" : ""}
      {value.toFixed(2)} USDC
    </td>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-36 items-center justify-center text-xs font-semibold text-[#7b8d9d]">
      {message}
    </div>
  );
}

function calculatePnl(position: Position, markPrice?: number) {
  if (!markPrice) {
    return Number(position.unrealizedPnl);
  }

  const entry = Number(position.entryPrice);
  const quantity = Number(position.qty);
  return position.side === "BUY"
    ? (markPrice - entry) * quantity
    : (entry - markPrice) * quantity;
}

function formatSymbol(symbol: string) {
  return symbol.replace("_", "/");
}

function getBaseAsset(symbol: string) {
  return symbol.split("_")[0] ?? symbol;
}

function formatNumber(value: string | number) {
  return Number(value).toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatPrice(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

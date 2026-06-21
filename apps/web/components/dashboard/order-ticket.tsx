"use client";

import { useState } from "react";
import type {
  CreateOrderPayload,
  MarketPrice,
  OrderSide,
  SymbolCode,
  Wallet,
} from "../../features/dashboard/types";

type OrderTicketProps = {
  symbol: SymbolCode;
  wallet: Wallet | null;
  livePrice: MarketPrice | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmit: (payload: CreateOrderPayload) => Promise<void>;
};

const LEVERAGE_OPTIONS = [
  1,
  ...Array.from({ length: 50 }, (_, index) => (index + 1) * 2),
];

export function OrderTicket({
  symbol,
  wallet,
  livePrice,
  isSubmitting,
  errorMessage,
  successMessage,
  onSubmit,
}: OrderTicketProps) {
  const [side, setSide] = useState<OrderSide>("BUY");
  const [quantity, setQuantity] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");

  const marketPrice = side === "BUY" ? livePrice?.ask : livePrice?.bid;
  const baseAsset = symbol.replace(/_USDC$/, "");
  const availableBalance = Number(wallet?.availableBalance ?? 0);
  const quantityValue = Number(quantity || 0);
  const orderValue = quantityValue * Number(marketPrice ?? 0);
  const marginRequired = leverage > 0 ? orderValue / leverage : 0;

  const handleSubmit = async () => {
    if (!marketPrice || quantityValue <= 0) {
      return;
    }

    await onSubmit({
      symbol,
      side,
      orderType: "MARKET",
      qty: quantityValue,
      leverage,
      takeProfit: toOptionalNumber(takeProfit),
      stopLoss: toOptionalNumber(stopLoss),
      slippage: 1,
    });
  };

  return (
    <aside className="flex h-full min-h-0 flex-col bg-white text-[#263747]">
      <div className="grid h-13 shrink-0 grid-cols-2 border-b border-[#e1e7ec] bg-white p-2">
        {(["BUY", "SELL"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSide(value)}
            className={`rounded text-xs font-bold transition ${
              side === value
                ? value === "BUY"
                  ? "bg-[#18ad78] text-white"
                  : "bg-[#ef5350] text-white"
                : "text-[#7b8d9d] hover:bg-[#f3f6f8] hover:text-[#263747]"
            }`}
          >
            {value === "BUY" ? "Buy / Long" : "Sell / Short"}
          </button>
        ))}
      </div>

      <div className="flex h-11 shrink-0 items-center gap-5 border-b border-[#e1e7ec] px-5">
        <button
          type="button"
          className="h-full border-b-2 border-[#263747] px-1 text-xs font-semibold text-[#263747]"
        >
          Market
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-5 py-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-medium text-[#7b8d9d]">Available balance</span>
          <span className="font-bold text-[#263747]">
            {formatCurrency(availableBalance)}
          </span>
        </div>

        <div className="space-y-2.5">
          <ReadOnlyField
            label="Market price"
            value={formatPrice(marketPrice)}
            suffix="USDC"
          />
          <OrderField
            label="Quantity"
            value={quantity}
            suffix={baseAsset}
            onChange={setQuantity}
          />

          <div>
            <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[#7b8d9d]">
              <span>Leverage</span>
              <span className="font-bold text-[#263747]">{leverage}x</span>
            </div>
            <input
              suppressHydrationWarning
              aria-label="Leverage"
              type="range"
              min="0"
              max={LEVERAGE_OPTIONS.length - 1}
              step="1"
              value={LEVERAGE_OPTIONS.indexOf(leverage)}
              onChange={(event) => {
                const nextLeverage =
                  LEVERAGE_OPTIONS[Number(event.target.value)];
                if (nextLeverage !== undefined) {
                  setLeverage(nextLeverage);
                }
              }}
              className="w-full accent-[#88bdf2]"
            />
            <div className="mt-1 flex justify-between text-[10px] text-[#8a9aa8]">
              <span>1x</span>
              <span>20x</span>
              <span>40x</span>
              <span>60x</span>
              <span>80x</span>
              <span>100x</span>
            </div>
          </div>

          <ReadOnlyField
            label="Order value"
            value={formatPrice(orderValue)}
            suffix="USDC"
          />

          <div className="grid grid-cols-2 gap-2">
            <OrderField
              label="Take profit"
              value={takeProfit}
              suffix="USDC"
              onChange={setTakeProfit}
            />
            <OrderField
              label="Stop loss"
              value={stopLoss}
              suffix="USDC"
              onChange={setStopLoss}
            />
          </div>

          <div className="space-y-2 border-y border-[#e1e7ec] py-3 text-xs">
            <SummaryRow
              label="Margin required"
              value={formatCurrency(marginRequired)}
            />
            <SummaryRow
              label="Estimated fee"
              value={formatCurrency(orderValue * 0.0005)}
            />
          </div>

          {errorMessage ? (
            <p className="border border-[#ef5350]/25 bg-[#ef5350]/5 px-3 py-2 text-xs font-medium text-[#d44946]">
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p className="border border-[#19a974]/25 bg-[#19a974]/5 px-3 py-2 text-xs font-medium text-[#148b5b]">
              {successMessage}
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e1e7ec] bg-white p-4">
        <button
          type="button"
          disabled={isSubmitting || !marketPrice || quantityValue <= 0}
          onClick={handleSubmit}
          className={`h-10 w-full rounded-md text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
            side === "BUY"
              ? "bg-[#159a64] hover:bg-[#19aa70]"
              : "bg-[#d44946] hover:bg-[#e0524f]"
          }`}
        >
          {isSubmitting
            ? "Submitting..."
            : `${side === "BUY" ? "Buy" : "Sell"} ${baseAsset}`}
        </button>
      </div>
    </aside>
  );
}

function OrderField({
  label,
  value,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  suffix: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium text-[#7b8d9d]">
        {label}
      </span>
      <div className="flex h-10 items-center rounded border border-[#d3dce4] bg-[#f8fafb] px-3 transition focus-within:border-[#6a89a7] focus-within:bg-white">
        <input
          suppressHydrationWarning
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type="number"
          min="0"
          step="any"
          placeholder="0"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#263747] outline-none"
        />
        <span className="ml-2 text-[11px] font-semibold text-[#7b8d9d]">
          {suffix}
        </span>
      </div>
    </label>
  );
}

function ReadOnlyField({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-medium text-[#7b8d9d]">
        {label}
      </span>
      <div className="flex h-10 items-center rounded border border-[#d3dce4] bg-[#f8fafb] px-3">
        <span className="min-w-0 flex-1 text-sm font-semibold text-[#263747]">
          {value}
        </span>
        <span className="ml-2 text-[11px] font-semibold text-[#7b8d9d]">
          {suffix}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#7b8d9d]">{label}</span>
      <span className="font-bold text-[#263747]">{value}</span>
    </div>
  );
}

function toOptionalNumber(value: string) {
  const number = Number(value);
  return value && number > 0 ? number : undefined;
}

function formatCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function formatPrice(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

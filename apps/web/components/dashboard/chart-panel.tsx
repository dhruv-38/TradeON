"use client";

import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  TickMarkType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LogicalRange,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";
import type {
  Candle,
  MarketPrice,
  SymbolCode,
  Timeframe,
} from "../../features/dashboard/types";

type ChartPanelProps = {
  candles: Candle[];
  livePrice: MarketPrice | null;
  symbol: SymbolCode;
  timeframe: Timeframe;
  loadedTimeframe: Timeframe;
  isLoading: boolean;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onLoadMore: () => void;
};

export function ChartPanel({
  candles,
  livePrice,
  symbol,
  timeframe,
  loadedTimeframe,
  isLoading,
  onTimeframeChange,
  onLoadMore,
}: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const liveCandleRef = useRef<CandlestickData<UTCTimestamp> | null>(null);
  const lastTickTimestampRef = useRef(0);
  const visibleRangeRef = useRef<LogicalRange | null>(null);
  const previousCandleCountRef = useRef(0);
  const hasUserNavigatedRef = useRef(false);
  const isUpdatingDataRef = useRef(false);
  const onLoadMoreRef = useRef(onLoadMore);
  const [liveCandle, setLiveCandle] =
    useState<CandlestickData<UTCTimestamp> | null>(null);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (isLoading) {
      previousCandleCountRef.current = 0;
      visibleRangeRef.current = null;
      return;
    }

    const chartContainer = containerRef.current;
    if (!chartContainer) {
      return;
    }

    const locale = navigator.language;
    const timeFormatter = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const dateFormatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
    });
    const monthFormatter = new Intl.DateTimeFormat(locale, { month: "short" });
    const yearFormatter = new Intl.DateTimeFormat(locale, { year: "numeric" });
    const crosshairTimeFormatter = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const chart = createChart(chartContainer, {
      autoSize: true,
      localization: {
        locale,
        timeFormatter: (time: Time) =>
          crosshairTimeFormatter.format(chartTimeToDate(time)),
      },
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#647b90",
        attributionLogo: false,
        fontSize: 11,
        fontFamily: "Arial, Helvetica, sans-serif",
        panes: {
          enableResize: false,
          separatorColor: "#d5e1ec",
          separatorHoverColor: "#bdddfc",
        },
      },
      grid: {
        vertLines: { color: "rgba(106, 137, 167, 0.12)" },
        horzLines: { color: "rgba(106, 137, 167, 0.12)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(56, 73, 89, 0.46)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#384959",
        },
        horzLine: {
          color: "rgba(56, 73, 89, 0.46)",
          style: LineStyle.Dashed,
          labelBackgroundColor: "#384959",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(106, 137, 167, 0.38)",
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "rgba(106, 137, 167, 0.38)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
        tickMarkFormatter: (time: Time, tickMarkType: TickMarkType) => {
          const date = chartTimeToDate(time);

          switch (tickMarkType) {
            case TickMarkType.Year:
              return yearFormatter.format(date);
            case TickMarkType.Month:
              return monthFormatter.format(date);
            case TickMarkType.DayOfMonth:
              return dateFormatter.format(date);
            default:
              return timeFormatter.format(date);
          }
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#19c37d",
      downColor: "#ef5350",
      borderUpColor: "#19c37d",
      borderDownColor: "#ef5350",
      wickUpColor: "#19c37d",
      wickDownColor: "#ef5350",
      priceLineColor: "#19c37d",
      priceLineWidth: 1,
      lastValueVisible: true,
    });
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleVisibleRangeChange = (range: LogicalRange | null) => {
      visibleRangeRef.current = range;
      if (
        range &&
        range.from <= 20 &&
        hasUserNavigatedRef.current &&
        !isUpdatingDataRef.current
      ) {
        void onLoadMoreRef.current();
      }
    };

    const markUserNavigation = () => {
      hasUserNavigatedRef.current = true;
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    chartContainer.addEventListener("wheel", markUserNavigation, {
      passive: true,
    });
    chartContainer.addEventListener("pointerdown", markUserNavigation);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chartContainer.removeEventListener("wheel", markUserNavigation);
      chartContainer.removeEventListener("pointerdown", markUserNavigation);
      chartRef.current = null;
      candleSeriesRef.current = null;
      liveCandleRef.current = null;
      previousCandleCountRef.current = 0;
      visibleRangeRef.current = null;
      hasUserNavigatedRef.current = false;
      chart.remove();
    };
  }, [isLoading]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (isLoading || !chart || !candleSeries) {
      return;
    }

    const candleData = normalizeCandleData(candles);
    const previousCandleCount = previousCandleCountRef.current;
    const addedCandleCount = candleData.length - previousCandleCount;
    const previousVisibleRange = visibleRangeRef.current;
    const existingLiveCandle = liveCandleRef.current;

    isUpdatingDataRef.current = true;
    candleSeries.setData(candleData);

    if (
      existingLiveCandle &&
      previousCandleCount > 0 &&
      Number(existingLiveCandle.time) >= Number(candleData.at(-1)?.time ?? 0)
    ) {
      candleSeries.update(existingLiveCandle);
    } else {
      const latestCandle = candleData.at(-1) ?? null;
      liveCandleRef.current = latestCandle;
      lastTickTimestampRef.current = 0;
      setLiveCandle(latestCandle);
    }

    if (
      previousCandleCount > 0 &&
      addedCandleCount > 0 &&
      previousVisibleRange
    ) {
      const shiftedRange = {
        from: previousVisibleRange.from + addedCandleCount,
        to: previousVisibleRange.to + addedCandleCount,
      } as LogicalRange;
      chart.timeScale().setVisibleLogicalRange(shiftedRange);
      visibleRangeRef.current = shiftedRange;
    } else if (previousCandleCount === 0 && candleData.length > 0) {
      chart.timeScale().fitContent();
    }

    previousCandleCountRef.current = candleData.length;
    isUpdatingDataRef.current = false;
  }, [candles, isLoading]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries || !livePrice) {
      return;
    }

    if (livePrice.timestamp <= lastTickTimestampRef.current) {
      return;
    }

    const price = livePrice.ask;
    const bucketTime = getBucketTime(livePrice.timestamp, loadedTimeframe);
    const current = liveCandleRef.current;
    const currentTime = current ? Number(current.time) : null;

    if (currentTime !== null && bucketTime < currentTime) {
      return;
    }

    const nextCandle: CandlestickData<UTCTimestamp> =
      current && currentTime === bucketTime
        ? {
            ...current,
            high: Math.max(current.high, price),
            low: Math.min(current.low, price),
            close: price,
          }
        : {
            time: bucketTime as UTCTimestamp,
            open: current?.close ?? price,
            high: price,
            low: price,
            close: price,
          };

    candleSeries.update(nextCandle);
    lastTickTimestampRef.current = livePrice.timestamp;
    liveCandleRef.current = nextCandle;
    setLiveCandle(nextCandle);
  }, [livePrice, loadedTimeframe]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#e1e7ec] bg-white px-5">
        <span className="flex h-full items-center border-b-2 border-[#263747] text-xs font-semibold text-[#263747]">
          Chart
        </span>
        <div className="flex items-center gap-1">
          {(["1m", "5m", "1h", "4h", "1d"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onTimeframeChange(option)}
              className={`rounded px-2.5 py-1.5 text-[11px] font-bold transition ${
                timeframe === option
                  ? "bg-[#263747] text-white"
                  : "text-[#718596] hover:bg-[#f1f5f8] hover:text-[#263747]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-[#e7ecf0] bg-[#fafcfd] px-5 text-[11px]">
        <span className="font-bold text-[#263747]">
          {formatSymbol(symbol)} / {timeframe} / TradeON
        </span>
        {!isLoading && liveCandle ? (
          <>
            <span className="text-[#19c37d]">
              O {formatPrice(liveCandle.open)}
            </span>
            <span className="text-[#19c37d]">
              H {formatPrice(liveCandle.high)}
            </span>
            <span className="text-[#ef5350]">
              L {formatPrice(liveCandle.low)}
            </span>
            <span
              className={
                liveCandle.close >= liveCandle.open
                  ? "text-[#19c37d]"
                  : "text-[#ef5350]"
              }
            >
              C {formatPrice(liveCandle.close)}
            </span>
          </>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        {isLoading ? (
          <div
            className="absolute inset-0 flex items-center justify-center gap-2 bg-white text-xs font-semibold text-[#718596]"
            role="status"
            aria-live="polite"
          >
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-[#c9d8e5] border-t-[#19a974]"
              aria-hidden="true"
            />
            Loading {timeframe} candles...
          </div>
        ) : (
          <>
            <div ref={containerRef} className="absolute inset-0 bg-white" />
            {candles.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#718596]">
                No candle data is available yet.
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

function formatPrice(value: string | number) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function normalizeCandleData(candles: Candle[]) {
  const candlesByTime = new Map<
    number,
    CandlestickData<UTCTimestamp>
  >();

  for (const candle of candles) {
    const timestamp = Math.floor(new Date(candle.bucket).getTime() / 1000);
    const open = Number(candle.open);
    const high = Number(candle.high);
    const low = Number(candle.low);
    const close = Number(candle.close);

    if (![timestamp, open, high, low, close].every(Number.isFinite)) {
      continue;
    }

    candlesByTime.set(timestamp, {
      time: timestamp as UTCTimestamp,
      open,
      high,
      low,
      close,
    });
  }

  return Array.from(candlesByTime.values()).sort(
    (left, right) => Number(left.time) - Number(right.time),
  );
}

function getBucketTime(timestamp: number, timeframe: Timeframe) {
  const intervalSeconds: Record<Timeframe, number> = {
    "1m": 60,
    "5m": 5 * 60,
    "1h": 60 * 60,
    "4h": 4 * 60 * 60,
    "1d": 24 * 60 * 60,
  };
  const timestampSeconds = Math.floor(timestamp / 1000);
  const interval = intervalSeconds[timeframe];

  return Math.floor(timestampSeconds / interval) * interval;
}

function chartTimeToDate(time: Time) {
  if (typeof time === "number") {
    return new Date(time * 1000);
  }

  if (typeof time === "string") {
    return new Date(`${time}T00:00:00Z`);
  }

  return new Date(Date.UTC(time.year, time.month - 1, time.day));
}

function formatSymbol(symbol: SymbolCode) {
  return symbol.replace("_", " / ");
}

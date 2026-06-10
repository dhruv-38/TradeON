"use client";

import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import type { Candle, MarketPrice, Timeframe } from "../../features/dashboard/types";

type ChartPanelProps = {
  candles: Candle[];
  livePrice: MarketPrice | null;
  timeframe: Timeframe;
  isLoading: boolean;
  onTimeframeChange: (timeframe: Timeframe) => void;
};

export function ChartPanel({
  candles,
  livePrice,
  timeframe,
  isLoading,
  onTimeframeChange,
}: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const latestCandle = candles.at(-1);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const candleData: CandlestickData<UTCTimestamp>[] = candles.map((candle) => ({
      time: Math.floor(new Date(candle.bucket).getTime() / 1000) as UTCTimestamp,
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close),
    }));
    const volumeData: HistogramData<UTCTimestamp>[] = candles.map((candle) => {
      const rising = Number(candle.close) >= Number(candle.open);
      return {
        time: Math.floor(new Date(candle.bucket).getTime() / 1000) as UTCTimestamp,
        value: Number(candle.volume ?? 0),
        color: rising ? "rgba(25, 195, 125, 0.42)" : "rgba(239, 83, 80, 0.42)",
      };
    });

    const chart = createChart(containerRef.current, {
      autoSize: true,
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
        scaleMargins: { top: 0.08, bottom: 0.24 },
      },
      timeScale: {
        borderColor: "rgba(106, 137, 167, 0.38)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
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
    candleSeries.setData(candleData);

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volume.setData(volumeData);

    if (candleData.length > 0) {
      chart.timeScale().fitContent();
    }

    return () => chart.remove();
  }, [candles]);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#e1e7ec] bg-white px-5">
        <div className="flex h-full items-center gap-6 text-xs font-semibold text-[#7b8d9d]">
          <button type="button" className="h-full border-b-2 border-[#263747] text-[#263747]">
            Chart
          </button>
          <button type="button" className="h-full border-b-2 border-transparent transition hover:text-[#263747]">
            Depth
          </button>
          <button type="button" className="h-full border-b-2 border-transparent transition hover:text-[#263747]">
            Market Info
          </button>
        </div>
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
        <span className="font-bold text-[#263747]">BTC/USDC · {timeframe} · TradeON</span>
        {latestCandle ? (
          <>
            <span className="text-[#19c37d]">O {formatPrice(latestCandle.open)}</span>
            <span className="text-[#19c37d]">H {formatPrice(latestCandle.high)}</span>
            <span className="text-[#ef5350]">L {formatPrice(latestCandle.low)}</span>
            <span className="text-[#19c37d]">
              C {formatPrice(livePrice?.ask ?? latestCandle.close)}
            </span>
          </>
        ) : null}
      </div>

      <div className="relative min-h-0 flex-1 bg-white">
        <div ref={containerRef} className="absolute inset-0 bg-white" />
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-xs font-semibold text-[#718596]">
            Loading market candles...
          </div>
        ) : null}
        {!isLoading && candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[#718596]">
            No candle data is available yet.
          </div>
        ) : null}
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

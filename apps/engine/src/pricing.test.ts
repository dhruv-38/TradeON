import { describe, expect, test } from "bun:test";
import {
  calculateRealizedPnl,
  getExecutableExitPrice,
  getExitSide,
} from "./pricing.js";

describe("position pricing", () => {
  test("closes a long by selling at bid", () => {
    expect(getExitSide("BUY")).toBe("SELL");
    expect(getExecutableExitPrice("BUY", 99, 101)).toBe(99);
    expect(calculateRealizedPnl("BUY", 90, 99, 2)).toBe(18);
  });

  test("closes a short by buying at ask", () => {
    expect(getExitSide("SELL")).toBe("BUY");
    expect(getExecutableExitPrice("SELL", 99, 101)).toBe(101);
    expect(calculateRealizedPnl("SELL", 110, 101, 2)).toBe(18);
  });
});

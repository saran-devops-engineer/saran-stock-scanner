import { describe, it, expect } from 'vitest';
import { calculateATR, calculateTrueRange } from '../../src/core/indicators/atr';
import { Candle } from '../../src/core/types';

function makeCandles(prices: Array<{ o: number; h: number; l: number; c: number }>): Candle[] {
  return prices.map((p, i) => ({
    timestamp: Date.now() + i * 86400000,
    open: p.o,
    high: p.h,
    low: p.l,
    close: p.c,
    volume: 1000,
  }));
}

describe('True Range Calculation', () => {
  it('should return empty array for single candle', () => {
    const candles = makeCandles([{ o: 100, h: 110, l: 90, c: 105 }]);
    expect(calculateTrueRange(candles)).toEqual([]);
  });

  it('should calculate TR correctly', () => {
    const candles = makeCandles([
      { o: 100, h: 110, l: 90, c: 105 },
      { o: 105, h: 115, l: 100, c: 110 },
    ]);

    const tr = calculateTrueRange(candles);

    // First candle: TR = High - Low = 110 - 90 = 20
    expect(tr[0]).toBe(20);

    // Second candle: TR = max(115-100, |115-105|, |100-105|) = max(15, 10, 5) = 15
    expect(tr[1]).toBe(15);
  });

  it('should handle gap up', () => {
    const candles = makeCandles([
      { o: 100, h: 110, l: 90, c: 105 },
      { o: 120, h: 130, l: 115, c: 125 }, // Gap up
    ]);

    const tr = calculateTrueRange(candles);

    // TR = max(130-115, |130-105|, |115-105|) = max(15, 25, 10) = 25
    expect(tr[1]).toBe(25);
  });

  it('should handle gap down', () => {
    const candles = makeCandles([
      { o: 100, h: 110, l: 90, c: 105 },
      { o: 80, h: 85, l: 70, c: 75 }, // Gap down
    ]);

    const tr = calculateTrueRange(candles);

    // TR = max(85-70, |85-105|, |70-105|) = max(15, 20, 35) = 35
    expect(tr[1]).toBe(35);
  });
});

describe('ATR Calculation', () => {
  it('should return NaN for insufficient data', () => {
    const candles = makeCandles(
      Array(5).fill(null).map(() => ({ o: 100, h: 110, l: 90, c: 105 }))
    );
    const atr = calculateATR(candles, 14);
    expect(atr.currentValue).toBeNaN();
  });

  it('should calculate ATR correctly', () => {
    // Create 20 candles with consistent range
    const prices = Array(20).fill(null).map(() => ({
      o: 100,
      h: 110,
      l: 90,
      c: 105,
    }));
    const candles = makeCandles(prices);

    const atr = calculateATR(candles, 10);

    // ATR should be approximately 20 (the range of each candle)
    // 20 candles -> 20 true ranges -> ATR: 10 NaN + 1 seed + 10 smoothed = 21 values
    expect(atr.currentValue).toBeCloseTo(20, 0);
    expect(atr.values.length).toBeGreaterThan(0);
  });

  it('should smooth over time', () => {
    // Create candles with varying ranges
    const prices = [
      { o: 100, h: 120, l: 80, c: 100 },   // Range 40
      { o: 100, h: 115, l: 85, c: 100 },   // Range 30
      { o: 100, h: 110, l: 90, c: 100 },   // Range 20
      { o: 100, h: 105, l: 95, c: 100 },   // Range 10
      { o: 100, h: 120, l: 80, c: 100 },   // Range 40
      { o: 100, h: 115, l: 85, c: 100 },   // Range 30
      { o: 100, h: 110, l: 90, c: 100 },   // Range 20
      { o: 100, h: 105, l: 95, c: 100 },   // Range 10
      { o: 100, h: 120, l: 80, c: 100 },   // Range 40
      { o: 100, h: 115, l: 85, c: 100 },   // Range 30
      { o: 100, h: 110, l: 90, c: 100 },   // Range 20
      { o: 100, h: 105, l: 95, c: 100 },   // Range 10
      { o: 100, h: 120, l: 80, c: 100 },   // Range 40
      { o: 100, h: 115, l: 85, c: 100 },   // Range 30
      { o: 100, h: 110, l: 90, c: 100 },   // Range 20
    ];

    const candles = makeCandles(prices);
    const atr = calculateATR(candles, 10);

    // ATR should be a smoothed average, not equal to any single TR
    expect(atr.currentValue).toBeGreaterThan(10);
    expect(atr.currentValue).toBeLessThan(40);
  });
});

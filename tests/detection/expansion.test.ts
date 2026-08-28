import { describe, it, expect } from 'vitest';
import { detectPriceExpansion } from '../../src/core/detection/expansion';
import { Candle } from '../../src/core/types';

function makeCandles(prices: number[]): Candle[] {
  return prices.map((p, i) => ({
    timestamp: Date.now() + i * 86400000,
    open: p,
    high: p * 1.02,
    low: p * 0.98,
    close: p,
    volume: 1000,
  }));
}

function makeCleanCandles(prices: number[]): Candle[] {
  // No high/low noise — clean data for testing exact thresholds
  return prices.map((p, i) => ({
    timestamp: Date.now() + i * 86400000,
    open: p,
    high: p,
    low: p,
    close: p,
    volume: 1000,
  }));
}

describe('Price Expansion Detection', () => {
  it('should detect valid expansion', () => {
    // Clear upward move: 100 -> 150 = 50%
    const prices = [
      ...Array(10).fill(100),
      ...Array(5).fill(110),
      ...Array(5).fill(120),
      ...Array(5).fill(130),
      ...Array(5).fill(140),
      ...Array(5).fill(150),
    ];
    const candles = makeCandles(prices);
    const result = detectPriceExpansion(candles, candles.length - 1, {
      lookback: 800,
      minPercent: 20,
    });

    expect(result.status).toBe('VALID');
    expect(result.metrics.expansionPercent).toBeGreaterThanOrEqual(20);
  });

  it('should reject insufficient expansion', () => {
    // Flat prices
    const prices = Array(50).fill(100);
    const candles = makeCandles(prices);
    const result = detectPriceExpansion(candles, candles.length - 1, {
      lookback: 800,
      minPercent: 20,
    });

    expect(result.status).toBe('INVALID');
  });

  it('should reject when not enough data', () => {
    const candles = makeCandles([100, 105, 110]);
    const result = detectPriceExpansion(candles, 2, {
      lookback: 800,
      minPercent: 20,
    });

    expect(result.status).toBe('INVALID');
  });

  it('should handle downward trend correctly', () => {
    // Strictly monotonically decreasing — no rally at all
    const prices = [200, 198, 196, 194, 192, 190, 188, 186, 184, 182,
                    180, 178, 176, 174, 172, 170, 168, 166, 164, 162,
                    160, 158, 156, 154, 152, 150, 148, 146, 144, 142];
    const candles = makeCleanCandles(prices);
    const result = detectPriceExpansion(candles, candles.length - 1, {
      lookback: 800,
      minPercent: 20,
    });

    // No expansion in a pure downtrend
    expect(result.status).toBe('INVALID');
  });

  it('should detect expansion followed by correction', () => {
    // Simulate BANKINDIA-like pattern: rally then drop
    const prices = [
      ...Array(10).fill(100),   // base
      ...Array(5).fill(110),
      ...Array(5).fill(120),
      ...Array(5).fill(130),
      ...Array(5).fill(140),
      ...Array(5).fill(150),   // peak = 150
      ...Array(5).fill(140),   // correction
      ...Array(5).fill(130),
      ...Array(5).fill(120),
      ...Array(10).fill(120),  // consolidation
    ];
    const candles = makeCleanCandles(prices);
    const result = detectPriceExpansion(candles, candles.length - 1, {
      lookback: 800,
      minPercent: 20,
    });

    expect(result.status).toBe('VALID');
    expect(result.metrics.expansionPercent).toBeGreaterThanOrEqual(40);
    expect(result.metrics.expansionLow).toBe(100);
    expect(result.metrics.expansionHigh).toBe(150);
  });
});

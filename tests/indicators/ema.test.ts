import { describe, it, expect } from 'vitest';
import { calculateEMA, getEMAResult } from '../../src/core/indicators/ema';

describe('EMA Calculation', () => {
  it('should return empty array for empty input', () => {
    expect(calculateEMA([], 20)).toEqual([]);
  });

  it('should return empty array when not enough data', () => {
    const closes = [1, 2, 3, 4, 5];
    expect(calculateEMA(closes, 20)).toEqual([]);
  });

  it('should calculate EMA correctly for known data', () => {
    // Simple test: constant prices should result in constant EMA
    const closes = Array(30).fill(100);
    const ema = calculateEMA(closes, 20);

    // After initial SMA seed, EMA should stay at 100
    expect(ema.length).toBe(30);
    expect(ema[19]).toBeCloseTo(100, 2);
    expect(ema[29]).toBeCloseTo(100, 2);
  });

  it('should use SMA as seed for first EMA value', () => {
    const closes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const ema = calculateEMA(closes, 5);

    // First EMA value (at index 4) should be SMA of first 5 values
    const expectedSMA = (1 + 2 + 3 + 4 + 5) / 5;
    expect(ema[4]).toBeCloseTo(expectedSMA, 4);
  });

  it('should follow price trend correctly', () => {
    // Rising prices: EMA should be below price (lagging)
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const ema = calculateEMA(closes, 10);

    // EMA should lag behind price
    expect(ema[ema.length - 1]).toBeLessThan(closes[closes.length - 1]);
    expect(ema[ema.length - 1]).toBeGreaterThan(closes[closes.length - 10]);
  });

  it('should return correct number of values', () => {
    const closes = Array(50).fill(100);
    const ema = calculateEMA(closes, 20);

    expect(ema.length).toBe(50);
    // First 19 values should be NaN
    for (let i = 0; i < 19; i++) {
      expect(isNaN(ema[i])).toBe(true);
    }
    // Rest should be valid numbers
    for (let i = 19; i < 50; i++) {
      expect(isNaN(ema[i])).toBe(false);
    }
  });

  it('getEMAResult should return current value', () => {
    const closes = Array(30).fill(100);
    const result = getEMAResult(closes, 20);

    expect(result.currentValue).toBeCloseTo(100, 2);
    expect(result.values.length).toBe(30);
  });
});

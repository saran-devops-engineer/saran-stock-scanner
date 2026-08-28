import { Candle, EMAResult } from '../types';

/**
 * Calculate EMA for an array of closing prices.
 * Uses standard EMA formula: EMA = Close * k + EMA_prev * (1 - k)
 * where k = 2 / (period + 1)
 */
export function calculateEMA(closes: number[], period: number): number[] {
  if (closes.length === 0) return [];
  if (closes.length < period) return [];

  const k = 2 / (period + 1);
  const emaValues: number[] = [];

  // Seed with SMA of first 'period' values
  let smaSum = 0;
  for (let i = 0; i < period; i++) {
    smaSum += closes[i];
  }
  let prevEma = smaSum / period;

  // Fill initial values with null (not enough data)
  for (let i = 0; i < period - 1; i++) {
    emaValues.push(NaN);
  }
  emaValues.push(prevEma);

  // Calculate EMA for remaining candles
  for (let i = period; i < closes.length; i++) {
    const ema = closes[i] * k + prevEma * (1 - k);
    emaValues.push(ema);
    prevEma = ema;
  }

  return emaValues;
}

/**
 * Get the EMA result with current value and history.
 */
export function getEMAResult(closes: number[], period: number): EMAResult {
  const values = calculateEMA(closes, period);
  const currentValue = values.length > 0 ? values[values.length - 1] : NaN;
  return { values, currentValue };
}

/**
 * Calculate EMA for multiple periods and return all results.
 */
export function calculateAllEMAs(
  closes: number[],
  periods: { period1: number; period2: number; period3: number; period4: number }
): {
  ema20: EMAResult;
  ema50: EMAResult;
  ema100: EMAResult;
  ema200: EMAResult;
} {
  return {
    ema20: getEMAResult(closes, periods.period1),
    ema50: getEMAResult(closes, periods.period2),
    ema100: getEMAResult(closes, periods.period3),
    ema200: getEMAResult(closes, periods.period4),
  };
}

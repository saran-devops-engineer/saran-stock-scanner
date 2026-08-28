import { Candle, ATRResult } from '../types';

/**
 * Calculate True Range for each candle.
 * TR = max(High - Low, |High - PrevClose|, |Low - PrevClose|)
 */
export function calculateTrueRange(candles: Candle[]): number[] {
  if (candles.length < 2) return [];

  const trueRanges: number[] = [];

  // First candle: TR = High - Low
  trueRanges.push(candles[0].high - candles[0].low);

  // Remaining candles
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  return trueRanges;
}

/**
 * Calculate ATR using Wilder's smoothing method.
 * ATR = ((ATR_prev * (period - 1)) + TR) / period
 */
export function calculateATR(candles: Candle[], period: number): ATRResult {
  if (candles.length < period + 1) {
    return { values: [], currentValue: NaN };
  }

  const trueRanges = calculateTrueRange(candles);
  const atrValues: number[] = [];

  // Seed with simple average of first 'period' true ranges
  let atrSum = 0;
  for (let i = 0; i < period; i++) {
    atrSum += trueRanges[i];
  }
  let prevAtr = atrSum / period;

  // Fill initial values
  for (let i = 0; i < period; i++) {
    atrValues.push(NaN);
  }
  atrValues.push(prevAtr);

  // Wilder's smoothing for remaining
  for (let i = period; i < trueRanges.length; i++) {
    const atr = (prevAtr * (period - 1) + trueRanges[i]) / period;
    atrValues.push(atr);
    prevAtr = atr;
  }

  const currentValue = atrValues.length > 0 ? atrValues[atrValues.length - 1] : NaN;

  return { values: atrValues, currentValue };
}

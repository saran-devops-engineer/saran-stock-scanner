import { Candle, TimeCorrectionConfig, TimeCorrectionResult } from '../types';

/**
 * Detect time correction / consolidation after price correction.
 *
 * Scans backwards from the current candle to find the most recent period
 * of sideways price action (narrow range). The consolidation should
 * follow a correction phase.
 */
export function detectTimeCorrection(
  candles: Candle[],
  currentIndex: number,
  config: TimeCorrectionConfig
): TimeCorrectionResult {
  const { minCandles, maxRangePercent, maxCandleRangePercent: maxAllowedCandleRange, maxRangeStdDev } = config;

  if (candles.length < minCandles + 10) {
    return {
      status: 'INVALID',
      reason: 'Insufficient candle data for time correction',
      metrics: {
        consolidationHigh: 0,
        consolidationLow: 0,
        consolidationRangePercent: 0,
        consolidationCandles: 0,
        atrContracting: false,
        maxCandleRangePercent: 0,
      },
    };
  }

  // Scan backwards to find the longest consolidation period ending at currentIndex.
  // A consolidation candle is one where the high/low stays within the range.
  //
  // Strategy: Start from current candle and walk backwards.
  // Count how many consecutive candles stay within a tight range.

  // First, find the range using the most recent minCandles candles
  const initialWindow = candles.slice(Math.max(0, currentIndex - minCandles + 1), currentIndex + 1);
  let consolHigh = -Infinity;
  let consolLow = Infinity;

  for (const candle of initialWindow) {
    if (candle.high > consolHigh) consolHigh = candle.high;
    if (candle.low < consolLow) consolLow = candle.low;
  }

  // Now expand backwards as long as candles stay within the FIXED range
  // Do NOT update consolHigh/consolLow — keep the initial range as reference
  let consolidationCandles = initialWindow.length;
  const tolerance = 0.05; // 5% tolerance for range

  for (let i = currentIndex - minCandles; i >= Math.max(0, currentIndex - 300); i--) {
    const candle = candles[i];
    // Check if this candle stays within the FIXED consolidation range (with tolerance)
    if (candle.high <= consolHigh * (1 + tolerance) && candle.low >= consolLow * (1 - tolerance)) {
      consolidationCandles++;
    } else {
      break; // Hit a candle outside the range — consolidation starts after this
    }
  }

  // Calculate range percentage
  const consolidationRangePercent = consolLow > 0
    ? ((consolHigh - consolLow) / consolLow) * 100
    : 0;

  // Check if range is narrow enough
  if (consolidationRangePercent > maxRangePercent) {
    return {
      status: 'INVALID',
      reason: `Consolidation range ${consolidationRangePercent.toFixed(1)}% exceeds maximum ${maxRangePercent}%`,
      metrics: {
        consolidationHigh: consolHigh,
        consolidationLow: consolLow,
        consolidationRangePercent,
        consolidationCandles,
        atrContracting: false,
        maxCandleRangePercent: 0,
      },
    };
  }

  // Check ATR contraction in the consolidation window
  const windowCandles = candles.slice(
    Math.max(0, currentIndex - consolidationCandles),
    currentIndex + 1
  );
  const firstHalfATR = calculateSimpleATR(windowCandles.slice(0, Math.floor(windowCandles.length / 2)));
  const secondHalfATR = calculateSimpleATR(windowCandles.slice(Math.floor(windowCandles.length / 2)));
  const atrContracting = secondHalfATR < firstHalfATR * 0.95;

  // Smoothness: measure candle ranges in the consolidation window.
  // Occasional swings are OK (up to maxCandleRangePercent), but volatility must be
  // consistent — a high standard deviation means choppy, wild-swing price action.
  let maxCandleRangePercent = 0;
  const candleRanges: number[] = [];
  for (const candle of windowCandles) {
    if (candle.low > 0) {
      const range = ((candle.high - candle.low) / candle.low) * 100;
      candleRanges.push(range);
      if (range > maxCandleRangePercent) maxCandleRangePercent = range;
    }
  }
  const meanRange = candleRanges.length > 0
    ? candleRanges.reduce((a, b) => a + b, 0) / candleRanges.length
    : 0;
  const rangeStdDev = candleRanges.length > 1
    ? Math.sqrt(candleRanges.reduce((s, r) => s + (r - meanRange) ** 2, 0) / candleRanges.length)
    : 0;

  // Reject monster candles — even one huge candle breaks the base
  if (maxCandleRangePercent > maxAllowedCandleRange) {
    return {
      status: 'INVALID',
      reason: `Wild swing detected: largest candle ${maxCandleRangePercent.toFixed(1)}% exceeds max ${maxAllowedCandleRange}%`,
      metrics: {
        consolidationHigh: consolHigh,
        consolidationLow: consolLow,
        consolidationRangePercent,
        consolidationCandles,
        atrContracting,
        maxCandleRangePercent,
      },
    };
  }

  // Reject choppy consolidations — high variance in daily ranges means erratic swings
  if (rangeStdDev > maxRangeStdDev) {
    return {
      status: 'INVALID',
      reason: `Erratic swings: candle range stddev ${rangeStdDev.toFixed(2)} exceeds max ${maxRangeStdDev}`,
      metrics: {
        consolidationHigh: consolHigh,
        consolidationLow: consolLow,
        consolidationRangePercent,
        consolidationCandles,
        atrContracting,
        maxCandleRangePercent,
      },
    };
  }

  if (consolidationCandles < minCandles) {
    return {
      status: 'DEVELOPING',
      reason: `Consolidation ${consolidationCandles} candles, need ${minCandles}`,
      metrics: {
        consolidationHigh: consolHigh,
        consolidationLow: consolLow,
        consolidationRangePercent,
        consolidationCandles,
        atrContracting,
        maxCandleRangePercent,
      },
    };
  }

  return {
    status: 'VALID',
    reason: `Consolidation: ${consolidationCandles} candles, range ${consolidationRangePercent.toFixed(1)}%, max candle ${maxCandleRangePercent.toFixed(1)}%, stddev ${rangeStdDev.toFixed(2)}`,
    metrics: {
      consolidationHigh: consolHigh,
      consolidationLow: consolLow,
      consolidationRangePercent,
      consolidationCandles,
      atrContracting,
      maxCandleRangePercent,
    },
  };
}

/**
 * Simple ATR calculation for a window of candles (no smoothing).
 */
function calculateSimpleATR(candles: Candle[]): number {
  if (candles.length < 2) return 0;

  let totalTR = 0;
  for (let i = 1; i < candles.length; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    totalTR += tr;
  }

  return totalTR / (candles.length - 1);
}

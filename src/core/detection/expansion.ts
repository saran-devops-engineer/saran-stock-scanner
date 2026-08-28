import { Candle, ExpansionConfig, ExpansionResult } from '../types';

/**
 * Detect the most recent significant price expansion.
 *
 * Strategy: Find the highest peak in the data, then find the lowest point
 * before that peak. The expansion is that low-to-high rally.
 *
 * This correctly identifies the main rally regardless of what happened after.
 */
export function detectPriceExpansion(
  candles: Candle[],
  currentIndex: number,
  config: ExpansionConfig
): ExpansionResult {
  const { minPercent } = config;

  if (candles.length < 10) {
    return {
      status: 'INVALID',
      reason: 'Insufficient candle data',
      metrics: { expansionLow: 0, expansionHigh: 0, expansionPercent: 0, lookbackCandles: 0 },
    };
  }

  const maxLookback = Math.min(currentIndex, 800);

  // Step 1: Find the highest high in the dataset (the expansion peak).
  let expansionHigh = -Infinity;
  let peakIndex = 0;

  for (let i = 0; i <= currentIndex; i++) {
    if (candles[i].high > expansionHigh) {
      expansionHigh = candles[i].high;
      peakIndex = i;
    }
  }

  // Step 2: Find the lowest low BEFORE the peak.
  let expansionLow = Infinity;
  for (let i = 0; i < peakIndex; i++) {
    if (candles[i].low < expansionLow) {
      expansionLow = candles[i].low;
    }
  }

  if (expansionLow <= 0 || expansionLow >= expansionHigh) {
    return {
      status: 'INVALID',
      reason: 'Could not find valid expansion',
      metrics: { expansionLow: 0, expansionHigh: 0, expansionPercent: 0, lookbackCandles: maxLookback },
    };
  }

  const expansionPercent = ((expansionHigh - expansionLow) / expansionLow) * 100;

  if (expansionPercent < minPercent) {
    return {
      status: 'INVALID',
      reason: `Expansion ${expansionPercent.toFixed(1)}% below minimum ${minPercent}%`,
      metrics: { expansionLow, expansionHigh, expansionPercent, lookbackCandles: maxLookback },
    };
  }

  return {
    status: 'VALID',
    reason: `Price expanded ${expansionPercent.toFixed(1)}% from ${expansionLow.toFixed(2)} to ${expansionHigh.toFixed(2)}`,
    metrics: { expansionLow, expansionHigh, expansionPercent, lookbackCandles: maxLookback },
  };
}

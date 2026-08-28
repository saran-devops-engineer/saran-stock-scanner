import { Candle, CorrectionConfig, CorrectionResult } from '../types';

/**
 * Detect price correction after an expansion high.
 *
 * Given the expansionHigh from detectPriceExpansion, finds the lowest point
 * after the expansion peak and measures the correction percentage.
 *
 * The expansionHigh is the peak of the most recent significant rally.
 * The correction is the decline from that peak to the subsequent low.
 */
export function detectPriceCorrection(
  candles: Candle[],
  currentIndex: number,
  expansionHigh: number,
  config: CorrectionConfig
): CorrectionResult {
  const { minPercent, maxPercent } = config;

  if (candles.length < 2 || expansionHigh <= 0) {
    return {
      status: 'INVALID',
      reason: 'Insufficient data or no expansion high',
      metrics: {
        correctionHigh: 0,
        correctionLow: 0,
        correctionPercent: 0,
        quality: 'excessive',
      },
    };
  }

  // Find the index of the expansion high (the candle with high >= expansionHigh)
  // Search from the beginning to find the FIRST occurrence of this high
  let peakIndex = -1;
  for (let i = 0; i <= currentIndex; i++) {
    if (candles[i].high >= expansionHigh * 0.995) { // 0.5% tolerance
      peakIndex = i;
    }
  }

  // If we can't find the exact peak, search backwards from current for the highest high
  if (peakIndex === -1) {
    let highestHigh = -Infinity;
    for (let i = Math.max(0, currentIndex - 200); i <= currentIndex; i++) {
      if (candles[i].high > highestHigh) {
        highestHigh = candles[i].high;
        peakIndex = i;
      }
    }
  }

  if (peakIndex === -1) {
    return {
      status: 'INVALID',
      reason: 'Could not locate expansion peak',
      metrics: {
        correctionHigh: expansionHigh,
        correctionLow: 0,
        correctionPercent: 0,
        quality: 'excessive',
      },
    };
  }

  // Find the lowest point AFTER the peak
  let correctionLow = Infinity;
  for (let i = peakIndex; i <= currentIndex; i++) {
    if (candles[i].low < correctionLow) {
      correctionLow = candles[i].low;
    }
  }

  if (correctionLow === Infinity || correctionLow <= 0) {
    return {
      status: 'INVALID',
      reason: 'Could not find correction low after peak',
      metrics: {
        correctionHigh: expansionHigh,
        correctionLow: 0,
        correctionPercent: 0,
        quality: 'excessive',
      },
    };
  }

  // Calculate correction percentage (from peak to trough)
  const correctionPercent = expansionHigh > 0
    ? ((expansionHigh - correctionLow) / expansionHigh) * 100
    : 0;

  // Determine quality based on Fibonacci-like levels
  let quality: 'healthy' | 'deep' | 'excessive';
  if (correctionPercent < minPercent) {
    // Very shallow correction — still valid but less ideal
    quality = 'healthy';
  } else if (correctionPercent <= 38.2) {
    quality = 'healthy';
  } else if (correctionPercent <= maxPercent) {
    quality = 'deep';
  } else {
    quality = 'excessive';
  }

  // Check if correction exceeds maximum (trend may be broken)
  if (correctionPercent > maxPercent) {
    return {
      status: 'INVALID',
      reason: `Correction ${correctionPercent.toFixed(1)}% exceeds maximum ${maxPercent}%`,
      metrics: {
        correctionHigh: expansionHigh,
        correctionLow,
        correctionPercent,
        quality,
      },
    };
  }

  return {
    status: 'VALID',
    reason: `Correction of ${correctionPercent.toFixed(1)}% (${quality}) from ${expansionHigh.toFixed(2)} to ${correctionLow.toFixed(2)}`,
    metrics: {
      correctionHigh: expansionHigh,
      correctionLow,
      correctionPercent,
      quality,
    },
  };
}

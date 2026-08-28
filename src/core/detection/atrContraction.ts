import { Candle, ATRContractionResult } from '../types';

/**
 * Detect ATR contraction (volatility decrease).
 *
 * Compares current ATR to previous ATR values to determine
 * if volatility is contracting, stable, or expanding.
 */
export function detectATRContraction(
  atrValues: number[],
  currentIndex: number,
  lookback: number = 10
): ATRContractionResult {
  if (currentIndex < lookback || atrValues.length < currentIndex + 1) {
    return {
      status: 'INVALID',
      reason: 'Insufficient ATR data',
      metrics: {
        currentATR: NaN,
        previousATR: NaN,
        atrChangePercent: NaN,
        trend: 'stable',
      },
    };
  }

  const currentATR = atrValues[currentIndex];
  const previousATR = atrValues[currentIndex - 1];

  if (isNaN(currentATR) || isNaN(previousATR)) {
    return {
      status: 'INVALID',
      reason: 'ATR value is NaN',
      metrics: {
        currentATR,
        previousATR,
        atrChangePercent: NaN,
        trend: 'stable',
      },
    };
  }

  // Calculate average ATR over lookback period
  let avgATR = 0;
  let count = 0;
  for (let i = Math.max(0, currentIndex - lookback); i <= currentIndex; i++) {
    if (!isNaN(atrValues[i])) {
      avgATR += atrValues[i];
      count++;
    }
  }
  avgATR = count > 0 ? avgATR / count : currentATR;

  // Calculate change from previous to current
  const atrChangePercent = previousATR > 0
    ? ((currentATR - previousATR) / previousATR) * 100
    : 0;

  // Determine trend
  let trend: 'contracting' | 'stable' | 'expanding' = 'stable';
  if (currentATR < previousATR * 0.95) {
    trend = 'contracting';
  } else if (currentATR > previousATR * 1.05) {
    trend = 'expanding';
  }

  return {
    status: trend === 'contracting' ? 'VALID' : 'INVALID',
    reason: trend === 'contracting'
      ? `ATR contracting: ${atrChangePercent.toFixed(1)}%`
      : `ATR ${trend}: ${atrChangePercent.toFixed(1)}%`,
    metrics: {
      currentATR,
      previousATR,
      atrChangePercent,
      trend,
    },
  };
}

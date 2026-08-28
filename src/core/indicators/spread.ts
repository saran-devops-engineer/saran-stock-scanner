import { EMAClusterResult, CompressionTrend } from '../types';

/**
 * Calculate the spread metrics for an EMA cluster (3 or 4 EMAs).
 */
export function calculateEMAClusterSpread(
  emaValues: number[],
  atrValue: number,
  currentPrice: number
): EMAClusterResult {
  const validValues = emaValues.filter((v) => !isNaN(v));
  if (validValues.length < 2) {
    return {
      high: NaN,
      low: NaN,
      spread: NaN,
      spreadPercent: NaN,
      spreadATR: NaN,
      midpoint: NaN,
    };
  }

  const high = Math.max(...validValues);
  const low = Math.min(...validValues);
  const spread = high - low;
  const midpoint = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const spreadPercent = low > 0 ? (spread / low) * 100 : NaN;
  const spreadATR = atrValue > 0 ? spread / atrValue : NaN;

  return { high, low, spread, spreadPercent, spreadATR, midpoint };
}

/**
 * Calculate compression trend by comparing spread at different points in time.
 */
export function calculateCompressionTrend(
  ema20Values: number[],
  ema50Values: number[],
  ema100Values: number[],
  atrValues: number[],
  currentIndex: number,
  minCandles: number
): CompressionTrend {
  const getSpreadAt = (idx: number): { spreadPercent: number; atrRatio: number } => {
    if (idx < 0 || idx >= ema20Values.length) {
      return { spreadPercent: NaN, atrRatio: NaN };
    }
    const e20 = ema20Values[idx];
    const e50 = ema50Values[idx];
    const e100 = ema100Values[idx];
    const atr = atrValues[idx];

    if ([e20, e50, e100, atr].some((v) => isNaN(v))) {
      return { spreadPercent: NaN, atrRatio: NaN };
    }

    const high = Math.max(e20, e50, e100);
    const low = Math.min(e20, e50, e100);
    const spread = high - low;
    const spreadPercent = low > 0 ? (spread / low) * 100 : NaN;
    const atrRatio = atr > 0 ? spread / atr : NaN;

    return { spreadPercent, atrRatio };
  };

  const current = getSpreadAt(currentIndex);
  const previous = getSpreadAt(currentIndex - 1);
  const older = getSpreadAt(currentIndex - minCandles);

  // Determine spread trend
  let trend: 'compressing' | 'stable' | 'expanding' = 'stable';
  if (!isNaN(current.spreadPercent) && !isNaN(previous.spreadPercent)) {
    const diff = current.spreadPercent - previous.spreadPercent;
    if (diff < -0.05) trend = 'compressing';
    else if (diff > 0.05) trend = 'expanding';
  }

  // Determine ATR trend
  let atrTrend: 'contracting' | 'stable' | 'expanding' = 'stable';
  const currentATR = atrValues[currentIndex];
  const previousATR = atrValues[currentIndex - 1];
  if (!isNaN(currentATR) && !isNaN(previousATR)) {
    const atrDiff = ((currentATR - previousATR) / previousATR) * 100;
    if (atrDiff < -1) atrTrend = 'contracting';
    else if (atrDiff > 1) atrTrend = 'expanding';
  }

  // Count compression candles
  let compressionCandles = 0;
  for (let i = currentIndex; i >= 0; i--) {
    const s = getSpreadAt(i);
    if (isNaN(s.spreadPercent)) break;
    // A candle counts as compressed if it's within 1.5x the current spread
    if (!isNaN(current.spreadPercent) && s.spreadPercent <= current.spreadPercent * 1.5) {
      compressionCandles++;
    } else {
      break;
    }
  }

  return {
    currentSpreadPercent: current.spreadPercent,
    previousSpreadPercent: previous.spreadPercent,
    olderSpreadPercent: older.spreadPercent,
    trend,
    atrTrend,
    compressionCandles,
  };
}

/**
 * Calculate price-to-cluster distance metrics.
 */
export function calculatePriceToClusterDistance(
  currentPrice: number,
  clusterMidpoint: number,
  atrValue: number
): { percent: number; atrRatio: number } {
  const distance = Math.abs(currentPrice - clusterMidpoint);
  const percent = clusterMidpoint > 0 ? (distance / clusterMidpoint) * 100 : NaN;
  const atrRatio = atrValue > 0 ? distance / atrValue : NaN;
  return { percent, atrRatio };
}

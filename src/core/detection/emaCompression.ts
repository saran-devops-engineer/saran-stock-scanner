import { CompressionConfig, EMACompressionResult } from '../types';
import { calculateEMAClusterSpread } from '../indicators';

/**
 * Detect EMA compression with strict rules:
 * 1. EMA20, EMA50, EMA100 must ALL be above EMA200 (strictly)
 * 2. All EMAs must be close together (compression)
 *
 * This aligns with the ChartINK scanner approach.
 */
export function detectEMACompression(
  ema20Current: number,
  ema50Current: number,
  ema100Current: number,
  ema200Current: number,
  atrCurrent: number,
  compressionTrend: {
    compressionCandles: number;
    trend: 'compressing' | 'stable' | 'expanding';
  },
  config: CompressionConfig,
  minCandles: number
): EMACompressionResult {
  // RULE 1: All 3 EMAs must be strictly above EMA200
  const allAbove200 =
    !isNaN(ema20Current) &&
    !isNaN(ema50Current) &&
    !isNaN(ema100Current) &&
    !isNaN(ema200Current) &&
    ema20Current > ema200Current &&
    ema50Current > ema200Current &&
    ema100Current > ema200Current;

  if (!allAbove200) {
    const reasons: string[] = [];
    if (!isNaN(ema20Current) && !isNaN(ema200Current) && ema20Current <= ema200Current) {
      reasons.push(`EMA20 (${ema20Current.toFixed(2)}) <= EMA200 (${ema200Current.toFixed(2)})`);
    }
    if (!isNaN(ema50Current) && !isNaN(ema200Current) && ema50Current <= ema200Current) {
      reasons.push(`EMA50 (${ema50Current.toFixed(2)}) <= EMA200 (${ema200Current.toFixed(2)})`);
    }
    if (!isNaN(ema100Current) && !isNaN(ema200Current) && ema100Current <= ema200Current) {
      reasons.push(`EMA100 (${ema100Current.toFixed(2)}) <= EMA200 (${ema200Current.toFixed(2)})`);
    }

    return {
      status: 'INVALID',
      reason: reasons.length > 0
        ? `EMAs not above EMA200: ${reasons.join('; ')}`
        : 'EMAs not above EMA200',
      metrics: {
        clusterType: '3EMA',
        spreadPercent: NaN,
        spreadATR: NaN,
        compressionCandles: compressionTrend.compressionCandles,
        trend: compressionTrend.trend,
      },
    };
  }

  // RULE 2: Check 4-EMA cluster (all 4 close together)
  const fourEMASpread = calculateEMAClusterSpread(
    [ema20Current, ema50Current, ema100Current, ema200Current],
    atrCurrent,
    ema20Current
  );

  const fourEMAPass =
    !isNaN(fourEMASpread.spreadPercent) &&
    !isNaN(fourEMASpread.spreadATR) &&
    fourEMASpread.spreadPercent <= config.fourEMA.maxSpreadPercent &&
    fourEMASpread.spreadATR <= config.fourEMA.maxSpreadATR;

  if (fourEMAPass && compressionTrend.compressionCandles >= minCandles) {
    return {
      status: 'VALID',
      reason: `4-EMA compression (all above EMA200): spread ${fourEMASpread.spreadPercent.toFixed(2)}% / ${fourEMASpread.spreadATR.toFixed(2)} ATR`,
      metrics: {
        clusterType: '4EMA',
        spreadPercent: fourEMASpread.spreadPercent,
        spreadATR: fourEMASpread.spreadATR,
        compressionCandles: compressionTrend.compressionCandles,
        trend: compressionTrend.trend,
      },
    };
  }

  // Check 3-EMA cluster (core: EMA20, EMA50, EMA100 — all above EMA200 already verified)
  const threeEMASpread = calculateEMAClusterSpread(
    [ema20Current, ema50Current, ema100Current],
    atrCurrent,
    ema20Current
  );

  const threeEMAPass =
    !isNaN(threeEMASpread.spreadPercent) &&
    !isNaN(threeEMASpread.spreadATR) &&
    threeEMASpread.spreadPercent <= config.threeEMA.maxSpreadPercent &&
    threeEMASpread.spreadATR <= config.threeEMA.maxSpreadATR;

  if (threeEMAPass && compressionTrend.compressionCandles >= minCandles) {
    return {
      status: 'VALID',
      reason: `3-EMA compression (all above EMA200): spread ${threeEMASpread.spreadPercent.toFixed(2)}% / ${threeEMASpread.spreadATR.toFixed(2)} ATR`,
      metrics: {
        clusterType: '3EMA',
        spreadPercent: threeEMASpread.spreadPercent,
        spreadATR: threeEMASpread.spreadATR,
        compressionCandles: compressionTrend.compressionCandles,
        trend: compressionTrend.trend,
      },
    };
  }

  // Check if developing (close to threshold, all above EMA200)
  const isDeveloping =
    (threeEMASpread.spreadPercent <= config.threeEMA.maxSpreadPercent * 1.5 ||
      fourEMASpread.spreadPercent <= config.fourEMA.maxSpreadPercent * 1.5) &&
    compressionTrend.compressionCandles >= Math.floor(minCandles * 0.5);

  if (isDeveloping) {
    const bestSpread = fourEMASpread.spreadPercent < threeEMASpread.spreadPercent
      ? fourEMASpread
      : threeEMASpread;
    const clusterType = fourEMASpread.spreadPercent < threeEMASpread.spreadPercent ? '4EMA' : '3EMA';

    return {
      status: 'DEVELOPING',
      reason: `${clusterType} compression developing (all above EMA200): ${bestSpread.spreadPercent.toFixed(2)}%`,
      metrics: {
        clusterType,
        spreadPercent: bestSpread.spreadPercent,
        spreadATR: bestSpread.spreadATR,
        compressionCandles: compressionTrend.compressionCandles,
        trend: compressionTrend.trend,
      },
    };
  }

  return {
    status: 'INVALID',
    reason: `EMAs above EMA200 but not compressed enough (spread: ${threeEMASpread.spreadPercent.toFixed(2)}%)`,
    metrics: {
      clusterType: '3EMA',
      spreadPercent: threeEMASpread.spreadPercent,
      spreadATR: threeEMASpread.spreadATR,
      compressionCandles: compressionTrend.compressionCandles,
      trend: compressionTrend.trend,
    },
  };
}

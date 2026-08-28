import { Candle, ScannerConfig, ScanResult } from '../types';
import { calculateAllEMAs, calculateATR, calculateCompressionTrend, calculatePriceToClusterDistance } from '../indicators';
import { detectPriceExpansion, detectPriceCorrection, detectTimeCorrection, detectEMACompression, detectATRContraction } from '../detection';
import { calculateOverallScore, determineSetupStatus } from '../scoring';

/**
 * Scan a single stock on a single timeframe.
 *
 * Returns a complete ScanResult with all metrics and score breakdown.
 */
export function scanStock(
  symbol: string,
  candles: Candle[],
  timeframe: string,
  config: ScannerConfig,
  mtfConfirmationCount: number = 0
): ScanResult {
  const invalidResult: ScanResult = {
    symbol,
    timeframe: timeframe as ScanResult['timeframe'],
    status: 'INVALID',
    clusterType: '3EMA',
    emaSpreadPercent: NaN,
    emaAtrRatio: NaN,
    atrTrend: 'stable',
    expansionPercent: 0,
    correctionPercent: 0,
    consolidationRangePercent: 0,
    compressionCandles: 0,
    priceClusterDistance: NaN,
    score: 0,
    scoreBreakdown: {
      expansion: 0, expansionStrength: 0, correctionQuality: 0,
      timeCorrection: 0, consolidationTightness: 0, atrContraction: 0,
      emaCompressionPercent: 0, emaCompressionATR: 0, compressionPersistence: 0,
      compressionDirection: 0, fourEMABonus: 0, priceToCluster: 0,
      multiTimeframe: 0, total: 0,
    },
    details: {
      expansion: 'Insufficient data',
      correction: 'No expansion detected',
      timeCorrection: 'No correction detected',
      compression: 'No compression detected',
    },
  };

  // Need enough candles for EMA200 + some buffer
  const minCandles = config.ema.period4 + 50;
  if (candles.length < minCandles) {
    return invalidResult;
  }

  const currentIndex = candles.length - 1;
  const closes = candles.map((c) => c.close);

  // Calculate indicators
  const emas = calculateAllEMAs(closes, config.ema);
  const atr = calculateATR(candles, config.atr.period);

  // Check if we have valid EMA and ATR values
  if (
    isNaN(emas.ema20.currentValue) ||
    isNaN(emas.ema50.currentValue) ||
    isNaN(emas.ema100.currentValue) ||
    isNaN(atr.currentValue)
  ) {
    return invalidResult;
  }

  const ema200Valid = !isNaN(emas.ema200.currentValue);

  // Calculate compression trend
  const compressionTrend = calculateCompressionTrend(
    emas.ema20.values,
    emas.ema50.values,
    emas.ema100.values,
    atr.values,
    currentIndex,
    config.timeCorrection.minCandles
  );

  // Get timeframe-specific min candles
  const tfConfig = config.timeframes.find((t) => t.timeframe === timeframe);
  const minCompressionCandles = tfConfig?.minCompressionCandles || config.timeCorrection.minCandles;

  // Run detection
  const expansionResult = detectPriceExpansion(candles, currentIndex, config.expansion);
  const correctionResult = expansionResult.status === 'VALID'
    ? detectPriceCorrection(candles, currentIndex, expansionResult.metrics.expansionHigh, config.correction)
    : { status: 'INVALID' as const, reason: 'No expansion', metrics: { correctionHigh: 0, correctionLow: 0, correctionPercent: 0, quality: 'excessive' as const } };

  const timeCorrectionResult = detectTimeCorrection(candles, currentIndex, config.timeCorrection);

  const emaCompressionResult = detectEMACompression(
    emas.ema20.currentValue,
    emas.ema50.currentValue,
    emas.ema100.currentValue,
    ema200Valid ? emas.ema200.currentValue : NaN,
    atr.currentValue,
    compressionTrend,
    config.compression,
    minCompressionCandles
  );

  const atrContractionResult = detectATRContraction(atr.values, currentIndex);

  // Calculate price-to-cluster distance
  const clusterMidpoint = emaCompressionResult.metrics.clusterType === '4EMA'
    ? (emas.ema20.currentValue + emas.ema50.currentValue + emas.ema100.currentValue + (ema200Valid ? emas.ema200.currentValue : emas.ema100.currentValue)) / (ema200Valid ? 4 : 3)
    : (emas.ema20.currentValue + emas.ema50.currentValue + emas.ema100.currentValue) / 3;

  const priceToCluster = calculatePriceToClusterDistance(
    candles[currentIndex].close,
    clusterMidpoint,
    atr.currentValue
  );

  // Calculate score
  const scoreBreakdown = calculateOverallScore(
    expansionResult,
    correctionResult,
    timeCorrectionResult,
    emaCompressionResult,
    atrContractionResult,
    priceToCluster,
    mtfConfirmationCount,
    config
  );

  // Determine status
  const status = determineSetupStatus(
    scoreBreakdown.total,
    emaCompressionResult.status,
    expansionResult.status,
    correctionResult.status,
    timeCorrectionResult.status,
    emaCompressionResult.metrics.clusterType
  );

  return {
    symbol,
    timeframe: timeframe as ScanResult['timeframe'],
    status,
    clusterType: emaCompressionResult.metrics.clusterType,
    emaSpreadPercent: emaCompressionResult.metrics.spreadPercent,
    emaAtrRatio: emaCompressionResult.metrics.spreadATR,
    atrTrend: atrContractionResult.metrics.trend,
    expansionPercent: expansionResult.metrics.expansionPercent,
    correctionPercent: correctionResult.metrics.correctionPercent,
    consolidationRangePercent: timeCorrectionResult.metrics.consolidationRangePercent,
    compressionCandles: emaCompressionResult.metrics.compressionCandles,
    priceClusterDistance: priceToCluster.percent,
    score: scoreBreakdown.total,
    scoreBreakdown,
    details: {
      expansion: expansionResult.reason,
      correction: correctionResult.reason,
      timeCorrection: timeCorrectionResult.reason,
      compression: emaCompressionResult.reason,
    },
  };
}

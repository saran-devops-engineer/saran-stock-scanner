import { Candle, ScannerConfig, ScanResult, MultiTimeframeScanResult, Timeframe } from '../types';
import { scanStock } from './scanStock';

/**
 * Scan a single stock across multiple timeframes.
 */
export function scanMultipleTimeframes(
  symbol: string,
  candlesByTimeframe: Record<Timeframe, Candle[]>,
  config: ScannerConfig
): MultiTimeframeScanResult {
  const enabledTimeframes = config.timeframes.filter((t) => t.enabled);
  const results: ScanResult[] = [];
  let confirmationCount = 0;

  // First pass: scan each timeframe
  for (const tfConfig of enabledTimeframes) {
    const candles = candlesByTimeframe[tfConfig.timeframe];
    if (!candles || candles.length === 0) continue;

    const result = scanStock(symbol, candles, tfConfig.timeframe, config);
    results.push(result);

    if (result.status === 'STRONG' || result.status === 'VALID') {
      confirmationCount++;
    }
  }

  // Calculate MTF score
  let mtfScore = 0;
  const highestTimeframe = getHighestConfirmedTimeframe(results, enabledTimeframes);

  // Higher timeframes carry more weight
  const timeframeWeights: Record<string, number> = {
    monthly: 5,
    weekly: 4,
    daily: 3,
    '4h': 2,
    '1h': 2,
    '30m': 1,
    '15m': 1,
    '5m': 1,
    '1m': 1,
  };

  for (const result of results) {
    const weight = timeframeWeights[result.timeframe] || 1;
    const normalizedScore = result.score / 100; // normalize 0-100 to 0-1
    mtfScore += weight * normalizedScore;
  }

  // Normalize MTF score to 0-100
  const maxMTF = enabledTimeframes.reduce((sum, tf) => {
    const weight = timeframeWeights[tf.timeframe] || 1;
    return sum + weight; // max per timeframe is weight * 1.0
  }, 0);
  const normalizedMTFScore = Math.min(100, maxMTF > 0 ? Math.round((mtfScore / maxMTF) * 100) : 0);

  // Determine MTF status
  let mtfStatus: ScanResult['status'] = 'INVALID';
  if (config.mtfMode === 'ALL') {
    mtfStatus = confirmationCount === enabledTimeframes.length ? 'VALID' : 'INVALID';
  } else {
    // ANY mode
    mtfStatus = confirmationCount > 0 ? 'VALID' : 'INVALID';
  }

  // If we have multi-timeframe confirmation, upgrade status
  if (confirmationCount >= 2 && mtfStatus === 'VALID') {
    const bestResult = results.reduce((best, r) =>
      r.score > best.score ? r : best
    );
    if (bestResult.status === 'VALID') {
      mtfStatus = 'STRONG';
    }
  }

  return {
    symbol,
    timeframes: results,
    mtfScore: normalizedMTFScore,
    mtfStatus,
    confirmationCount,
    highestTimeframe,
  };
}

/**
 * Get the highest timeframe that confirmed the setup.
 */
function getHighestConfirmedTimeframe(
  results: ScanResult[],
  enabledTimeframes: { timeframe: Timeframe; enabled: boolean }[]
): Timeframe | null {
  const hierarchy: Timeframe[] = ['monthly', 'weekly', 'daily', '4h', '1h', '30m', '15m', '5m', '1m'];

  for (const tf of hierarchy) {
    const result = results.find(
      (r) => r.timeframe === tf && (r.status === 'STRONG' || r.status === 'VALID')
    );
    if (result) return tf;
  }

  return null;
}

/**
 * Scan multiple stocks across multiple timeframes.
 */
export function scanMultipleStocks(
  stockData: Record<string, Record<Timeframe, Candle[]>>,
  config: ScannerConfig
): MultiTimeframeScanResult[] {
  const results: MultiTimeframeScanResult[] = [];

  for (const [symbol, candlesByTimeframe] of Object.entries(stockData)) {
    const result = scanMultipleTimeframes(symbol, candlesByTimeframe, config);
    results.push(result);
  }

  // Sort by MTF score (descending)
  results.sort((a, b) => b.mtfScore - a.mtfScore);

  return results;
}

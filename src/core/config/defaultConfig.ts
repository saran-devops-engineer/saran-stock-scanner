import { ScannerConfig } from '../types';

export const DEFAULT_CONFIG: ScannerConfig = {
  ema: {
    period1: 20,
    period2: 50,
    period3: 100,
    period4: 200,
  },
  atr: {
    period: 14,
  },
  compression: {
    threeEMA: {
      maxSpreadPercent: 1.5,   // EMAs must be within 1.5% of each other
      maxSpreadATR: 0.40,      // spread must be < 40% of ATR
    },
    fourEMA: {
      maxSpreadPercent: 2.5,   // all 4 EMAs within 2.5%
      maxSpreadATR: 0.60,      // spread < 60% of ATR
    },
  },
  expansion: {
    lookback: 800,             // Scan up to 800 candles (~3 years) for expansion
    minPercent: 20,            // At least 20% expansion move
  },
  correction: {
    minPercent: 5,             // Minimum 5% correction from peak
    maxPercent: 60,            // Max 60% correction (trend not broken)
  },
  timeCorrection: {
    minCandles: 20,            // At least 20 candles (~1 month) of consolidation
    maxRangePercent: 15,       // Consolidation range within 15%
    maxCandleRangePercent: 8,  // Occasional swings OK, but no single monster candle
    maxRangeStdDev: 1.2,       // Daily candle ranges must be consistent (rejects erratic swings)
  },
  priceDistance: {
    maxPercent: 5.0,
    maxATR: 1.5,
  },
  scoring: {
    expansion: 8,
    expansionStrength: 7,
    correctionQuality: 8,
    timeCorrection: 8,
    consolidationTightness: 10,
    atrContraction: 8,
    emaCompressionPercent: 12,
    emaCompressionATR: 12,
    compressionPersistence: 5,
    compressionDirection: 5,
    fourEMABonus: 5,
    priceToCluster: 5,
    multiTimeframe: 7,
  },
  timeframes: [
    { timeframe: 'monthly', enabled: false, minCompressionCandles: 2 },
    { timeframe: 'weekly', enabled: true, minCompressionCandles: 3 },
    { timeframe: 'daily', enabled: true, minCompressionCandles: 3 },
    { timeframe: '4h', enabled: false, minCompressionCandles: 5 },
    { timeframe: '1h', enabled: false, minCompressionCandles: 8 },
    { timeframe: '30m', enabled: false, minCompressionCandles: 10 },
    { timeframe: '15m', enabled: true, minCompressionCandles: 5 },
    { timeframe: '5m', enabled: false, minCompressionCandles: 10 },
    { timeframe: '1m', enabled: false, minCompressionCandles: 15 },
  ],
  mtfMode: 'ANY',
  includeCurrentCandle: false,
};

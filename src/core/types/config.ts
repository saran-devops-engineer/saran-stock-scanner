import { Timeframe } from './ohlcv';

export interface EMAConfig {
  period1: number;
  period2: number;
  period3: number;
  period4: number;
}

export interface ATRConfig {
  period: number;
}

export interface CompressionConfig {
  threeEMA: {
    maxSpreadPercent: number;
    maxSpreadATR: number;
  };
  fourEMA: {
    maxSpreadPercent: number;
    maxSpreadATR: number;
  };
}

export interface ExpansionConfig {
  lookback: number;
  minPercent: number;
}

export interface CorrectionConfig {
  minPercent: number;
  maxPercent: number;
}

export interface TimeCorrectionConfig {
  minCandles: number;
  maxRangePercent: number;
  maxCandleRangePercent: number;
  maxRangeStdDev: number;
}

export interface PriceDistanceConfig {
  maxPercent: number;
  maxATR: number;
}

export interface ScoringWeights {
  expansion: number;
  expansionStrength: number;
  correctionQuality: number;
  timeCorrection: number;
  consolidationTightness: number;
  atrContraction: number;
  emaCompressionPercent: number;
  emaCompressionATR: number;
  compressionPersistence: number;
  compressionDirection: number;
  fourEMABonus: number;
  priceToCluster: number;
  multiTimeframe: number;
}

export interface TimeframeConfig {
  timeframe: Timeframe;
  enabled: boolean;
  minCompressionCandles: number;
}

export interface ScannerConfig {
  ema: EMAConfig;
  atr: ATRConfig;
  compression: CompressionConfig;
  expansion: ExpansionConfig;
  correction: CorrectionConfig;
  timeCorrection: TimeCorrectionConfig;
  priceDistance: PriceDistanceConfig;
  scoring: ScoringWeights;
  timeframes: TimeframeConfig[];
  mtfMode: 'ANY' | 'ALL';
  includeCurrentCandle: boolean;
}

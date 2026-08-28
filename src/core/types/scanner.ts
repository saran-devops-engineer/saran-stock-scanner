import { Timeframe } from './ohlcv';

export interface ScoreBreakdown {
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
  total: number;
}

export type SetupStatus = 'STRONG' | 'VALID' | 'DEVELOPING' | 'INVALID';

export interface ScanResult {
  symbol: string;
  timeframe: Timeframe;
  status: SetupStatus;
  clusterType: '3EMA' | '4EMA';
  emaSpreadPercent: number;
  emaAtrRatio: number;
  atrTrend: 'contracting' | 'stable' | 'expanding';
  expansionPercent: number;
  correctionPercent: number;
  consolidationRangePercent: number;
  compressionCandles: number;
  priceClusterDistance: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  details: {
    expansion: string;
    correction: string;
    timeCorrection: string;
    compression: string;
  };
}

export interface MultiTimeframeScanResult {
  symbol: string;
  timeframes: ScanResult[];
  mtfScore: number;
  mtfStatus: SetupStatus;
  confirmationCount: number;
  highestTimeframe: Timeframe | null;
}

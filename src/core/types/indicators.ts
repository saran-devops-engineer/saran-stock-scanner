export interface EMAResult {
  values: number[];
  currentValue: number;
}

export interface ATRResult {
  values: number[];
  currentValue: number;
}

export interface EMASpread {
  spread: number;
  spreadPercent: number;
  spreadATR: number;
}

export interface EMAClusterResult {
  high: number;
  low: number;
  spread: number;
  spreadPercent: number;
  spreadATR: number;
  midpoint: number;
}

export interface CompressionTrend {
  currentSpreadPercent: number;
  previousSpreadPercent: number;
  olderSpreadPercent: number;
  trend: 'compressing' | 'stable' | 'expanding';
  atrTrend: 'contracting' | 'stable' | 'expanding';
  compressionCandles: number;
}

export interface IndicatorResults {
  ema20: EMAResult;
  ema50: EMAResult;
  ema100: EMAResult;
  ema200: EMAResult;
  atr: ATRResult;
  threeEMACluster: EMAClusterResult;
  fourEMACluster: EMAClusterResult;
  compressionTrend: CompressionTrend;
  priceToCluster: {
    percent: number;
    atrRatio: number;
  };
}

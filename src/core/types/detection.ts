export type DetectionStatus = 'VALID' | 'INVALID' | 'DEVELOPING';

export interface DetectionResult {
  status: DetectionStatus;
  reason: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metrics: Record<string, any>;
}

export interface ExpansionResult extends DetectionResult {
  metrics: {
    expansionLow: number;
    expansionHigh: number;
    expansionPercent: number;
    lookbackCandles: number;
  };
}

export interface CorrectionResult extends DetectionResult {
  metrics: {
    correctionHigh: number;
    correctionLow: number;
    correctionPercent: number;
    quality: 'healthy' | 'deep' | 'excessive';
  };
}

export interface TimeCorrectionResult extends DetectionResult {
  metrics: {
    consolidationHigh: number;
    consolidationLow: number;
    consolidationRangePercent: number;
    consolidationCandles: number;
    atrContracting: boolean;
    maxCandleRangePercent: number;
  };
}

export interface EMACompressionResult extends DetectionResult {
  metrics: {
    clusterType: '3EMA' | '4EMA';
    spreadPercent: number;
    spreadATR: number;
    compressionCandles: number;
    trend: 'compressing' | 'stable' | 'expanding';
  };
}

export interface ATRContractionResult extends DetectionResult {
  metrics: {
    currentATR: number;
    previousATR: number;
    atrChangePercent: number;
    trend: 'contracting' | 'stable' | 'expanding';
  };
}

import { Candle } from './ohlcv';

export interface MinerviniTemplateResult {
  passed: boolean;
  score: number;
  criteria: {
    priceAbove150DMA: boolean;
    priceAbove200DMA: boolean;
    dma150Above200: boolean;
    dma200Rising: boolean;
    dma50Above150And200: boolean;
    priceAbove50DMA: boolean;
    above52wLow30pct: boolean;
    within52wHigh25pct: boolean;
  };
  metrics: {
    currentPrice: number;
    dma50: number;
    dma150: number;
    dma200: number;
    week52High: number;
    week52Low: number;
    percentAbove52wLow: number;
    percentBelow52wHigh: number;
  };
}

export interface MomentumBurstResult {
  detected: boolean;
  score: number;
  criteria: {
    closeNearHigh: boolean;
    notConsecutiveUp: boolean;
    tightConsolidation: boolean;
    volumeExpansion: boolean;
    breakAbove10dHigh: boolean;
    rsiNotOverbought: boolean;
  };
  metrics: {
    closeToHighRange: number;
    consolidationDays: number;
    volumeRatio: number;
    high10d: number;
    rsi14: number;
    entryPrice: number;
    stopLoss: number;
  };
}

export interface QualityFilterResult {
  passed: boolean;
  score: number;
  criteria: {
    roeAbove12: boolean;
    salesGrowth10: boolean;
    lowDebt: boolean;
    minVolume: boolean;
    minMarketCap: boolean;
  };
  metrics: {
    roe: number;
    salesGrowth: number;
    debtToEquity: number;
    avgVolumeCr: number;
    marketCapCr: number;
  };
}

export interface MarketRegimeResult {
  regime: 'BULL' | 'NORMAL' | 'WEAK' | 'BEAR';
  score: number;
  sizeMultiplier: number;
  metrics: {
    niftyPrice: number;
    niftyAbove20DMA: boolean;
    niftyAbove200DMA: boolean;
    breadthPercentAbove50DMA: number;
    vix: number;
  };
}

export interface SwingTradeSetup {
  symbol: string;
  overallScore: number;
  entry: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: number;
  positionSize: number;
  status: 'BUY' | 'WATCH' | 'AVOID';
  minervini: MinerviniTemplateResult;
  momentum: MomentumBurstResult;
  quality: QualityFilterResult;
  marketRegime: MarketRegimeResult;
  confluence: string[];
  warnings: string[];
}

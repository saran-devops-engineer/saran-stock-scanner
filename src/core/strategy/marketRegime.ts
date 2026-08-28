import { MarketRegimeResult } from '../types/strategy';

export function detectMarketRegime(
  niftyData: {
    price: number;
    sma20: number;
    sma200: number;
    vix: number;
  },
  breadth: number // % stocks above 50-day MA
): MarketRegimeResult {
  const { price, sma20, sma200, vix } = niftyData;

  const niftyAbove20DMA = price > sma20;
  const niftyAbove200DMA = price > sma200;

  let regime: MarketRegimeResult['regime'];
  let sizeMultiplier: number;

  if (niftyAbove20DMA && breadth > 50) {
    regime = 'BULL';
    sizeMultiplier = 1.0;
  } else if (niftyAbove200DMA) {
    regime = 'NORMAL';
    sizeMultiplier = 0.75;
  } else if (niftyAbove20DMA && !niftyAbove200DMA) {
    regime = 'WEAK';
    sizeMultiplier = 0.25;
  } else {
    regime = 'BEAR';
    sizeMultiplier = 0;
  }

  const regimeScores = { BULL: 100, NORMAL: 75, WEAK: 25, BEAR: 0 };

  return {
    regime,
    score: regimeScores[regime],
    sizeMultiplier,
    metrics: {
      niftyPrice: price,
      niftyAbove20DMA,
      niftyAbove200DMA,
      breadthPercentAbove50DMA: breadth,
      vix,
    },
  };
}

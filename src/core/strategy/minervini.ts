import { Candle } from '../types/ohlcv';
import { MinerviniTemplateResult } from '../types/strategy';

function sma(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

function highestHigh(candles: Candle[], period: number, endIndex: number): number {
  const start = Math.max(0, endIndex - period + 1);
  let max = -Infinity;
  for (let i = start; i <= endIndex; i++) {
    if (candles[i].high > max) max = candles[i].high;
  }
  return max;
}

function lowestLow(candles: Candle[], period: number, endIndex: number): number {
  const start = Math.max(0, endIndex - period + 1);
  let min = Infinity;
  for (let i = start; i <= endIndex; i++) {
    if (candles[i].low < min) min = candles[i].low;
  }
  return min;
}

export function detectMinerviniTemplate(
  candles: Candle[],
  currentIndex: number
): MinerviniTemplateResult {
  const closes = candles.slice(0, currentIndex + 1).map(c => c.close);
  const currentPrice = closes[closes.length - 1];

  const dma50Arr = sma(closes, 50);
  const dma150Arr = sma(closes, 150);
  const dma200Arr = sma(closes, 200);

  const dma50 = dma50Arr[dma50Arr.length - 1];
  const dma150 = dma150Arr[dma150Arr.length - 1];
  const dma200 = dma200Arr[dma200Arr.length - 1];

  const week52High = highestHigh(candles, 252, currentIndex);
  const week52Low = lowestLow(candles, 252, currentIndex);

  const priceAbove150DMA = currentPrice > dma150;
  const priceAbove200DMA = currentPrice > dma200;
  const dma150Above200 = dma150 > dma200;

  let dma200Rising = false;
  if (dma200Arr.length >= 20) {
    const recent200 = dma200Arr.slice(-20);
    dma200Rising = recent200[recent200.length - 1] > recent200[0];
  }

  const dma50Above150And200 = dma50 > dma150 && dma50 > dma200;
  const priceAbove50DMA = currentPrice > dma50;

  const percentAbove52wLow = ((currentPrice - week52Low) / week52Low) * 100;
  const percentBelow52wHigh = ((week52High - currentPrice) / week52High) * 100;

  const above52wLow30pct = percentAbove52wLow >= 30;
  const within52wHigh25pct = percentBelow52wHigh <= 25;

  const criteria = {
    priceAbove150DMA,
    priceAbove200DMA,
    dma150Above200,
    dma200Rising,
    dma50Above150And200,
    priceAbove50DMA,
    above52wLow30pct,
    within52wHigh25pct,
  };

  const passedCount = Object.values(criteria).filter(Boolean).length;
  const score = (passedCount / 8) * 100;

  return {
    passed: passedCount === 8,
    score,
    criteria,
    metrics: {
      currentPrice,
      dma50,
      dma150,
      dma200,
      week52High,
      week52Low,
      percentAbove52wLow,
      percentBelow52wHigh,
    },
  };
}

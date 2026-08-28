import { Candle } from '../types/ohlcv';
import { MomentumBurstResult } from '../types/strategy';

function rsi(closes: number[], period: number): number {
  if (closes.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }
  const recent = changes.slice(-period);
  const gains = recent.filter(c => c > 0);
  const losses = recent.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0.001;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function detectMomentumBurst(
  candles: Candle[],
  currentIndex: number
): MomentumBurstResult {
  if (currentIndex < 20) {
    return {
      detected: false,
      score: 0,
      criteria: {
        closeNearHigh: false,
        notConsecutiveUp: false,
        tightConsolidation: false,
        volumeExpansion: false,
        breakAbove10dHigh: false,
        rsiNotOverbought: false,
      },
      metrics: {
        closeToHighRange: 0,
        consolidationDays: 0,
        volumeRatio: 0,
        high10d: 0,
        rsi14: 50,
        entryPrice: 0,
        stopLoss: 0,
      },
    };
  }

  const current = candles[currentIndex];
  const closes = candles.slice(0, currentIndex + 1).map(c => c.close);

  // Close near day's high (top 25% of range)
  const dayRange = current.high - current.low;
  const closeToHighRange = dayRange > 0
    ? ((current.high - current.close) / dayRange) * 100
    : 50;
  const closeNearHigh = closeToHighRange <= 25;

  // Not up 3 consecutive days
  let consecutiveUp = 0;
  for (let i = currentIndex; i > Math.max(0, currentIndex - 3); i--) {
    if (candles[i].close > candles[i].close) consecutiveUp++;
    else break;
  }
  // Actually count from current backwards
  let upCount = 0;
  for (let i = currentIndex; i > 0 && i > currentIndex - 3; i--) {
    if (candles[i].close > candles[i - 1].close) upCount++;
    else break;
  }
  const notConsecutiveUp = upCount < 3;

  // Tight consolidation: last 3-10 days have small range
  let consolidationDays = 0;
  for (let i = currentIndex; i > Math.max(0, currentIndex - 10); i--) {
    const rangePct = ((candles[i].high - candles[i].low) / candles[i].close) * 100;
    if (rangePct < 3) consolidationDays++;
    else break;
  }
  const tightConsolidation = consolidationDays >= 3;

  // Volume expansion
  const avgVol10 = candles.slice(currentIndex - 10, currentIndex)
    .reduce((a, c) => a + c.volume, 0) / 10;
  const volumeRatio = avgVol10 > 0 ? current.volume / avgVol10 : 0;
  const volumeExpansion = volumeRatio > 1.2;

  // Break above 10-day high
  let high10d = -Infinity;
  for (let i = currentIndex - 10; i < currentIndex; i++) {
    if (candles[i].high > high10d) high10d = candles[i].high;
  }
  const breakAbove10dHigh = current.close > high10d;

  // RSI not overbought
  const rsi14 = rsi(closes, 14);
  const rsiNotOverbought = rsi14 <= 70 && rsi14 >= 50;

  const criteria = {
    closeNearHigh,
    notConsecutiveUp,
    tightConsolidation,
    volumeExpansion,
    breakAbove10dHigh,
    rsiNotOverbought,
  };

  const passedCount = Object.values(criteria).filter(Boolean).length;
  const detected = passedCount >= 4;
  const score = (passedCount / 6) * 100;

  // Entry and stop levels
  const entryPrice = current.close;
  const atr14 = calculateATR(candles, currentIndex, 14);
  const stopLoss = Math.min(current.low, entryPrice - 1.5 * atr14);

  return {
    detected,
    score,
    criteria,
    metrics: {
      closeToHighRange,
      consolidationDays,
      volumeRatio,
      high10d,
      rsi14,
      entryPrice,
      stopLoss,
    },
  };
}

function calculateATR(candles: Candle[], endIndex: number, period: number): number {
  if (endIndex < period) return candles[endIndex].high - candles[endIndex].low;

  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
    sum += tr;
  }
  return sum / period;
}

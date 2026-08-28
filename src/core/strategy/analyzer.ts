import { Candle } from '../types/ohlcv';
import {
  SwingTradeSetup,
  MinerviniTemplateResult,
  MomentumBurstResult,
  QualityFilterResult,
  MarketRegimeResult,
} from '../types/strategy';
import { detectMinerviniTemplate } from './minervini';
import { detectMomentumBurst } from './momentumBurst';
import { detectQualityFilter } from './qualityFilter';
import { detectMarketRegime } from './marketRegime';

export interface StrategyInput {
  symbol: string;
  candles: Candle[];
  fundamentals?: {
    roe?: number;
    salesGrowth?: number;
    debtToEquity?: number;
    avgDailyVolumeCr?: number;
    marketCapCr?: number;
  };
  niftyData?: {
    price: number;
    sma20: number;
    sma200: number;
    vix: number;
  };
  breadth?: number;
  capital?: number;
}

export function analyzeSwingSetup(input: StrategyInput): SwingTradeSetup {
  const { symbol, candles, capital = 1000000 } = input;
  const currentIndex = candles.length - 1;

  // Layer 1: Minervini Trend Template
  const minervini = detectMinerviniTemplate(candles, currentIndex);

  // Layer 2: Momentum Burst Entry
  const momentum = detectMomentumBurst(candles, currentIndex);

  // Layer 3: Quality Filter
  const quality = detectQualityFilter(input.fundamentals || {});

  // Layer 4: Market Regime
  const marketRegime = detectMarketRegime(
    input.niftyData || { price: 0, sma20: 0, sma200: 0, vix: 20 },
    input.breadth ?? 50
  );

  // Calculate overall score (100 points max)
  const minerviniScore = minervini.score * 0.25;  // 25 pts
  const momentumScore = momentum.score * 0.25;     // 25 pts
  const qualityScore = quality.score * 0.20;        // 20 pts
  const regimeScore = marketRegime.score * 0.15;    // 15 pts
  const confluenceBonus = calculateConfluenceBonus(minervini, momentum); // 15 pts

  const overallScore = Math.round(
    minerviniScore + momentumScore + qualityScore + regimeScore + confluenceBonus
  );

  // Determine status
  let status: SwingTradeSetup['status'] = 'AVOID';
  if (overallScore >= 70 && minervini.passed && momentum.detected) {
    status = 'BUY';
  } else if (overallScore >= 55 && minervini.passed) {
    status = 'WATCH';
  }

  // Risk management
  const entry = momentum.metrics.entryPrice || candles[currentIndex].close;
  const stopLoss = momentum.metrics.stopLoss || candles[currentIndex].close * 0.95;
  const riskPerShare = entry - stopLoss;
  const riskAmount = capital * 0.02; // 2% risk
  const positionSize = riskPerShare > 0 ? Math.floor(riskAmount / riskPerShare) : 0;

  const target1 = entry * 1.08; // +8%
  const target2 = entry * 1.15; // +15%
  const riskReward = riskPerShare > 0 ? (target1 - entry) / riskPerShare : 0;

  // Confluence reasons
  const confluence: string[] = [];
  if (minervini.passed) confluence.push('Minervini Template (8/8)');
  if (momentum.criteria.volumeExpansion) confluence.push('Volume Surge');
  if (momentum.criteria.breakAbove10dHigh) confluence.push('10-Day High Breakout');
  if (momentum.criteria.tightConsolidation) confluence.push('Tight Consolidation');
  if (quality.criteria.roeAbove12) confluence.push(`ROE ${quality.metrics.roe}%`);
  if (quality.criteria.salesGrowth10) confluence.push(`Sales +${quality.metrics.salesGrowth}%`);
  if (marketRegime.regime === 'BULL') confluence.push('Bull Market');
  if (momentum.metrics.rsi14 > 50 && momentum.metrics.rsi14 < 70) confluence.push('RSI Bullish');

  // Warnings
  const warnings: string[] = [];
  if (!minervini.passed) warnings.push('Failed Minervini Template');
  if (!momentum.detected) warnings.push('No Momentum Burst');
  if (marketRegime.regime === 'BEAR') warnings.push('Bear Market');
  if (marketRegime.regime === 'WEAK') warnings.push('Weak Market');
  if (quality.metrics.debtToEquity > 2) warnings.push('High Debt');
  if (momentum.metrics.rsi14 > 70) warnings.push('RSI Overbought');

  return {
    symbol,
    overallScore,
    entry,
    stopLoss,
    target1,
    target2,
    riskReward,
    positionSize,
    status,
    minervini,
    momentum,
    quality,
    marketRegime,
    confluence,
    warnings,
  };
}

function calculateConfluenceBonus(
  minervini: MinerviniTemplateResult,
  momentum: MomentumBurstResult
): number {
  let bonus = 0;

  // Both passing = strong confluence
  if (minervini.passed && momentum.detected) bonus += 10;

  // Partial confluence
  if (minervini.score >= 75 && momentum.score >= 60) bonus += 5;

  // Perfect template + good momentum
  if (minervini.score === 100) bonus += 2;

  return Math.min(15, bonus);
}

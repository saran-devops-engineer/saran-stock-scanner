'use client';

import { useState, useCallback } from 'react';
import { Candle, Timeframe } from '@/core/types';
import { calculateAllEMAs, calculateATR, calculateCompressionTrend, calculatePriceToClusterDistance } from '@/core/indicators';
import { detectPriceExpansion, detectPriceCorrection, detectTimeCorrection, detectEMACompression, detectATRContraction } from '@/core/detection';
import { DEFAULT_CONFIG } from '@/core/config';
import { YahooFinanceProvider } from '@/data/providers/yahooFinance';

const provider = new YahooFinanceProvider();

export interface StockAnalysisData {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
  currentPrice: number;
  ema20: number;
  ema50: number;
  ema100: number;
  ema200: number;
  atr: number;
  ema20Values: number[];
  ema50Values: number[];
  ema100Values: number[];
  ema200Values: number[];
  atrValues: number[];
  expansion: ReturnType<typeof detectPriceExpansion>;
  correction: ReturnType<typeof detectPriceCorrection>;
  timeCorrection: ReturnType<typeof detectTimeCorrection>;
  compression: ReturnType<typeof detectEMACompression>;
  atrContraction: ReturnType<typeof detectATRContraction>;
  priceToCluster: { percent: number; atrRatio: number };
}

export function useStockAnalysis() {
  const [data, setData] = useState<StockAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (symbol: string, timeframe: Timeframe) => {
    setLoading(true);
    setError(null);

    try {
      const candles = await provider.fetchOHLCV(symbol, timeframe, 500);
      if (candles.length < 250) {
        throw new Error('Insufficient data for analysis');
      }

      const closes = candles.map((c) => c.close);
      const emas = calculateAllEMAs(closes, DEFAULT_CONFIG.ema);
      const atr = calculateATR(candles, DEFAULT_CONFIG.atr.period);
      const currentIndex = candles.length - 1;

      const compressionTrend = calculateCompressionTrend(
        emas.ema20.values,
        emas.ema50.values,
        emas.ema100.values,
        atr.values,
        currentIndex,
        DEFAULT_CONFIG.timeCorrection.minCandles
      );

      const expansion = detectPriceExpansion(candles, currentIndex, DEFAULT_CONFIG.expansion);
      const correction = expansion.status === 'VALID'
        ? detectPriceCorrection(candles, currentIndex, expansion.metrics.expansionHigh, DEFAULT_CONFIG.correction)
        : { status: 'INVALID' as const, reason: 'No expansion', metrics: { correctionHigh: 0, correctionLow: 0, correctionPercent: 0, quality: 'excessive' as const } };

      const timeCorrection = detectTimeCorrection(candles, currentIndex, DEFAULT_CONFIG.timeCorrection);

      const compression = detectEMACompression(
        emas.ema20.currentValue,
        emas.ema50.currentValue,
        emas.ema100.currentValue,
        emas.ema200.currentValue,
        atr.currentValue,
        compressionTrend,
        DEFAULT_CONFIG.compression,
        DEFAULT_CONFIG.timeCorrection.minCandles
      );

      const atrContraction = detectATRContraction(atr.values, currentIndex);

      const clusterMidpoint = compression.metrics.clusterType === '4EMA'
        ? (emas.ema20.currentValue + emas.ema50.currentValue + emas.ema100.currentValue + emas.ema200.currentValue) / 4
        : (emas.ema20.currentValue + emas.ema50.currentValue + emas.ema100.currentValue) / 3;

      const priceToCluster = calculatePriceToClusterDistance(
        candles[currentIndex].close,
        clusterMidpoint,
        atr.currentValue
      );

      setData({
        symbol,
        timeframe,
        candles,
        currentPrice: candles[currentIndex].close,
        ema20: emas.ema20.currentValue,
        ema50: emas.ema50.currentValue,
        ema100: emas.ema100.currentValue,
        ema200: emas.ema200.currentValue,
        atr: atr.currentValue,
        ema20Values: emas.ema20.values,
        ema50Values: emas.ema50.values,
        ema100Values: emas.ema100.values,
        ema200Values: emas.ema200.values,
        atrValues: atr.values,
        expansion,
        correction,
        timeCorrection,
        compression,
        atrContraction,
        priceToCluster,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, analyze };
}

'use client';

import { useState, useCallback, useRef } from 'react';
import { Candle, Timeframe, ScannerConfig, ScanResult, MultiTimeframeScanResult } from '@/core/types';
import { DEFAULT_CONFIG } from '@/core/config';
import { scanMultipleTimeframes, scanStock } from '@/core/scanner';
import { YahooFinanceProvider } from '@/data/providers/yahooFinance';

const provider = new YahooFinanceProvider();
const CONCURRENCY = 5; // Scan 5 stocks in parallel

export interface ScannerState {
  isScanning: boolean;
  progress: string;
  scannedCount: number;
  totalStocks: number;
  currentSymbol: string;
  results: MultiTimeframeScanResult[];
  error: string | null;
  selectedStock: string | null;
}

async function scanOneStock(
  symbol: string,
  config: ScannerConfig
): Promise<MultiTimeframeScanResult | null> {
  try {
    const enabledTimeframes = config.timeframes.filter((t) => t.enabled).map((t) => t.timeframe);
    const candlesByTimeframe: Partial<Record<Timeframe, Candle[]>> = {};

    for (const tf of enabledTimeframes) {
      const count = tf === 'monthly' ? 300 : tf === 'weekly' ? 300 : 500;
      const candles = await provider.fetchOHLCV(symbol, tf, count);
      if (candles.length > 0) {
        candlesByTimeframe[tf] = candles;
      }
    }

    if (Object.keys(candlesByTimeframe).length === 0) {
      return null;
    }

    return scanMultipleTimeframes(
      symbol,
      candlesByTimeframe as Record<Timeframe, Candle[]>,
      config
    );
  } catch (err) {
    console.error(`Error scanning ${symbol}:`, err);
    return null;
  }
}

export function useScanner() {
  const [state, setState] = useState<ScannerState>({
    isScanning: false,
    progress: '',
    scannedCount: 0,
    totalStocks: 0,
    currentSymbol: '',
    results: [],
    error: null,
    selectedStock: null,
  });
  const [config, setConfig] = useState<ScannerConfig>(DEFAULT_CONFIG);
  const abortRef = useRef<boolean>(false);

  const scanStocks = useCallback(async (symbols: string[]) => {
    abortRef.current = false;
    const total = symbols.length;
    setState((s) => ({
      ...s,
      isScanning: true,
      error: null,
      results: [],
      scannedCount: 0,
      totalStocks: total,
      currentSymbol: '',
    }));

    const allResults: MultiTimeframeScanResult[] = [];
    let scannedCount = 0;

    // Process in batches of CONCURRENCY
    for (let i = 0; i < symbols.length; i += CONCURRENCY) {
      if (abortRef.current) break;

      const batch = symbols.slice(i, i + CONCURRENCY);
      const batchNum = Math.floor(i / CONCURRENCY) + 1;
      const totalBatches = Math.ceil(symbols.length / CONCURRENCY);

      setState((s) => ({
        ...s,
        currentSymbol: batch[0],
        progress: `Batch ${batchNum}/${totalBatches} — ${batch.join(', ')}`,
      }));

      const batchResults = await Promise.all(
        batch.map((symbol) => {
          if (abortRef.current) return Promise.resolve(null);
          return scanOneStock(symbol, config);
        })
      );

      for (const result of batchResults) {
        if (result) {
          allResults.push(result);
        }
        scannedCount++;
      }

      setState((s) => ({
        ...s,
        scannedCount,
        results: allResults.filter(r => r.mtfScore > 0).sort((a, b) => b.mtfScore - a.mtfScore),
      }));
    }

    setState((s) => ({
      ...s,
      isScanning: false,
      progress: '',
      currentSymbol: '',
      scannedCount: total,
      results: allResults.filter(r => r.mtfScore > 0).sort((a, b) => b.mtfScore - a.mtfScore),
    }));
  }, [config]);

  const scanSingleStock = useCallback(async (symbol: string, timeframe: Timeframe) => {
    setState((s) => ({ ...s, isScanning: true, error: null }));

    try {
      const candles = await provider.fetchOHLCV(symbol, timeframe, 500);
      const result = scanStock(symbol, candles, timeframe, config);

      setState((s) => ({
        ...s,
        isScanning: false,
        selectedStock: symbol,
      }));

      return result;
    } catch (err) {
      setState((s) => ({
        ...s,
        isScanning: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
      return null;
    }
  }, [config]);

  const stopScan = useCallback(() => {
    abortRef.current = true;
    setState((s) => ({ ...s, isScanning: false, progress: '' }));
  }, []);

  return {
    ...state,
    config,
    setConfig,
    scanStocks,
    scanSingleStock,
    stopScan,
  };
}

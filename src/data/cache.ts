import { Candle, Timeframe } from '../core/types';

/**
 * Simple in-memory cache for OHLCV data.
 * Prevents redundant API calls during multi-timeframe scanning.
 */
class DataCache {
  private cache: Map<string, { data: Candle[]; timestamp: number }> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private getKey(symbol: string, timeframe: Timeframe): string {
    return `${symbol}:${timeframe}`;
  }

  get(symbol: string, timeframe: Timeframe): Candle[] | null {
    const key = this.getKey(symbol, timeframe);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(symbol: string, timeframe: Timeframe, data: Candle[]): void {
    const key = this.getKey(symbol, timeframe);
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  has(symbol: string, timeframe: Timeframe): boolean {
    return this.get(symbol, timeframe) !== null;
  }

  invalidate(symbol: string, timeframe?: Timeframe): void {
    if (timeframe) {
      this.cache.delete(this.getKey(symbol, timeframe));
    } else {
      // Invalidate all timeframes for this symbol
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${symbol}:`)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export const dataCache = new DataCache();

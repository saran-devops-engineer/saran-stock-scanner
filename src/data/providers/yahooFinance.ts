import { Candle, Timeframe } from '../../core/types';
import { MarketDataProvider } from '../MarketDataProvider';

const PROXY_BASE_URL = '/api/chart';

const TIMEFRAME_MAP: Record<Timeframe, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1h',
  '4h': '1d', // Yahoo doesn't have 4h, use daily
  daily: '1d',
  weekly: '1wk',
  monthly: '1mo',
};

/**
 * Yahoo Finance returns MONTHLY data when using range=max for NSE stocks.
 * For daily/intraday, we MUST use period1/period2 timestamps to get correct data.
 */
function buildUrl(yahooSymbol: string, interval: string, timeframe: Timeframe): string {
  const symbol = encodeURIComponent(yahooSymbol);

  // Weekly and monthly work fine with range
  if (timeframe === 'weekly' || timeframe === 'monthly') {
    return `${PROXY_BASE_URL}?symbol=${symbol}&interval=${interval}&range=max`;
  }

  // For daily and intraday, use period1/period2 to force correct interval
  const now = Math.floor(Date.now() / 1000);
  let period1: number;

  switch (timeframe) {
    case '1m':
      period1 = now - 5 * 86400; // 5 days
      break;
    case '5m':
    case '15m':
    case '30m':
      period1 = now - 60 * 86400; // 60 days
      break;
    case '1h':
    case '4h':
      period1 = now - 730 * 86400; // 2 years
      break;
    case 'daily':
    default:
      period1 = now - 1500 * 86400; // ~4 years (enough for EMA200 warmup + analysis)
      break;
  }

  return `${PROXY_BASE_URL}?symbol=${symbol}&interval=${interval}&period1=${period1}&period2=${now}`;
}

/**
 * Yahoo Finance data provider for NSE stocks.
 *
 * NSE symbols use the .NS suffix (e.g., RELIANCE.NS).
 */
export class YahooFinanceProvider implements MarketDataProvider {
  name = 'Yahoo Finance';

  getSupportedTimeframes(): Timeframe[] {
    return ['1m', '5m', '15m', '30m', '1h', 'daily', 'weekly', 'monthly'];
  }

  async fetchOHLCV(symbol: string, timeframe: Timeframe, count: number): Promise<Candle[]> {
    const yahooSymbol = this.toYahooSymbol(symbol);
    const interval = TIMEFRAME_MAP[timeframe];
    const url = buildUrl(yahooSymbol, interval, timeframe);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // 404 = symbol not found on Yahoo Finance, skip silently
        if (response.status === 404) return [];
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.chart?.result?.[0];

      if (!result) {
        throw new Error('No data returned from Yahoo Finance');
      }

      const timestamps = result.timestamp || [];
      const ohlcv = result.indicators?.quote?.[0] || {};

      const candles: Candle[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        const open = ohlcv.open?.[i];
        const high = ohlcv.high?.[i];
        const low = ohlcv.low?.[i];
        const close = ohlcv.close?.[i];
        const volume = ohlcv.volume?.[i];

        // Skip invalid candles
        if (
          open == null || high == null || low == null || close == null ||
          isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)
        ) {
          continue;
        }

        candles.push({
          timestamp: timestamps[i] * 1000, // Convert to milliseconds
          open,
          high,
          low,
          close,
          volume: volume || 0,
        });
      }

      // Return the last 'count' candles
      return candles.slice(-count);
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      return [];
    }
  }

  async getHistoricalData(symbol: string, timeframe: Timeframe, count: number) {
    const candles = await this.fetchOHLCV(symbol, timeframe, count);
    return {
      symbol,
      timeframe,
      candles,
    };
  }

  async searchSymbols(query: string): Promise<{ symbol: string; name: string }[]> {
    const url = `/api/search?q=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      const quotes = data.quotes || [];

      return quotes
        .filter((q: { exchange?: string; quoteType?: string }) =>
          q.exchange === 'NSI' || q.quoteType === 'EQUITY'
        )
        .map((q: { symbol: string; shortname?: string; longname?: string }) => ({
          symbol: q.symbol?.replace('.NS', '') || '',
          name: q.shortname || q.longname || '',
        }))
        .filter((s: { symbol: string }) => s.symbol.length > 0);
    } catch {
      return [];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${PROXY_BASE_URL}?symbol=RELIANCE.NS&interval=1d&range=1d`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Convert an NSE symbol to Yahoo Finance format.
   * RELIANCE -> RELIANCE.NS
   */
  private toYahooSymbol(symbol: string): string {
    if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) {
      return symbol;
    }
    return `${symbol}.NS`;
  }
}

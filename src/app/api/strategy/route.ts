import { NextRequest, NextResponse } from 'next/server';
import { analyzeSwingSetup, StrategyInput } from '@/core/strategy';
import { Candle } from '@/core/types/ohlcv';

async function fetchYahooData(symbol: string): Promise<Candle[]> {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - 365 * 24 * 60 * 60; // 1 year

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?period1=${startDate}&period2=${endDate}&interval=1d`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${symbol}`);
  }

  const data = await response.json();
  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const ohlcv = result.indicators.quote[0];

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (ohlcv.open[i] !== null) {
      candles.push({
        timestamp: timestamps[i] * 1000,
        open: ohlcv.open[i],
        high: ohlcv.high[i],
        low: ohlcv.low[i],
        close: ohlcv.close[i],
        volume: ohlcv.volume[i],
      });
    }
  }

  return candles;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols')?.split(',') || [];
    const capital = parseInt(searchParams.get('capital') || '1000000');

    if (symbols.length === 0) {
      return NextResponse.json(
        { error: 'No symbols provided' },
        { status: 400 }
      );
    }

    // Fetch data and analyze each stock
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const candles = await fetchYahooData(symbol.trim());

          if (candles.length < 200) {
            return {
              symbol: symbol.trim(),
              error: 'Insufficient data (need 200+ candles)',
            };
          }

          const input: StrategyInput = {
            symbol: symbol.trim(),
            candles,
            capital,
            // Default market data if not provided
            niftyData: {
              price: 24500,
              sma20: 24200,
              sma200: 23000,
              vix: 14,
            },
            breadth: 55,
          };

          const setup = analyzeSwingSetup(input);
          return setup;
        } catch (error) {
          return {
            symbol: symbol.trim(),
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

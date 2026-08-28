import { NextRequest } from 'next/server';
import { analyzeSwingSetup, StrategyInput } from '@/core/strategy';
import { Candle } from '@/core/types/ohlcv';
import { readFileSync } from 'fs';
import { join } from 'path';

async function fetchYahooData(symbol: string): Promise<Candle[]> {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - 365 * 24 * 60 * 60;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?period1=${startDate}&period2=${endDate}&interval=1d`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const result = data.chart?.result?.[0];
      if (!result?.timestamp) throw new Error('No data');

      const timestamps = result.timestamp;
      const ohlcv = result.indicators?.quote?.[0];
      if (!ohlcv) throw new Error('No OHLCV');

      const candles: Candle[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (ohlcv.open[i] != null && ohlcv.close[i] != null) {
          candles.push({
            timestamp: timestamps[i] * 1000,
            open: ohlcv.open[i],
            high: ohlcv.high[i],
            low: ohlcv.low[i],
            close: ohlcv.close[i],
            volume: ohlcv.volume[i] || 0,
          });
        }
      }
      return candles;
    } catch {
      if (attempt < 1) await new Promise(r => setTimeout(r, 1500));
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const index = searchParams.get('index') || 'nifty200';
  const limit = parseInt(searchParams.get('limit') || '500');
  const capital = parseInt(searchParams.get('capital') || '1000000');

  const dataPath = join(process.cwd(), 'src', 'data', 'lists', `${index}.json`);
  let symbols: string[];
  try {
    const fileData = readFileSync(dataPath, 'utf-8');
    const parsed = JSON.parse(fileData);
    const raw = Array.isArray(parsed) ? parsed : parsed.symbols || [];
    symbols = raw.map((s: { symbol: string } | string) =>
      typeof s === 'string' ? s : s.symbol
    ).slice(0, limit);
  } catch {
    return new Response(`data: {"type":"error","message":"Index ${index} not found"}\n\n`, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: 'start', total: symbols.length, index });

      const BATCH_SIZE = 3;
      const DELAY_MS = 1200;
      let analyzed = 0;
      let failed = 0;

      for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
        const batch = symbols.slice(i, i + BATCH_SIZE);
        const promises = batch.map(async (symbol) => {
          const candles = await fetchYahooData(symbol);
          return { symbol, candles };
        });

        const results = await Promise.all(promises);

        for (const { symbol, candles } of results) {
          if (candles.length < 200) {
            failed++;
            send({ type: 'failed', symbol, reason: 'Insufficient data', progress: i + batch.indexOf(symbol) + 1, total: symbols.length });
            continue;
          }

          try {
            const input: StrategyInput = {
              symbol,
              candles,
              capital,
              niftyData: { price: 24500, sma20: 24200, sma200: 23000, vix: 14 },
              breadth: 55,
            };
            const setup = analyzeSwingSetup(input);
            analyzed++;
            send({ type: 'result', setup, progress: i + batch.indexOf(symbol) + 1, total: symbols.length, analyzed, failed });
          } catch {
            failed++;
            send({ type: 'failed', symbol, reason: 'Analysis error', progress: i + batch.indexOf(symbol) + 1, total: symbols.length });
          }
        }

        if (i + BATCH_SIZE < symbols.length) {
          await new Promise(r => setTimeout(r, DELAY_MS));
        }
      }

      send({ type: 'complete', analyzed, failed, total: symbols.length });
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

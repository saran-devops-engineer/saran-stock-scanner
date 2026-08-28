import { NextRequest, NextResponse } from 'next/server';

const BATCH_DELAY_MS = 500; // Delay between requests to avoid rate limiting

async function fetchSingleStock(symbol: string): Promise<{ symbol: string; data: unknown; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resp = await fetch(`${baseUrl}/api/fundamental?symbol=${symbol}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: 'Failed' }));
      return { symbol, data: null, error: err.error || `HTTP ${resp.status}` };
    }
    const data = await resp.json();
    return { symbol, data };
  } catch (e) {
    return { symbol, data: null, error: e instanceof Error ? e.message : 'Failed' };
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  if (!symbolsParam) return NextResponse.json({ error: 'symbols param required (comma-separated)' }, { status: 400 });

  const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  if (symbols.length === 0) return NextResponse.json({ error: 'No valid symbols' }, { status: 400 });
  if (symbols.length > 50) return NextResponse.json({ error: 'Max 50 symbols per batch' }, { status: 400 });

  const results: { symbol: string; name: string; score: number; pe: number; roe: number; roce: number; marketCap: number; price: number; dividendYield: number; error?: string }[] = [];

  for (let i = 0; i < symbols.length; i++) {
    const result = await fetchSingleStock(symbols[i]);
    if (result.data && typeof result.data === 'object' && 'analysis' in result.data) {
      const d = result.data as Record<string, unknown>;
      const analysis = d.analysis as Record<string, unknown> | undefined;
      results.push({
        symbol: symbols[i],
        name: (d.name as string) || symbols[i],
        score: (analysis?.overall as number) || 0,
        pe: (d.stockPE as number) || 0,
        roe: (d.roe as number) || 0,
        roce: (d.roce as number) || 0,
        marketCap: (d.marketCap as number) || 0,
        price: (d.currentPrice as number) || 0,
        dividendYield: (d.dividendYield as number) || 0,
      });
    } else {
      results.push({
        symbol: symbols[i],
        name: symbols[i],
        score: 0,
        pe: 0,
        roe: 0,
        roce: 0,
        marketCap: 0,
        price: 0,
        dividendYield: 0,
        error: result.error || 'Failed',
      });
    }
    // Delay between requests (except last)
    if (i < symbols.length - 1) await sleep(BATCH_DELAY_MS);
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({ results, total: results.length });
}

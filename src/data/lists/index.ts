import type { StockInfo } from '../types';

export interface IndexList {
  index: string;
  description: string;
  symbols: StockInfo[];
}

// All lists loaded from JSON files
import nifty50 from './nifty50.json';
import nifty100 from './nifty100.json';
import nifty200 from './nifty200.json';
import nifty500 from './nifty500.json';

const INDEX_MAP: Record<string, IndexList> = {
  'NIFTY50': nifty50 as IndexList,
  'NIFTY100': nifty100 as IndexList,
  'NIFTY200': nifty200 as IndexList,
  'NIFTY500': nifty500 as IndexList,
};

export const AVAILABLE_INDEXES = [
  { key: 'NIFTY50', label: 'Nifty 50', count: nifty50.symbols.length },
  { key: 'NIFTY100', label: 'Nifty 100', count: nifty100.symbols.length },
  { key: 'NIFTY200', label: 'Nifty 200', count: nifty200.symbols.length },
  { key: 'NIFTY500', label: 'Nifty 500', count: nifty500.symbols.length },
];

/**
 * Get all unique symbols from selected indexes.
 * Deduplicates if multiple indexes overlap.
 */
export function getSymbolsForIndexes(indexKeys: string[]): StockInfo[] {
  const seen = new Set<string>();
  const result: StockInfo[] = [];

  for (const key of indexKeys) {
    const list = INDEX_MAP[key];
    if (!list) continue;
    for (const stock of list.symbols) {
      if (!seen.has(stock.symbol)) {
        seen.add(stock.symbol);
        result.push(stock);
      }
    }
  }

  return result;
}

/**
 * Get just the symbol strings for selected indexes.
 */
export function getSymbolStrings(indexKeys: string[]): string[] {
  return getSymbolsForIndexes(indexKeys).map(s => s.symbol);
}

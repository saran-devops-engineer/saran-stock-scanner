import { Candle, Timeframe, HistoricalData } from '../core/types';

export interface MarketDataProvider {
  name: string;

  getSupportedTimeframes(): Timeframe[];

  fetchOHLCV(symbol: string, timeframe: Timeframe, count: number): Promise<Candle[]>;

  getHistoricalData(symbol: string, timeframe: Timeframe, count: number): Promise<HistoricalData>;

  searchSymbols(query: string): Promise<{ symbol: string; name: string }[]>;

  isAvailable(): Promise<boolean>;
}

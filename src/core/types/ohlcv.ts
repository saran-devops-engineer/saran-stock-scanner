export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '4h'
  | 'daily'
  | 'weekly'
  | 'monthly';

export interface HistoricalData {
  symbol: string;
  timeframe: Timeframe;
  candles: Candle[];
}

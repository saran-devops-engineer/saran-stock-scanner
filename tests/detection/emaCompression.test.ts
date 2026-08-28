import { describe, it, expect } from 'vitest';
import { detectEMACompression } from '../../src/core/detection/emaCompression';

describe('EMA Compression Detection', () => {
  const defaultConfig = {
    threeEMA: { maxSpreadPercent: 1.5, maxSpreadATR: 0.40 },
    fourEMA: { maxSpreadPercent: 2.5, maxSpreadATR: 0.60 },
  };

  it('should detect valid 4-EMA compression (all above EMA200)', () => {
    // All EMAs close together, all above EMA200
    const result = detectEMACompression(
      100,    // EMA20
      100.5,  // EMA50
      101,    // EMA100
      99,     // EMA200 (below all others)
      10,     // ATR
      { compressionCandles: 5, trend: 'compressing' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('VALID');
    expect(result.metrics.clusterType).toBe('4EMA');
    expect(result.metrics.spreadPercent).toBeLessThan(2.5);
  });

  it('should REJECT when EMA20 is below EMA200', () => {
    const result = detectEMACompression(
      95,     // EMA20 (below EMA200)
      100,    // EMA50
      101,    // EMA100
      99,     // EMA200
      10,     // ATR
      { compressionCandles: 5, trend: 'stable' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('INVALID');
    expect(result.reason).toContain('EMA20');
  });

  it('should REJECT when EMA50 is below EMA200', () => {
    const result = detectEMACompression(
      100,    // EMA20
      95,     // EMA50 (below EMA200)
      101,    // EMA100
      99,     // EMA200
      10,     // ATR
      { compressionCandles: 5, trend: 'stable' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('INVALID');
    expect(result.reason).toContain('EMA50');
  });

  it('should REJECT when EMA100 is below EMA200', () => {
    const result = detectEMACompression(
      100,    // EMA20
      100.5,  // EMA50
      95,     // EMA100 (below EMA200)
      99,     // EMA200
      10,     // ATR
      { compressionCandles: 5, trend: 'stable' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('INVALID');
    expect(result.reason).toContain('EMA100');
  });

  it('should detect valid 3-EMA compression when EMA200 is far below', () => {
    // EMA20/50/100 close together, all above EMA200
    const result = detectEMACompression(
      100,    // EMA20
      100.5,  // EMA50
      101,    // EMA100
      80,     // EMA200 (far below, but all above it)
      10,     // ATR
      { compressionCandles: 5, trend: 'stable' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('VALID');
    expect(result.metrics.clusterType).toBe('3EMA');
  });

  it('should reject when spread is too wide', () => {
    const result = detectEMACompression(
      100,  // EMA20
      103,  // EMA50
      106,  // EMA100
      90,   // EMA200
      10,   // ATR
      { compressionCandles: 5, trend: 'stable' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('INVALID');
  });

  it('should detect developing compression', () => {
    // Moderately close EMAs, all above EMA200
    // Spread = (101.5-100)/100 = 1.5%, within 1.5x of 1.5% threshold = 2.25%
    const result = detectEMACompression(
      100,   // EMA20
      100.8, // EMA50
      101.5, // EMA100
      95,    // EMA200
      10,    // ATR
      { compressionCandles: 2, trend: 'compressing' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('DEVELOPING');
  });

  it('should reject when not enough compression candles', () => {
    const result = detectEMACompression(
      100,   // EMA20
      100.5, // EMA50
      101,   // EMA100
      99,    // EMA200
      10,    // ATR
      { compressionCandles: 1, trend: 'compressing' },
      defaultConfig,
      3
    );

    // Even though spread is tight and above EMA200, not enough candles
    expect(result.status).toBe('DEVELOPING');
  });

  it('should handle NaN values gracefully', () => {
    const result = detectEMACompression(
      NaN, NaN, NaN, NaN, NaN,
      { compressionCandles: 0, trend: 'stable' },
      defaultConfig,
      3
    );

    expect(result.status).toBe('INVALID');
  });
});

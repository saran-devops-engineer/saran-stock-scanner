import { QualityFilterResult } from '../types/strategy';

export function detectQualityFilter(
  fundamentals: {
    roe?: number;
    salesGrowth?: number;
    debtToEquity?: number;
    avgDailyVolumeCr?: number;
    marketCapCr?: number;
  }
): QualityFilterResult {
  const roe = fundamentals.roe ?? 0;
  const salesGrowth = fundamentals.salesGrowth ?? 0;
  const debtToEquity = fundamentals.debtToEquity ?? 0;
  const avgVolumeCr = fundamentals.avgDailyVolumeCr ?? 0;
  const marketCapCr = fundamentals.marketCapCr ?? 0;

  const roeAbove12 = roe >= 12;
  const salesGrowth10 = salesGrowth >= 10;
  const lowDebt = debtToEquity < 2;
  const minVolume = avgVolumeCr >= 5; // ₹5 Cr daily turnover
  const minMarketCap = marketCapCr >= 500; // ₹500 Cr

  const criteria = {
    roeAbove12,
    salesGrowth10,
    lowDebt,
    minVolume,
    minMarketCap,
  };

  const passedCount = Object.values(criteria).filter(Boolean).length;
  const score = (passedCount / 5) * 100;

  return {
    passed: passedCount >= 3,
    score,
    criteria,
    metrics: {
      roe,
      salesGrowth,
      debtToEquity,
      avgVolumeCr,
      marketCapCr,
    },
  };
}

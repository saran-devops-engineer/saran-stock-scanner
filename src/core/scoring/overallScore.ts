import { ScoreBreakdown, ScannerConfig } from '../types';

/**
 * Calculate individual score components and overall score (0-100).
 *
 * Scoring is based on how well the stock matches the ideal pattern:
 * Expansion → Correction → Consolidation → EMA Compression
 */
export function calculateOverallScore(
  expansionResult: { status: string; metrics: { expansionPercent: number } },
  correctionResult: { status: string; metrics: { quality: string; correctionPercent: number } },
  timeCorrectionResult: { status: string; metrics: { consolidationCandles: number; atrContracting: boolean; consolidationRangePercent: number } },
  emaCompressionResult: { status: string; metrics: { clusterType: string; spreadPercent: number; spreadATR: number; compressionCandles: number; trend: string } },
  atrContractionResult: { status: string; metrics: { trend: string } },
  priceToCluster: { percent: number; atrRatio: number },
  mtfConfirmationCount: number,
  config: ScannerConfig
): ScoreBreakdown {
  const w = config.scoring;

  // A. Price Expansion — how big was the rally
  const expansionScore = expansionResult.status === 'VALID'
    ? Math.min(w.expansion, (expansionResult.metrics.expansionPercent / 50) * w.expansion)
    : 0;

  // B. Expansion Strength — bonus for very strong expansions
  const expansionStrength = expansionResult.status === 'VALID'
    ? Math.min(w.expansionStrength, (expansionResult.metrics.expansionPercent / 100) * w.expansionStrength)
    : 0;

  // C. Correction Quality — did it correct healthily
  let correctionScore = 0;
  if (correctionResult.status === 'VALID') {
    correctionScore = correctionResult.metrics.quality === 'healthy' ? w.correctionQuality
      : correctionResult.metrics.quality === 'deep' ? w.correctionQuality * 0.7
      : w.correctionQuality * 0.3;
  }

  // D. Time Correction — consolidation duration (more candles = better)
  const timeCorrectionScore = timeCorrectionResult.status === 'VALID'
    ? Math.min(w.timeCorrection, (timeCorrectionResult.metrics.consolidationCandles / 30) * w.timeCorrection)
    : 0;

  // E. Consolidation Tightness — tighter range = better
  const consolidationTightness = timeCorrectionResult.status === 'VALID'
    ? Math.max(0, w.consolidationTightness * (1 - timeCorrectionResult.metrics.consolidationRangePercent / 20))
    : 0;

  // F. ATR Contraction — volatility decreasing
  const atrContraction = atrContractionResult.metrics.trend === 'contracting' ? w.atrContraction
    : atrContractionResult.metrics.trend === 'stable' ? w.atrContraction * 0.5
    : 0;

  // G. EMA Compression % — tighter spread = higher score
  // BUT only if the pattern phases are detected. Without expansion→correction→consolidation,
  // EMA compression alone is less meaningful (stock could be in a downtrend).
  const patternPhases = [expansionResult.status, correctionResult.status, timeCorrectionResult.status]
    .filter(s => s === 'VALID').length;
  const patternMultiplier = patternPhases === 3 ? 1.0 : patternPhases === 2 ? 0.6 : patternPhases === 1 ? 0.3 : 0.1;

  let emaCompressionPercent = 0;
  if (emaCompressionResult.status === 'VALID') {
    emaCompressionPercent = Math.max(0, w.emaCompressionPercent * (1 - emaCompressionResult.metrics.spreadPercent / 5)) * patternMultiplier;
  } else if (emaCompressionResult.status === 'DEVELOPING') {
    emaCompressionPercent = Math.max(0, w.emaCompressionPercent * 0.3 * (1 - emaCompressionResult.metrics.spreadPercent / 8)) * patternMultiplier;
  }

  // H. EMA Compression / ATR — spread relative to ATR
  let emaCompressionATR = 0;
  if (emaCompressionResult.status === 'VALID') {
    emaCompressionATR = Math.max(0, w.emaCompressionATR * (1 - emaCompressionResult.metrics.spreadATR / 1.5)) * patternMultiplier;
  } else if (emaCompressionResult.status === 'DEVELOPING') {
    emaCompressionATR = Math.max(0, w.emaCompressionATR * 0.3 * (1 - emaCompressionResult.metrics.spreadATR / 2.5)) * patternMultiplier;
  }

  // I. Compression Persistence — how long has compression lasted
  const compressionPersistence = Math.min(w.compressionPersistence,
    (emaCompressionResult.metrics.compressionCandles / 15) * w.compressionPersistence
  ) * patternMultiplier;

  // J. Compression Direction — compressing is best, stable is ok
  const compressionDirection = (emaCompressionResult.metrics.trend === 'compressing' ? w.compressionDirection
    : emaCompressionResult.metrics.trend === 'stable' ? w.compressionDirection * 0.6
    : 0) * patternMultiplier;

  // K. 4 EMA Bonus — all 4 EMAs tight is stronger
  const fourEMABonus = (emaCompressionResult.metrics.clusterType === '4EMA' ? w.fourEMABonus : 0) * patternMultiplier;

  // L. Price-to-Cluster — price near the EMA cluster
  const priceToClusterScore = !isNaN(priceToCluster.percent)
    ? Math.max(0, w.priceToCluster * (1 - priceToCluster.percent / 8))
    : 0;

  // M. Multi-Timeframe — confirmation across timeframes
  const multiTimeframeScore = Math.min(w.multiTimeframe, mtfConfirmationCount * 1.5);

  // Calculate total
  const rawTotal =
    expansionScore +
    expansionStrength +
    correctionScore +
    timeCorrectionScore +
    consolidationTightness +
    atrContraction +
    emaCompressionPercent +
    emaCompressionATR +
    compressionPersistence +
    compressionDirection +
    fourEMABonus +
    priceToClusterScore +
    multiTimeframeScore;

  // Normalize to 0-100
  const maxPossible =
    w.expansion +
    w.expansionStrength +
    w.correctionQuality +
    w.timeCorrection +
    w.consolidationTightness +
    w.atrContraction +
    w.emaCompressionPercent +
    w.emaCompressionATR +
    w.compressionPersistence +
    w.compressionDirection +
    w.fourEMABonus +
    w.priceToCluster +
    w.multiTimeframe;

  const total = Math.round((rawTotal / maxPossible) * 100);

  return {
    expansion: Math.round(expansionScore),
    expansionStrength: Math.round(expansionStrength),
    correctionQuality: Math.round(correctionScore),
    timeCorrection: Math.round(timeCorrectionScore),
    consolidationTightness: Math.round(consolidationTightness),
    atrContraction: Math.round(atrContraction),
    emaCompressionPercent: Math.round(emaCompressionPercent),
    emaCompressionATR: Math.round(emaCompressionATR),
    compressionPersistence: Math.round(compressionPersistence),
    compressionDirection: Math.round(compressionDirection),
    fourEMABonus: Math.round(fourEMABonus),
    priceToCluster: Math.round(priceToClusterScore),
    multiTimeframe: Math.round(multiTimeframeScore),
    total,
  };
}

/**
 * Determine setup status based on which phases are detected.
 *
 * STRONG: All 4 phases detected (expansion + correction + consolidation + EMA compression)
 * VALID: EMA compression detected with at least some supporting phases
 * DEVELOPING: EMA compression detected but other phases weak
 * INVALID: No EMA compression
 */
export function determineSetupStatus(
  score: number,
  emaCompressionStatus: string,
  expansionStatus: string,
  correctionStatus: string,
  timeCorrectionStatus: string,
  clusterType: string
): 'STRONG' | 'VALID' | 'DEVELOPING' | 'INVALID' {
  if (emaCompressionStatus === 'INVALID') {
    return 'INVALID';
  }

  if (emaCompressionStatus === 'DEVELOPING') {
    return 'DEVELOPING';
  }

  // EMA compression is VALID — check supporting phases
  const phasesDetected = [expansionStatus, correctionStatus, timeCorrectionStatus]
    .filter(s => s === 'VALID').length;

  // STRONG: All 4 phases detected (compression + 3 supporting)
  if (phasesDetected === 3 && clusterType === '4EMA' && score >= 60) {
    return 'STRONG';
  }

  // VALID: EMA compression + at least 1 supporting phase, or high score
  if (phasesDetected >= 1 || score >= 40) {
    return 'VALID';
  }

  return 'DEVELOPING';
}

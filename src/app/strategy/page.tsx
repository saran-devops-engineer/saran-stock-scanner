'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface StrategySetup {
  symbol: string;
  overallScore: number;
  entry: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskReward: number;
  positionSize: number;
  status: 'BUY' | 'WATCH' | 'AVOID';
  minervini: {
    passed: boolean;
    score: number;
    criteria: Record<string, boolean>;
  };
  momentum: {
    detected: boolean;
    score: number;
    criteria: Record<string, boolean>;
    metrics: {
      rsi14: number;
      volumeRatio: number;
      consolidationDays: number;
    };
  };
  quality: {
    score: number;
    metrics: {
      roe: number;
      salesGrowth: number;
    };
  };
  marketRegime: {
    regime: string;
    score: number;
  };
  confluence: string[];
  warnings: string[];
}

interface ScanResponse {
  index: string;
  totalRequested: number;
  analyzed: number;
  failed: number;
  failedSymbols: string[];
  buySetups: StrategySetup[];
  watchSetups: StrategySetup[];
  allSetups: StrategySetup[];
  summary: {
    buyCount: number;
    watchCount: number;
    avoidCount: number;
  };
}

const INDEXES = [
  { value: 'nifty50', label: 'NIFTY 50' },
  { value: 'nifty100', label: 'NIFTY 100' },
  { value: 'nifty200', label: 'NIFTY 200' },
  { value: 'nifty500', label: 'NIFTY 500' },
];

const INITIAL_DISPLAY = 15;

export default function StrategyPage() {
  const [selectedIndex, setSelectedIndex] = useState('nifty200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'WATCH' | 'AVOID'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleScan = async () => {
    setLoading(true);
    setError('');
    setScanData(null);
    setDisplayCount(INITIAL_DISPLAY);

    try {
      const response = await fetch(
        `/api/strategy-batch?index=${selectedIndex}&limit=500`,
        { signal: AbortSignal.timeout(300000) }
      );
      const data: ScanResponse = await response.json();
      setScanData(data);
    } catch {
      setError('Failed to scan index. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const allResults = scanData
    ? filter === 'all'
      ? scanData.allSetups
      : scanData.allSetups.filter(s => s.status === filter)
    : [];

  const visibleResults = allResults.slice(0, displayCount);
  const hasMore = displayCount < allResults.length;

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setDisplayCount((prev) => Math.min(prev + 15, allResults.length));
    loadingRef.current = false;
  }, [hasMore, allResults.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        loadMore();
      }
    };

    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-300';
      case 'WATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 55) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">Swing Strategy Scanner</h1>
              <a href="/" className="text-xs text-blue-600 hover:underline">EMA Scanner →</a>
              <a href="/fundamental" className="text-xs text-blue-600 hover:underline">Fundamentals →</a>
              <a href="/chartbank" className="text-xs text-blue-600 hover:underline">Chart Bank →</a>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Minervini Template + Momentum Burst + Quality Filter
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {INDEXES.map((idx) => (
                <option key={idx.value} value={idx.value}>
                  {idx.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleScan}
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </div>
      </header>

      {/* Summary bar */}
      {scanData && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 shrink-0">
          <div className="max-w-7xl mx-auto flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-700">
              {scanData.index} — {scanData.analyzed} analyzed
            </span>
            {scanData.failed > 0 && (
              <span className="text-orange-500 text-xs">
                {scanData.failed} failed
              </span>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-1 ml-4">
              {([
                { key: 'all', label: 'All', count: scanData.allSetups.length },
                { key: 'BUY', label: 'BUY', count: scanData.summary.buyCount, color: 'text-green-600' },
                { key: 'WATCH', label: 'WATCH', count: scanData.summary.watchCount, color: 'text-yellow-600' },
                { key: 'AVOID', label: 'AVOID', count: scanData.summary.avoidCount, color: 'text-red-500' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setFilter(tab.key); setDisplayCount(INITIAL_DISPLAY); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <span className={'color' in tab ? tab.color : ''}>{tab.count}</span> {tab.label}
                </button>
              ))}
            </div>

            <span className="text-gray-400 ml-auto">
              Showing {visibleResults.length} of {allResults.length}
            </span>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Scanning {selectedIndex.toUpperCase()} stocks...</p>
            <p className="text-gray-400 text-xs mt-1">This may take a minute</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && scanData && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          <div className="max-w-7xl mx-auto space-y-2">
            {visibleResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No BUY or WATCH setups found in {scanData.index}
              </div>
            )}

            {visibleResults.map((setup) => (
              <div
                key={setup.symbol}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Compact row */}
                <div
                  className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedSymbol(
                    expandedSymbol === setup.symbol ? null : setup.symbol
                  )}
                >
                  {/* Score circle */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getScoreBg(setup.overallScore)}`}>
                    {setup.overallScore}
                  </div>

                  {/* Symbol + status */}
                  <div className="w-32">
                    <p className="font-bold text-gray-900 text-sm">{setup.symbol}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(setup.status)}`}>
                      {setup.status}
                    </span>
                  </div>

                  {/* Minervini % */}
                  <div className="w-20 text-center">
                    <p className={`text-sm font-semibold ${setup.minervini.passed ? 'text-green-600' : 'text-red-500'}`}>
                      {setup.minervini.score.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-gray-400">MINERVINI</p>
                  </div>

                  {/* Momentum % */}
                  <div className="w-20 text-center">
                    <p className={`text-sm font-semibold ${setup.momentum.detected ? 'text-green-600' : 'text-yellow-500'}`}>
                      {setup.momentum.score.toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-gray-400">MOMENTUM</p>
                  </div>

                  {/* Entry / Stop / Target */}
                  <div className="flex-1 grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-gray-400">Entry</p>
                      <p className="font-medium text-gray-900">₹{setup.entry.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Stop</p>
                      <p className="font-medium text-red-600">₹{setup.stopLoss.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Target</p>
                      <p className="font-medium text-green-600">₹{setup.target1.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">R:R</p>
                      <p className="font-medium text-blue-600">{setup.riskReward.toFixed(1)}x</p>
                    </div>
                  </div>

                  {/* Confluence badges */}
                  <div className="w-48 flex flex-wrap gap-1">
                    {setup.confluence.slice(0, 3).map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                        {c}
                      </span>
                    ))}
                    {setup.confluence.length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">
                        +{setup.confluence.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Expand arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedSymbol === setup.symbol ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded details */}
                {expandedSymbol === setup.symbol && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 grid grid-cols-4 gap-6 text-xs">
                    {/* Minervini criteria */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Minervini ({setup.minervini.score.toFixed(0)}%)</h4>
                      <div className="space-y-0.5">
                        {Object.entries(setup.minervini.criteria).map(([key, passed]) => (
                          <p key={key} className={passed ? 'text-green-600' : 'text-red-500'}>
                            {passed ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Momentum criteria */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Momentum ({setup.momentum.score.toFixed(0)}%)</h4>
                      <div className="space-y-0.5">
                        {Object.entries(setup.momentum.criteria).map(([key, passed]) => (
                          <p key={key} className={passed ? 'text-green-600' : 'text-red-500'}>
                            {passed ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                        ))}
                      </div>
                      <div className="mt-2 space-y-0.5 text-gray-600">
                        <p>RSI: {setup.momentum.metrics.rsi14.toFixed(1)}</p>
                        <p>Volume: {setup.momentum.metrics.volumeRatio.toFixed(1)}x avg</p>
                        <p>Consolidation: {setup.momentum.metrics.consolidationDays} days</p>
                      </div>
                    </div>

                    {/* Trade plan */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Trade Plan</h4>
                      <div className="space-y-1">
                        <p><span className="text-gray-400">Entry:</span> ₹{setup.entry.toFixed(2)}</p>
                        <p><span className="text-gray-400">Stop:</span> ₹{setup.stopLoss.toFixed(2)}</p>
                        <p><span className="text-gray-400">Target 1:</span> ₹{setup.target1.toFixed(2)}</p>
                        <p><span className="text-gray-400">Target 2:</span> ₹{setup.target2.toFixed(2)}</p>
                        <p><span className="text-gray-400">R:R:</span> {setup.riskReward.toFixed(2)}x</p>
                        <p><span className="text-gray-400">Position:</span> {setup.positionSize} shares</p>
                        <p><span className="text-gray-400">Market:</span> {setup.marketRegime.regime}</p>
                      </div>
                    </div>

                    {/* Confluence + warnings */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">Confluence</h4>
                      <div className="space-y-0.5">
                        {setup.confluence.map((c, i) => (
                          <p key={i} className="text-blue-600">+ {c}</p>
                        ))}
                      </div>
                      {setup.warnings.length > 0 && (
                        <>
                          <h4 className="font-semibold text-red-500 mt-2 mb-1">Warnings</h4>
                          <div className="space-y-0.5">
                            {setup.warnings.map((w, i) => (
                              <p key={i} className="text-red-500">⚠ {w}</p>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Load more indicator */}
            {hasMore && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Scroll down for more ({allResults.length - displayCount} remaining)
              </div>
            )}

            {!hasMore && allResults.length > 0 && (
              <div className="text-center py-4 text-gray-400 text-xs">
                End of results
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !scanData && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400 text-lg mb-2">Select an index and click Scan</p>
            <p className="text-gray-300 text-sm">Results will show BUY and WATCH setups</p>
          </div>
        </div>
      )}
    </div>
  );
}

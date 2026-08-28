'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import AddToWatchlistButton from '@/ui/components/Watchlist/AddToWatchlistButton';

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
  minervini: { passed: boolean; score: number; criteria: Record<string, boolean> };
  momentum: { detected: boolean; score: number; criteria: Record<string, boolean>; metrics: { rsi14: number; volumeRatio: number; consolidationDays: number } };
  quality: { score: number; metrics: { roe: number; salesGrowth: number } };
  marketRegime: { regime: string; score: number };
  confluence: string[];
  warnings: string[];
}

const INDEXES = [
  { value: 'nifty50', label: 'NIFTY 50' },
  { value: 'nifty100', label: 'NIFTY 100' },
  { value: 'nifty200', label: 'NIFTY 200' },
  { value: 'nifty500', label: 'NIFTY 500' },
];

export default function SwingStrategyTab() {
  const [selectedIndex, setSelectedIndex] = useState('nifty200');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<StrategySetup[]>([]);
  const [displayCount, setDisplayCount] = useState(15);
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'BUY' | 'WATCH' | 'AVOID'>('all');
  const [progress, setProgress] = useState({ current: 0, total: 0, analyzed: 0, failed: 0 });
  const [scanComplete, setScanComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleScan = async () => {
    abortRef.current?.abort();
    setLoading(true);
    setError('');
    setResults([]);
    setDisplayCount(15);
    setScanComplete(false);
    setProgress({ current: 0, total: 0, analyzed: 0, failed: 0 });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/strategy-stream?index=${selectedIndex}&limit=500`, {
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr.trim()) continue;

          try {
            const msg = JSON.parse(jsonStr);

            if (msg.type === 'start') {
              setProgress({ current: 0, total: msg.total, analyzed: 0, failed: 0 });
            } else if (msg.type === 'result') {
              setResults(prev => {
                const next = [...prev, msg.setup];
                next.sort((a, b) => b.overallScore - a.overallScore);
                return next;
              });
              setProgress({ current: msg.progress, total: msg.total, analyzed: msg.analyzed, failed: msg.failed });
            } else if (msg.type === 'failed') {
              setProgress(prev => ({ ...prev, current: msg.progress, failed: msg.failed || prev.failed + 1 }));
            } else if (msg.type === 'complete') {
              setProgress({ current: msg.total, total: msg.total, analyzed: msg.analyzed, failed: msg.failed });
              setScanComplete(true);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Scan failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const allResults = filter === 'all' ? results : results.filter(s => s.status === filter);
  const visibleResults = allResults.slice(0, displayCount);
  const hasMore = displayCount < allResults.length;

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setDisplayCount(prev => Math.min(prev + 15, allResults.length));
    loadingRef.current = false;
  }, [hasMore, allResults.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => { if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) loadMore(); };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  // Auto-scroll to bottom as new results arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el && loading) {
      el.scrollTop = el.scrollHeight;
    }
  }, [results.length, loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BUY': return 'bg-green-100 text-green-800 border-green-300';
      case 'WATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 55) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const buyCount = results.filter(s => s.status === 'BUY').length;
  const watchCount = results.filter(s => s.status === 'WATCH').length;
  const avoidCount = results.filter(s => s.status === 'AVOID').length;

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <select value={selectedIndex} onChange={e => setSelectedIndex(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
          {INDEXES.map(idx => <option key={idx.value} value={idx.value}>{idx.label}</option>)}
        </select>
        <button onClick={handleScan} disabled={loading} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
          {loading ? 'Scanning...' : 'Scan'}
        </button>
        {loading && (
          <div className="flex items-center gap-3 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-blue-600 font-semibold">{progress.current}/{progress.total}</span>
            <span className="text-green-600">{progress.analyzed} ok</span>
            {progress.failed > 0 && <span className="text-red-500">{progress.failed} failed</span>}
          </div>
        )}
        {scanComplete && !loading && (
          <span className="text-sm text-gray-500">Done — {results.length} stocks analyzed</span>
        )}
      </div>

      {/* Filter tabs */}
      {results.length > 0 && (
        <div className="flex items-center gap-4 text-sm mb-3">
          {([
            { key: 'all' as const, label: 'All', count: results.length },
            { key: 'BUY' as const, label: 'BUY', count: buyCount, color: 'text-green-600' },
            { key: 'WATCH' as const, label: 'WATCH', count: watchCount, color: 'text-yellow-600' },
            { key: 'AVOID' as const, label: 'AVOID', count: avoidCount, color: 'text-red-500' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => { setFilter(tab.key); setDisplayCount(15); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === tab.key ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'}`}>
              <span className={('color' in tab && tab.color) ? tab.color : ''}>{tab.count}</span> {tab.label}
            </button>
          ))}
          <span className="text-gray-400 ml-auto">Showing {visibleResults.length} of {allResults.length}</span>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700 mb-3">{error}</div>}

      {/* Results */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {visibleResults.length === 0 && loading && (
            <div className="text-center py-8 text-gray-400 text-sm">Scanning stocks, results appearing live...</div>
          )}

          {visibleResults.length === 0 && !loading && results.length === 0 && !error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select an index and click Scan</p>
            </div>
          )}

          {visibleResults.map(setup => (
            <div key={setup.symbol} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="px-4 py-3 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedSymbol(expandedSymbol === setup.symbol ? null : setup.symbol)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getScoreBg(setup.overallScore)}`}>{setup.overallScore}</div>
                <div className="w-32">
                  <p className="font-bold text-gray-900 text-sm">{setup.symbol}</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(setup.status)}`}>{setup.status}</span>
                </div>
                <div className="w-20 text-center">
                  <p className={`text-sm font-semibold ${setup.minervini.passed ? 'text-green-600' : 'text-red-500'}`}>{setup.minervini.score.toFixed(0)}%</p>
                  <p className="text-[10px] text-gray-400">MINERVINI</p>
                </div>
                <div className="w-20 text-center">
                  <p className={`text-sm font-semibold ${setup.momentum.detected ? 'text-green-600' : 'text-yellow-500'}`}>{setup.momentum.score.toFixed(0)}%</p>
                  <p className="text-[10px] text-gray-400">MOMENTUM</p>
                </div>
                <div className="flex-1 grid grid-cols-4 gap-3 text-xs">
                  <div><p className="text-gray-400">Entry</p><p className="font-medium text-gray-900">₹{setup.entry.toFixed(0)}</p></div>
                  <div><p className="text-gray-400">Stop</p><p className="font-medium text-red-600">₹{setup.stopLoss.toFixed(0)}</p></div>
                  <div><p className="text-gray-400">Target</p><p className="font-medium text-green-600">₹{setup.target1.toFixed(0)}</p></div>
                  <div><p className="text-gray-400">R:R</p><p className="font-medium text-blue-600">{setup.riskReward.toFixed(1)}x</p></div>
                </div>
                <div className="w-48 flex flex-wrap gap-1">
                  {setup.confluence.slice(0, 3).map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">{c}</span>)}
                  {setup.confluence.length > 3 && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px]">+{setup.confluence.length - 3}</span>}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSymbol === setup.symbol ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                <AddToWatchlistButton symbol={setup.symbol} />
              </div>

              {expandedSymbol === setup.symbol && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 grid grid-cols-4 gap-6 text-xs">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Minervini ({setup.minervini.score.toFixed(0)}%)</h4>
                    <div className="space-y-0.5">
                      {Object.entries(setup.minervini.criteria).map(([key, passed]) => (
                        <p key={key} className={passed ? 'text-green-600' : 'text-red-500'}>{passed ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Momentum ({setup.momentum.score.toFixed(0)}%)</h4>
                    <div className="space-y-0.5">
                      {Object.entries(setup.momentum.criteria).map(([key, passed]) => (
                        <p key={key} className={passed ? 'text-green-600' : 'text-red-500'}>{passed ? '✓' : '✗'} {key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      ))}
                    </div>
                    <div className="mt-2 space-y-0.5 text-gray-600">
                      <p>RSI: {setup.momentum.metrics.rsi14.toFixed(1)}</p>
                      <p>Volume: {setup.momentum.metrics.volumeRatio.toFixed(1)}x avg</p>
                    </div>
                  </div>
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
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1">Confluence</h4>
                    <div className="space-y-0.5">{setup.confluence.map((c, i) => <p key={i} className="text-blue-600">+ {c}</p>)}</div>
                    {setup.warnings.length > 0 && (
                      <><h4 className="font-semibold text-red-500 mt-2 mb-1">Warnings</h4><div className="space-y-0.5">{setup.warnings.map((w, i) => <p key={i} className="text-red-500">⚠ {w}</p>)}</div></>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {hasMore && <div className="text-center py-4 text-gray-400 text-sm">Scroll for more ({allResults.length - displayCount} remaining)</div>}
          {!hasMore && allResults.length > 0 && <div className="text-center py-4 text-gray-400 text-xs">End of results</div>}
        </div>
      </div>
    </div>
  );
}

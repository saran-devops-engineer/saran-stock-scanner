'use client';

import { useState, useEffect } from 'react';

interface StockResult {
  symbol: string;
  entryPrice: number;
  currentPrice: number | null;
  target: number | null;
  sl: number | null;
  date: string;
  returnPct: number | null;
  postText: string;
}

interface AnalysisData {
  summary: {
    totalPicks: number;
    withReturns: number;
    wins: number;
    losses: number;
    winRate: number;
    avgReturn: number;
    bestPick: { symbol: string; returnPct: number } | null;
    worstPick: { symbol: string; returnPct: number } | null;
  };
  results: StockResult[];
}

export default function ChartBankPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chartbank-analysis')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: '12px' }}>Loading Chart Bank Analysis...</div>
        <div style={{ color: '#94a3b8' }}>Scraping Telegram channel data</div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#ef4444' }}>Failed to load data</div>
    </div>
  );

  const { summary, results } = data;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <a href="/" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>← Scanner</a>
        <a href="/fundamental" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>← Fundamental</a>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Chart Bank Performance Analysis</h1>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Scorecard */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Picks', value: summary.totalPicks, color: '#3b82f6' },
            { label: 'Win Rate', value: `${summary.winRate}%`, color: summary.winRate >= 60 ? '#22c55e' : '#ef4444' },
            { label: 'Wins', value: summary.wins, color: '#22c55e' },
            { label: 'Losses', value: summary.losses, color: '#ef4444' },
            { label: 'Avg Return', value: `${summary.avgReturn}%`, color: summary.avgReturn >= 0 ? '#22c55e' : '#ef4444' },
            { label: 'Best Pick', value: summary.bestPick ? `${summary.bestPick.symbol} +${summary.bestPick.returnPct}%` : '-', color: '#22c55e' },
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Performance Table */}
        <div style={{ backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 16px' }}>
            All Recommendations ({results.length} stocks)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #334155' }}>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '10px 8px', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>Symbol</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Entry ₹</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Current ₹</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Target ₹</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right', color: '#94a3b8', fontWeight: 600 }}>Return</th>
                  <th style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((stock, i) => {
                  const isWin = stock.returnPct !== null && stock.returnPct > 0;
                  const isLoss = stock.returnPct !== null && stock.returnPct <= 0;
                  const noData = stock.currentPrice === null;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #0f172a' }}>
                      <td style={{ padding: '10px 8px', color: '#6b7280' }}>{i + 1}</td>
                      <td style={{ padding: '10px 8px', color: '#94a3b8' }}>
                        {stock.date ? new Date(stock.date).toISOString().split('T')[0] : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', fontWeight: 600, color: '#3b82f6' }}>{stock.symbol}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>₹{stock.entryPrice}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600 }}>
                        {stock.currentPrice ? `₹${stock.currentPrice}` : <span style={{ color: '#6b7280' }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                        {stock.target ? `₹${stock.target}` : <span style={{ color: '#6b7280' }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: noData ? '#6b7280' : isWin ? '#22c55e' : isLoss ? '#ef4444' : '#94a3b8' }}>
                        {noData ? 'N/A' : stock.returnPct !== null ? `${stock.returnPct >= 0 ? '+' : ''}${stock.returnPct.toFixed(1)}%` : '-'}
                      </td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        {noData ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#334155', color: '#94a3b8', fontSize: '11px' }}>No Data</span>
                        ) : isWin ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#16a34a22', color: '#22c55e', fontSize: '11px', fontWeight: 600 }}>WIN</span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ef444422', color: '#ef4444', fontSize: '11px', fontWeight: 600 }}>LOSS</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#1e293b', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
          <strong>Note:</strong> Data scraped from public Telegram channel @chartbank. Some stocks may not be found on Screener due to symbol mismatches. 
          {summary.worstPick && <span> Worst pick: <strong style={{ color: '#ef4444' }}>{summary.worstPick.symbol}</strong> ({summary.worstPick.returnPct}%)</span>}
        </div>
      </div>
    </div>
  );
}

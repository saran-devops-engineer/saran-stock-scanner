'use client';

import { useState } from 'react';
import { ScanResult, MultiTimeframeScanResult } from '@/core/types';
import { ScannerState } from '@/ui/hooks/useScanner';

type SortField = 'score' | 'emaSpreadPercent' | 'emaAtrRatio' | 'expansionPercent' | 'correctionPercent' | 'timeframe';
type SortDir = 'asc' | 'desc';

interface ScannerTableProps {
  results: MultiTimeframeScanResult[];
  onSelectStock: (symbol: string) => void;
}

export function ScannerTable({ results, onSelectStock }: ScannerTableProps) {
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedResults = [...results]
    .filter((r) => filterStatus === 'all' || r.mtfStatus === filterStatus)
    .sort((a, b) => {
      const aVal = a.mtfScore;
      const bVal = b.mtfScore;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'STRONG': return 'bg-green-100 text-green-800 border-green-200';
      case 'VALID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DEVELOPING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBestResult = (r: MultiTimeframeScanResult): ScanResult | null => {
    const valid = r.timeframes.filter((t) => t.status === 'STRONG' || t.status === 'VALID');
    if (valid.length === 0) return r.timeframes[0] || null;
    return valid.reduce((best, curr) => (curr.score > best.score ? curr : best), valid[0]);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Scan Results</h2>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All Status</option>
            <option value="STRONG">Strong</option>
            <option value="VALID">Valid</option>
            <option value="DEVELOPING">Developing</option>
            <option value="INVALID">Invalid</option>
          </select>
          <span className="text-sm text-gray-500">{sortedResults.length} results</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Stock</th>
              <th
                className="px-4 py-2 text-left font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort('score')}
              >
                Score {sortField === 'score' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">MTF</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Timeframes</th>
              <th
                className="px-4 py-2 text-right font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort('emaSpreadPercent')}
              >
                EMA Spread % {sortField === 'emaSpreadPercent' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th
                className="px-4 py-2 text-right font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                onClick={() => handleSort('emaAtrRatio')}
              >
                EMA/ATR {sortField === 'emaAtrRatio' && (sortDir === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">ATR Trend</th>
              <th className="px-4 py-2 text-left font-medium text-gray-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedResults.map((result) => {
              const best = getBestResult(result);
              return (
                <tr
                  key={result.symbol}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectStock(result.symbol)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{result.symbol}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      result.mtfScore >= 60 ? 'bg-green-100 text-green-800' :
                      result.mtfScore >= 35 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.mtfScore.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(result.mtfStatus)}`}>
                      {result.mtfStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {result.confirmationCount} / {result.timeframes.length}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {result.timeframes.map((tf) => (
                        <span
                          key={tf.timeframe}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${
                            tf.status === 'STRONG' ? 'bg-green-100 text-green-700' :
                            tf.status === 'VALID' ? 'bg-blue-100 text-blue-700' :
                            tf.status === 'DEVELOPING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {tf.timeframe}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {best ? `${best.emaSpreadPercent.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {best ? best.emaAtrRatio.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {best && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                        best.atrTrend === 'contracting' ? 'bg-green-100 text-green-700' :
                        best.atrTrend === 'expanding' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {best.atrTrend}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                    {best?.details.compression || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedResults.length === 0 && (
        <div className="px-4 py-12 text-center text-gray-500">
          No results found. Enter symbols and start scanning.
        </div>
      )}
    </div>
  );
}

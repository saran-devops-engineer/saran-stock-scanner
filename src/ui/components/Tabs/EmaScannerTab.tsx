'use client';

import { useState } from 'react';
import { useScanner } from '@/ui/hooks/useScanner';
import { useStockAnalysis } from '@/ui/hooks/useStockAnalysis';
import { ScannerTable } from '@/ui/components/Scanner/ScannerTable';
import { ScannerFilters } from '@/ui/components/Scanner/ScannerFilters';
import { ScoreBreakdown } from '@/ui/components/Analysis/ScoreBreakdown';
import { CandlestickChart } from '@/ui/components/Chart/CandlestickChart';
import { Timeframe } from '@/core/types';

export default function EmaScannerTab() {
  const scanner = useScanner();
  const analysis = useStockAnalysis();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('daily');

  const handleSelectStock = async (symbol: string) => {
    setSelectedSymbol(symbol);
    await analysis.analyze(symbol, selectedTimeframe);
  };

  const handleTimeframeChange = async (tf: Timeframe) => {
    setSelectedTimeframe(tf);
    if (selectedSymbol) await analysis.analyze(selectedSymbol, tf);
  };

  return (
    <div className="flex flex-col h-full">
      {scanner.isScanning && (
        <div className="flex items-center gap-3 text-sm mb-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
          <span className="font-semibold text-blue-600">{scanner.scannedCount}/{scanner.totalStocks}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">{scanner.progress}</span>
        </div>
      )}

      {scanner.error && <div className="mb-3 bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{scanner.error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-1">
          <ScannerFilters config={scanner.config} onConfigChange={scanner.setConfig} onScan={scanner.scanStocks} isScanning={scanner.isScanning} onStop={scanner.stopScan} />
        </div>

        <div className="lg:col-span-3 space-y-4 overflow-y-auto">
          <ScannerTable results={scanner.results} onSelectStock={handleSelectStock} />

          {selectedSymbol && analysis.data && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">Analyzing: {selectedSymbol}</h3>
                  <div className="flex gap-1">
                    {(['daily', 'weekly', '15m', '1h'] as Timeframe[]).map(tf => (
                      <button key={tf} onClick={() => handleTimeframeChange(tf)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${selectedTimeframe === tf ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <CandlestickChart data={analysis.data} />
              <ScoreBreakdown data={analysis.data} />
            </div>
          )}

          {selectedSymbol && analysis.loading && (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-gray-500">Loading analysis for {selectedSymbol}...</p>
            </div>
          )}

          {selectedSymbol && analysis.error && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{analysis.error}</div>}
        </div>
      </div>
    </div>
  );
}

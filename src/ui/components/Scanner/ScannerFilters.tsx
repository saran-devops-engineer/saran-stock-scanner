'use client';

import { useState, useMemo } from 'react';
import { ScannerConfig, Timeframe } from '@/core/types';
import { AVAILABLE_INDEXES, getSymbolStrings } from '@/data/lists';

interface ScannerFiltersProps {
  config: ScannerConfig;
  onConfigChange: (config: ScannerConfig) => void;
  onScan: (symbols: string[]) => void;
  isScanning: boolean;
  onStop: () => void;
}

export function ScannerFilters({ config, onConfigChange, onScan, isScanning, onStop }: ScannerFiltersProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<string[]>(['NIFTY50']);
  const [customSymbols, setCustomSymbols] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const totalStocks = useMemo(() => {
    if (useCustom) {
      return customSymbols.split('\n').map(s => s.trim()).filter(s => s.length > 0).length;
    }
    return getSymbolStrings(selectedIndexes).length;
  }, [selectedIndexes, customSymbols, useCustom]);

  const toggleIndex = (key: string) => {
    setSelectedIndexes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleScan = () => {
    let symbolList: string[];
    if (useCustom) {
      symbolList = customSymbols
        .split('\n')
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s.length > 0);
    } else {
      symbolList = getSymbolStrings(selectedIndexes);
    }
    if (symbolList.length > 0) {
      onScan(symbolList);
    }
  };

  const toggleTimeframe = (tf: Timeframe) => {
    const updated = {
      ...config,
      timeframes: config.timeframes.map((t) =>
        t.timeframe === tf ? { ...t, enabled: !t.enabled } : t
      ),
    };
    onConfigChange(updated);
  };

  const updateThreshold = (path: string, value: number) => {
    const keys = path.split('.');
    const updated = JSON.parse(JSON.stringify(config));
    let obj = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    onConfigChange(updated);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Scanner Controls</h3>

      {/* Index Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Index</label>
        <div className="space-y-1">
          {AVAILABLE_INDEXES.map((idx) => (
            <label
              key={idx.key}
              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                selectedIndexes.includes(idx.key)
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 hover:bg-gray-50'
              } ${useCustom ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedIndexes.includes(idx.key)}
                onChange={() => toggleIndex(idx.key)}
                disabled={isScanning || useCustom}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium">{idx.label}</span>
              <span className="text-xs text-gray-500 ml-auto">{idx.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Symbols Toggle */}
      <div className="border-t border-gray-200 pt-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
            disabled={isScanning}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Custom Symbols</span>
        </label>
        {useCustom && (
          <textarea
            value={customSymbols}
            onChange={(e) => setCustomSymbols(e.target.value)}
            rows={4}
            className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="RELIANCE&#10;TCS&#10;INFY"
            disabled={isScanning}
          />
        )}
      </div>

      {/* Stock Count */}
      <div className="bg-gray-50 rounded-md p-2 text-center">
        <span className="text-sm text-gray-600">
          Will scan <span className="font-bold text-gray-900">{totalStocks}</span> stocks
        </span>
      </div>

      {/* Timeframe Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Timeframes</label>
        <div className="flex flex-wrap gap-2">
          {config.timeframes.map((tf) => (
            <button
              key={tf.timeframe}
              onClick={() => toggleTimeframe(tf.timeframe)}
              className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
                tf.enabled
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tf.timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* MTF Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">MTF Mode</label>
        <select
          value={config.mtfMode}
          onChange={(e) => onConfigChange({ ...config, mtfMode: e.target.value as 'ANY' | 'ALL' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="ANY">ANY - Show if setup exists on any timeframe</option>
          <option value="ALL">ALL - Show only if setup exists on all timeframes</option>
        </select>
      </div>

      {/* Compression Thresholds */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">3-EMA Max Spread %</label>
          <input
            type="number"
            step="0.1"
            value={config.compression.threeEMA.maxSpreadPercent}
            onChange={(e) => updateThreshold('compression.threeEMA.maxSpreadPercent', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">3-EMA Max ATR Ratio</label>
          <input
            type="number"
            step="0.05"
            value={config.compression.threeEMA.maxSpreadATR}
            onChange={(e) => updateThreshold('compression.threeEMA.maxSpreadATR', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">4-EMA Max Spread %</label>
          <input
            type="number"
            step="0.1"
            value={config.compression.fourEMA.maxSpreadPercent}
            onChange={(e) => updateThreshold('compression.fourEMA.maxSpreadPercent', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">4-EMA Max ATR Ratio</label>
          <input
            type="number"
            step="0.05"
            value={config.compression.fourEMA.maxSpreadATR}
            onChange={(e) => updateThreshold('compression.fourEMA.maxSpreadATR', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Expansion & Correction */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expansion Lookback</label>
          <input
            type="number"
            value={config.expansion.lookback}
            onChange={(e) => updateThreshold('expansion.lookback', parseInt(e.target.value) || 50)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Expansion %</label>
          <input
            type="number"
            value={config.expansion.minPercent}
            onChange={(e) => updateThreshold('expansion.minPercent', parseFloat(e.target.value) || 20)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Correction %</label>
          <input
            type="number"
            value={config.correction.minPercent}
            onChange={(e) => updateThreshold('correction.minPercent', parseFloat(e.target.value) || 10)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Correction %</label>
          <input
            type="number"
            value={config.correction.maxPercent}
            onChange={(e) => updateThreshold('correction.maxPercent', parseFloat(e.target.value) || 50)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Scan Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isScanning ? 'Scanning...' : 'Start Scan'}
        </button>
        {isScanning && (
          <button
            onClick={onStop}
            className="px-4 py-2 rounded-md font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}

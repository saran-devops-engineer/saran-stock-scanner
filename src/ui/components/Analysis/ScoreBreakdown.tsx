'use client';

import { StockAnalysisData } from '@/ui/hooks/useStockAnalysis';

interface ScoreBreakdownProps {
  data: StockAnalysisData;
}

export function ScoreBreakdown({ data }: ScoreBreakdownProps) {
  const { expansion, correction, timeCorrection, compression, atrContraction, priceToCluster } = data;

  const sections = [
    {
      title: 'Price Expansion',
      status: expansion.status,
      details: expansion.reason,
      metrics: [
        { label: 'Expansion %', value: `${expansion.metrics.expansionPercent.toFixed(1)}%` },
        { label: 'Low', value: expansion.metrics.expansionLow.toFixed(2) },
        { label: 'High', value: expansion.metrics.expansionHigh.toFixed(2) },
      ],
    },
    {
      title: 'Price Correction',
      status: correction.status,
      details: correction.reason,
      metrics: [
        { label: 'Correction %', value: `${correction.metrics.correctionPercent.toFixed(1)}%` },
        { label: 'Quality', value: correction.metrics.quality },
      ],
    },
    {
      title: 'Time Correction',
      status: timeCorrection.status,
      details: timeCorrection.reason,
      metrics: [
        { label: 'Consolidation Candles', value: String(timeCorrection.metrics.consolidationCandles) },
        { label: 'Range %', value: `${timeCorrection.metrics.consolidationRangePercent.toFixed(1)}%` },
        { label: 'ATR Contracting', value: timeCorrection.metrics.atrContracting ? 'Yes' : 'No' },
      ],
    },
    {
      title: 'EMA Compression',
      status: compression.status,
      details: compression.reason,
      metrics: [
        { label: 'Cluster Type', value: compression.metrics.clusterType },
        { label: 'Spread %', value: `${compression.metrics.spreadPercent.toFixed(2)}%` },
        { label: 'Spread/ATR', value: compression.metrics.spreadATR.toFixed(2) },
        { label: 'Compression Candles', value: String(compression.metrics.compressionCandles) },
        { label: 'Trend', value: compression.metrics.trend },
      ],
    },
    {
      title: 'ATR Contraction',
      status: atrContraction.status,
      details: atrContraction.reason,
      metrics: [
        { label: 'Current ATR', value: atrContraction.metrics.currentATR.toFixed(2) },
        { label: 'Previous ATR', value: atrContraction.metrics.previousATR.toFixed(2) },
        { label: 'Change %', value: `${atrContraction.metrics.atrChangePercent.toFixed(1)}%` },
        { label: 'Trend', value: atrContraction.metrics.trend },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {/* EMA Values */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">EMA Values</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">EMA 20</div>
            <div className="text-lg font-medium text-blue-600">{data.ema20.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">EMA 50</div>
            <div className="text-lg font-medium text-orange-500">{data.ema50.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">EMA 100</div>
            <div className="text-lg font-medium text-red-500">{data.ema100.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">EMA 200</div>
            <div className="text-lg font-medium text-gray-700">{data.ema200.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Price to Cluster */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Price / EMA Relationship</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Current Price</div>
            <div className="text-lg font-medium text-gray-900">{data.currentPrice.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">ATR(14)</div>
            <div className="text-lg font-medium text-gray-900">{data.atr.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Price-to-Cluster %</div>
            <div className="text-lg font-medium">{priceToCluster.percent.toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Price-to-Cluster ATR</div>
            <div className="text-lg font-medium">{priceToCluster.atrRatio.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Detection Results */}
      {sections.map((section) => (
        <div key={section.title} className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              section.status === 'VALID' ? 'bg-green-100 text-green-800 border-green-200' :
              section.status === 'DEVELOPING' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
              {section.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-3">{section.details}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {section.metrics.map((m) => (
              <div key={m.label}>
                <div className="text-xs text-gray-500">{m.label}</div>
                <div className="text-sm font-medium text-gray-900">{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useRef, useEffect, useState } from 'react';
import { StockAnalysisData } from '@/ui/hooks/useStockAnalysis';

interface CandlestickChartProps {
  data: StockAnalysisData;
}

export function CandlestickChart({ data }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current || !data.candles.length) return;

    let chart: any = null;

    const initChart = async () => {
      const LWC = await import('lightweight-charts');

      // Clean up previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }

      chart = LWC.createChart(containerRef.current!, {
        width: containerRef.current!.clientWidth,
        height: 500,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: {
          mode: LWC.CrosshairMode.Normal,
        },
        timeScale: {
          borderColor: '#e0e0e0',
          timeVisible: true,
        },
      });

      chartRef.current = chart;

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      const candleData = data.candles.map((c) => ({
        time: (c.timestamp / 1000) as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      candlestickSeries.setData(candleData);

      const ema20Series = chart.addLineSeries({ color: '#2196F3', lineWidth: 1, title: 'EMA 20' });
      const ema50Series = chart.addLineSeries({ color: '#FF9800', lineWidth: 1, title: 'EMA 50' });
      const ema100Series = chart.addLineSeries({ color: '#F44336', lineWidth: 1, title: 'EMA 100' });
      const ema200Series = chart.addLineSeries({ color: '#333333', lineWidth: 2, title: 'EMA 200' });

      const toLineData = (values: number[]) =>
        values
          .map((v, i) => ({
            time: (data.candles[i].timestamp / 1000) as any,
            value: v,
          }))
          .filter((d) => !isNaN(d.value));

      ema20Series.setData(toLineData(data.ema20Values));
      ema50Series.setData(toLineData(data.ema50Values));
      ema100Series.setData(toLineData(data.ema100Values));
      ema200Series.setData(toLineData(data.ema200Values));

      chart.timeScale().fitContent();
    };

    initChart();

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [mounted, data]);

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="h-[500px] flex items-center justify-center text-gray-400">
          Loading chart...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          {data.symbol} - {data.timeframe.toUpperCase()} Chart
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#2196F3]"></span> EMA 20
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#FF9800]"></span> EMA 50
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#F44336]"></span> EMA 100
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-[#333]"></span> EMA 200
          </span>
        </div>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

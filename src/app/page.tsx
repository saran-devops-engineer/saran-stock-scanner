'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { WatchlistProvider, useWatchlist } from '@/ui/context/WatchlistContext';

const SwingStrategyTab = dynamic(() => import('@/ui/components/Tabs/SwingStrategyTab'), { ssr: false });
const EmaScannerTab = dynamic(() => import('@/ui/components/Tabs/EmaScannerTab'), { ssr: false });
const FundamentalsTab = dynamic(() => import('@/ui/components/Tabs/FundamentalsTab'), { ssr: false });
const WatchlistPanel = dynamic(() => import('@/ui/components/Watchlist/WatchlistPanel'), { ssr: false });

type Tab = 'strategy' | 'scanner' | 'fundamentals';

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: 'strategy', label: 'Swing Strategy', color: 'text-green-600' },
  { key: 'scanner', label: 'EMA Scanner', color: 'text-blue-600' },
  { key: 'fundamentals', label: 'Fundamentals', color: 'text-purple-600' },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('strategy');
  const { isPanelOpen, togglePanel } = useWatchlist();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 shrink-0">
        <div className="px-4 py-2.5 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Stock Analysis Platform</h1>

          <nav className="flex items-center gap-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className={activeTab === tab.key ? '' : tab.color}>{tab.label}</span>
              </button>
            ))}
          </nav>

          <button
            onClick={togglePanel}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              isPanelOpen
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Watchlist
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Tab content */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="h-full max-w-7xl mx-auto px-4 py-4">
            {activeTab === 'strategy' && <SwingStrategyTab />}
            {activeTab === 'scanner' && <EmaScannerTab />}
            {activeTab === 'fundamentals' && <FundamentalsTab />}
          </div>
        </div>

        {/* Watchlist sidebar */}
        <WatchlistPanel />
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <WatchlistProvider>
      <AppContent />
    </WatchlistProvider>
  );
}

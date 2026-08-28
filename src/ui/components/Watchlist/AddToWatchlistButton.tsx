'use client';

import { useState } from 'react';
import { useWatchlist } from '@/ui/context/WatchlistContext';

export default function AddToWatchlistButton({ symbol }: { symbol: string }) {
  const { watchlists, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const [showDropdown, setShowDropdown] = useState(false);

  if (watchlists.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 transition-colors"
        title="Add to Watchlist"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[160px]">
            <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-100">
              Add to watchlist
            </div>
            {watchlists.map(wl => {
              const inList = isInWatchlist(wl.id, symbol);
              return (
                <button
                  key={wl.id}
                  onClick={() => {
                    if (inList) removeFromWatchlist(wl.id, symbol);
                    else addToWatchlist(wl.id, symbol);
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className={inList ? 'text-blue-600 font-medium' : 'text-gray-700'}>{wl.name}</span>
                  {inList && <span className="text-green-500 text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

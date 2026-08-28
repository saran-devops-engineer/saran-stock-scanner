'use client';

import { useState, useRef, useEffect } from 'react';
import { useWatchlist } from '@/ui/context/WatchlistContext';

export default function WatchlistPanel() {
  const {
    watchlists, activeWatchlistId, isPanelOpen,
    setActiveWatchlist, togglePanel,
    createWatchlist, deleteWatchlist, renameWatchlist,
    addToWatchlist, removeFromWatchlist,
    addDefaultWatchlists,
  } = useWatchlist();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [addSymbol, setAddSymbol] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { addDefaultWatchlists(); }, [addDefaultWatchlists]);

  const activeWl = watchlists.find(w => w.id === activeWatchlistId);

  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  useEffect(() => {
    if (showAddInput && addInputRef.current) addInputRef.current.focus();
  }, [showAddInput]);

  const handleCreate = () => {
    if (newName.trim()) {
      createWatchlist(newName.trim());
      setNewName('');
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameWatchlist(id, editName.trim());
    }
    setEditingId(null);
  };

  const handleAddSymbol = () => {
    if (addSymbol.trim() && activeWatchlistId) {
      addToWatchlist(activeWatchlistId, addSymbol.trim().toUpperCase());
      setAddSymbol('');
      setShowAddInput(false);
    }
  };

  if (!isPanelOpen) {
    return (
      <button
        onClick={togglePanel}
        className="fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 border-r-0 rounded-l-lg px-1.5 py-3 shadow-md hover:bg-gray-50 z-50"
        title="Open Watchlist"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col shrink-0 h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Watchlist</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowAddInput(!showAddInput)} className="p-1 hover:bg-gray-100 rounded" title="Add symbol">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button onClick={togglePanel} className="p-1 hover:bg-gray-100 rounded" title="Close">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Watchlist tabs */}
      <div className="px-2 py-1.5 border-b border-gray-100 flex gap-1 overflow-x-auto">
        {watchlists.map(wl => (
          <div
            key={wl.id}
            className={`group flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer shrink-0 ${
              activeWatchlistId === wl.id
                ? 'bg-blue-100 text-blue-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            onClick={() => setActiveWatchlist(wl.id)}
          >
            {editingId === wl.id ? (
              <input
                ref={editInputRef}
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleRename(wl.id)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(wl.id); if (e.key === 'Escape') setEditingId(null); }}
                className="w-16 px-1 py-0 border border-blue-300 rounded text-xs outline-none"
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={e => { e.stopPropagation(); setEditingId(wl.id); setEditName(wl.name); }}
                className="truncate max-w-[80px]"
              >
                {wl.name}
              </span>
            )}
            {editingId !== wl.id && (
              <button
                onClick={e => { e.stopPropagation(); deleteWatchlist(wl.id); }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-0.5"
                title="Delete"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button onClick={handleCreate} className="px-2 py-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-xs shrink-0" title="New watchlist">
          +
        </button>
      </div>

      {/* New watchlist input */}
      {watchlists.length === 0 && (
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex gap-1">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="New watchlist name..."
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-blue-400"
            />
            <button onClick={handleCreate} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">Add</button>
          </div>
        </div>
      )}

      {/* Add symbol input */}
      {showAddInput && (
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex gap-1">
            <input
              ref={addInputRef}
              value={addSymbol}
              onChange={e => setAddSymbol(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddSymbol(); if (e.key === 'Escape') setShowAddInput(false); }}
              placeholder="Symbol (e.g. RELIANCE)"
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs outline-none focus:border-blue-400"
            />
            <button onClick={handleAddSymbol} className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">+</button>
          </div>
        </div>
      )}

      {/* Stock list */}
      <div className="flex-1 overflow-y-auto">
        {activeWl && activeWl.items.length > 0 ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100">
                <th className="px-3 py-1.5 text-left font-medium">Symbol</th>
                <th className="px-3 py-1.5 text-right font-medium w-8"></th>
              </tr>
            </thead>
            <tbody>
              {activeWl.items.map(item => (
                <tr key={item.symbol} className="hover:bg-gray-50 group border-b border-gray-50">
                  <td className="px-3 py-1.5 font-medium text-gray-800">{item.symbol}</td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => removeFromWatchlist(activeWl.id, item.symbol)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                      title="Remove"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs p-4 text-center">
            <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No symbols in this watchlist</p>
            <p className="mt-1 text-gray-300">Click + to add symbols</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-gray-200 text-[10px] text-gray-400">
        {activeWl ? `${activeWl.items.length} symbols` : 'No watchlist selected'}
      </div>
    </div>
  );
}

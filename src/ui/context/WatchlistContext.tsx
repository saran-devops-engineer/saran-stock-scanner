'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface WatchlistItem {
  symbol: string;
  addedAt: number;
  notes?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: number;
}

interface WatchlistContextType {
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  isPanelOpen: boolean;
  setActiveWatchlist: (id: string) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  createWatchlist: (name: string) => void;
  deleteWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  addToWatchlist: (watchlistId: string, symbol: string) => void;
  removeFromWatchlist: (watchlistId: string, symbol: string) => void;
  isInWatchlist: (watchlistId: string, symbol: string) => boolean;
  addDefaultWatchlists: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

const STORAGE_KEY = 'stockwatch_watchlists';
const ACTIVE_KEY = 'stockwatch_active_watchlist';
const PANEL_KEY = 'stockwatch_panel_open';

function loadWatchlists(): Watchlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWatchlists(watchlists: Watchlist[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlists));
}

function loadActiveId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

function loadPanelOpen(): boolean {
  if (typeof window === 'undefined') return false;
  const val = localStorage.getItem(PANEL_KEY);
  return val !== 'false';
}

function savePanelOpen(open: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PANEL_KEY, String(open));
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const wl = loadWatchlists();
    const activeId = loadActiveId();
    const panelOpen = loadPanelOpen();
    setWatchlists(wl);
    setActiveWatchlistId(activeId || (wl.length > 0 ? wl[0].id : null));
    setIsPanelOpen(panelOpen);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveWatchlists(watchlists);
  }, [watchlists, loaded]);

  useEffect(() => {
    if (loaded) saveActiveId(activeWatchlistId);
  }, [activeWatchlistId, loaded]);

  useEffect(() => {
    if (loaded) savePanelOpen(isPanelOpen);
  }, [isPanelOpen, loaded]);

  const togglePanel = useCallback(() => setIsPanelOpen(p => !p), []);
  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);

  const setActiveWatchlist = useCallback((id: string) => {
    setActiveWatchlistId(id);
  }, []);

  const createWatchlist = useCallback((name: string) => {
    const id = `wl_${Date.now()}`;
    const newWl: Watchlist = { id, name, items: [], createdAt: Date.now() };
    setWatchlists(prev => [...prev, newWl]);
    setActiveWatchlistId(id);
  }, []);

  const deleteWatchlist = useCallback((id: string) => {
    setWatchlists(prev => {
      const next = prev.filter(w => w.id !== id);
      if (activeWatchlistId === id) {
        setActiveWatchlistId(next.length > 0 ? next[0].id : null);
      }
      return next;
    });
  }, [activeWatchlistId]);

  const renameWatchlist = useCallback((id: string, name: string) => {
    setWatchlists(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  }, []);

  const addToWatchlist = useCallback((watchlistId: string, symbol: string) => {
    setWatchlists(prev => prev.map(w => {
      if (w.id !== watchlistId) return w;
      if (w.items.some(item => item.symbol === symbol)) return w;
      return { ...w, items: [...w.items, { symbol, addedAt: Date.now() }] };
    }));
  }, []);

  const removeFromWatchlist = useCallback((watchlistId: string, symbol: string) => {
    setWatchlists(prev => prev.map(w => {
      if (w.id !== watchlistId) return w;
      return { ...w, items: w.items.filter(item => item.symbol !== symbol) };
    }));
  }, []);

  const isInWatchlist = useCallback((watchlistId: string, symbol: string) => {
    const wl = watchlists.find(w => w.id === watchlistId);
    return wl ? wl.items.some(item => item.symbol === symbol) : false;
  }, [watchlists]);

  const addDefaultWatchlists = useCallback(() => {
    setWatchlists(prev => {
      if (prev.length > 0) return prev;
      const defaults: Watchlist[] = [
        { id: 'wl_ema', name: 'EMA Scanner', items: [], createdAt: Date.now() },
        { id: 'wl_swing', name: 'Swing Strategy', items: [], createdAt: Date.now() },
        { id: 'wl_favs', name: 'Favorites', items: [], createdAt: Date.now() },
      ];
      setActiveWatchlistId(defaults[0].id);
      return defaults;
    });
  }, []);

  return (
    <WatchlistContext.Provider value={{
      watchlists, activeWatchlistId, isPanelOpen,
      setActiveWatchlist, togglePanel, openPanel, closePanel,
      createWatchlist, deleteWatchlist, renameWatchlist,
      addToWatchlist, removeFromWatchlist, isInWatchlist,
      addDefaultWatchlists,
    }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}

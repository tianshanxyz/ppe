'use client';

import { useState, useEffect } from 'react';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  region?: string;
  type?: string;
}

interface SearchHistoryProps {
  onSelect?: (query: string) => void;
  onClear?: () => void;
}

const MAX_HISTORY = 10;
const STORAGE_KEY = 'mdlooker_search_history';

export function SearchHistory({ onSelect, onClear }: SearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  // Load search history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Add search record
  const addToHistory = (query: string, region?: string, type?: string) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      region,
      type,
    };

    const updated = [newItem, ...history.filter(h => h.query !== query)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Remove single record
  const removeHistory = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // Clear all history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    onClear?.();
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString('en-US');
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Search History
        </h3>
        <button
          onClick={clearHistory}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
            onClick={() => {
              onSelect?.(item.query);
            }}
          >
            <div className="flex-1">
              <p className="text-sm text-gray-800 dark:text-gray-200">{item.query}</p>
              <div className="flex items-center gap-2 mt-1">
                {item.region && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                    {item.region}
                  </span>
                )}
                {item.type && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded">
                    {item.type}
                  </span>
                )}
                <span className="text-xs text-gray-400">{formatTime(item.timestamp)}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeHistory(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
              title="Delete"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook: Use search history
export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  const addToHistory = (query: string, region?: string, type?: string) => {
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      timestamp: Date.now(),
      region,
      type,
    };

    const updated = [newItem, ...history.filter(h => h.query !== query)].slice(0, MAX_HISTORY);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { history, addToHistory, clearHistory };
}

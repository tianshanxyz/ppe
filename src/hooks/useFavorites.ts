'use client'

import { useState, useEffect, useCallback } from 'react'

export interface FavoriteItem {
  id: string
  type: 'product' | 'enterprise' | 'regulation' | 'news'
  title: string
  url: string
  savedAt: string
}

const STORAGE_KEY = 'ppe_saved_items_v2'

function readFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeFavorites(items: FavoriteItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // silently fail
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])

  useEffect(() => {
    setFavorites(readFavorites())
  }, [])

  const isFavorited = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  )

  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, 'savedAt'>) => {
      setFavorites((prev) => {
        const exists = prev.find((f) => f.id === item.id)
        let updated: FavoriteItem[]
        if (exists) {
          updated = prev.filter((f) => f.id !== item.id)
        } else {
          updated = [...prev, { ...item, savedAt: new Date().toISOString() }]
        }
        writeFavorites(updated)
        return updated
      })
    },
    []
  )

  return { favorites, isFavorited, toggleFavorite }
}

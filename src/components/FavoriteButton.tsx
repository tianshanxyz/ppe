'use client'

import { Heart } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'

interface FavoriteButtonProps {
  id: string
  type: 'product' | 'enterprise' | 'regulation' | 'news'
  title: string
  url: string
  locale?: string
}

export function FavoriteButton({ id, type, title, url, locale = 'en' }: FavoriteButtonProps) {
  const { isFavorited, toggleFavorite } = useFavorites()
  const favorited = isFavorited(id)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite({ id, type, title, url })
      }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
        favorited
          ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'
          : 'text-gray-400 border-gray-200 bg-white hover:border-red-200 hover:text-red-400'
      }`}
      title={favorited
        ? (locale === 'zh' ? '取消收藏' : 'Remove from favorites')
        : (locale === 'zh' ? '添加收藏' : 'Add to favorites')
      }
    >
      <Heart className={`w-4 h-4 ${favorited ? 'fill-red-500' : ''}`} />
      {favorited
        ? (locale === 'zh' ? '已收藏' : 'Saved')
        : (locale === 'zh' ? '收藏' : 'Save')
      }
    </button>
  )
}

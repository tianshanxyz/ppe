'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SearchHistory, useSearchHistory } from './SearchHistory'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
}

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search products, companies...',
  className = '',
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [showHistory, setShowHistory] = useState(false)
  const { addToHistory } = useSearchHistory()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      addToHistory(query.trim())
      setShowHistory(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleHistorySelect = (selectedQuery: string) => {
    setQuery(selectedQuery)
    setShowHistory(false)
    router.push(`/search?q=${encodeURIComponent(selectedQuery)}`)
  }

  return (
    <div ref={containerRef} className="relative">
      <form
        onSubmit={handleSubmit}
        className={`flex gap-2 ${className}`}
      >
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder={placeholder}
            className="w-full pr-20"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Search History"
            >
              <Clock className="h-4 w-4 text-gray-400" />
            </button>
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Button type="submit">
          Search
        </Button>
      </form>

      {showHistory && (
        <SearchHistory
          onSelect={handleHistorySelect}
          onClear={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

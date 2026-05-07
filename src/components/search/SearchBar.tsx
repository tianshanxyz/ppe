'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Search, Clock, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import SearchSuggestions from './SearchSuggestions'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  className?: string
  size?: 'default' | 'large'
}

export function SearchBar({
  initialQuery = '',
  placeholder = 'Search products, companies, regulations...',
  className = '',
  size = 'default',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowSuggestions(false)
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`
    }
  }

  const handleSuggestionSelect = (selectedQuery: string) => {
    setQuery(selectedQuery)
    setShowSuggestions(false)
    window.location.href = `/search?q=${encodeURIComponent(selectedQuery)}`
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(value.trim().length > 1)
  }

  const handleClear = () => {
    setQuery('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const inputSize = size === 'large' ? 'lg' : 'md'

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className={`absolute left-3 ${inputSize === 'lg' ? 'top-4' : 'top-2.5'} w-5 h-5 text-gray-400`} />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true)
              if (query.trim().length > 1) setShowSuggestions(true)
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`pl-10 ${size === 'large' ? 'h-12 text-lg' : 'h-10'} rounded-lg ${
              isFocused ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <SearchSuggestions
            query={query}
            onSelect={handleSuggestionSelect}
            onClose={() => setShowSuggestions(false)}
            visible={showSuggestions}
          />
        </div>
      )}
    </div>
  )
}

export default SearchBar

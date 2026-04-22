'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSuggestionSelect = (selectedQuery: string) => {
    setQuery(selectedQuery)
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(selectedQuery)}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setShowSuggestions(true)
  }

  const handleInputFocus = () => {
    setIsFocused(true)
    setShowSuggestions(true)
  }

  const clearInput = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2"
      >
        <div className={`
          relative flex-1 transition-all duration-200
          ${isFocused ? 'ring-2 ring-[#339999] ring-opacity-50' : ''}
          ${size === 'large' ? 'scale-105' : ''}
          rounded-lg
        `}>
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={`
              w-full 
              ${size === 'large' ? 'py-4 text-lg' : 'py-2.5'}
              pr-24
              border-2
              ${isFocused ? 'border-[#339999]' : 'border-gray-200'}
              transition-colors
              rounded-lg
            `}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={clearInput}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Clear"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Search History"
            >
              <Clock className="h-4 w-4 text-gray-400" />
            </button>
            <Search className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        <Button 
          type="submit"
          className={`
            bg-[#339999] hover:bg-[#2d8b8b] text-white
            ${size === 'large' ? 'px-8 py-4 text-lg' : ''}
            transition-all duration-200
          `}
        >
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

      <SearchSuggestions
        query={query}
        onSelect={handleSuggestionSelect}
        onClose={() => setShowSuggestions(false)}
        visible={showSuggestions}
      />
    </div>
  )
}

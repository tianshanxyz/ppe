'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Building2, Package, X, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'
import { SearchBar } from '@/components/search/SearchBar'
import { SearchResults } from '@/components/search/SearchResults'
import { Skeleton } from '@/components/ui/Skeleton'

interface EmptyStateProps {
  type: 'no-results' | 'no-filters' | 'error'
  message?: string
  onReset?: () => void
}

function EmptyState({ type, message, onReset }: EmptyStateProps) {
  const [showAnimation, setShowAnimation] = useState(false)

  useEffect(() => {
    setShowAnimation(true)
  }, [])

  const getIcon = () => {
    switch (type) {
      case 'no-results':
        return <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      case 'no-filters':
        return <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      case 'error':
        return <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      default:
        return <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'no-results':
        return 'No results found'
      case 'no-filters':
        return 'Start your search'
      case 'error':
        return 'Something went wrong'
      default:
        return 'No results found'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'no-results':
        return message || 'Try adjusting your search or filters'
      case 'no-filters':
        return 'Search for products, companies, or regulations'
      case 'error':
        return message || 'Please try again later'
      default:
        return message || 'Try adjusting your search or filters'
    }
  }

  return (
    <div className={`text-center py-20 transition-opacity duration-500 ${showAnimation ? 'opacity-100' : 'opacity-0'}`}>
      {getIcon()}
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
        {getTitle()}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {getDescription()}
      </p>
      {type === 'no-results' && onReset && (
        <Button
          onClick={onReset}
          className="bg-[#339999] hover:bg-[#2a8080] text-white"
        >
          Clear all filters
        </Button>
      )}
      {type === 'error' && onReset && (
        <Button
          onClick={onReset}
          className="bg-[#339999] hover:bg-[#2a8080] text-white"
        >
          Try again
        </Button>
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 animate-spin border-4 border-[#339999] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Searching...</p>
      </div>
    </div>
  )
}

export { EmptyState, LoadingState }

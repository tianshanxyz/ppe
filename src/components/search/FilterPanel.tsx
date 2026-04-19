'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlidersHorizontal, ChevronDown, X, Check } from 'lucide-react'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

interface FilterPanelProps {
  filters: Record<string, string[]>
  onFilterChange: (filters: Record<string, string[]>) => void
  resultCount: number
  className?: string
}

const filterGroups: FilterGroup[] = [
  {
    id: 'market',
    label: 'Market',
    options: [
      { value: 'us', label: 'United States (FDA)', count: 0 },
      { value: 'eu', label: 'European Union (EUDAMED)', count: 43798 },
      { value: 'cn', label: 'China (NMPA)', count: 0 },
      { value: 'jp', label: 'Japan (PMDA)', count: 0 },
    ],
  },
  {
    id: 'device_class',
    label: 'Device Class',
    options: [
      { value: 'class_i', label: 'Class I', count: 0 },
      { value: 'class_iia', label: 'Class IIa', count: 0 },
      { value: 'class_iib', label: 'Class IIb', count: 0 },
      { value: 'class_iii', label: 'Class III', count: 0 },
      { value: 'class_ii', label: 'Class II (US)', count: 0 },
    ],
  },
  {
    id: 'product_type',
    label: 'Product Type',
    options: [
      { value: 'diagnostic', label: 'Diagnostic', count: 0 },
      { value: 'surgical', label: 'Surgical', count: 0 },
      { value: 'therapeutic', label: 'Therapeutic', count: 0 },
      { value: 'monitoring', label: 'Monitoring', count: 0 },
      { value: 'implantable', label: 'Implantable', count: 0 },
      { value: 'software', label: 'Software (SaMD)', count: 0 },
    ],
  },
  {
    id: 'data_source',
    label: 'Data Source',
    options: [
      { value: 'fda', label: 'FDA 510(k)', count: 0 },
      { value: 'pma', label: 'FDA PMA', count: 0 },
      { value: 'eudamed', label: 'EUDAMED', count: 43798 },
      { value: 'nmpa', label: 'NMPA', count: 0 },
      { value: 'mdr', label: 'MDR Database', count: 0 },
    ],
  },
  {
    id: 'date_range',
    label: 'Registration Date',
    options: [
      { value: 'last_30_days', label: 'Last 30 Days', count: 0 },
      { value: 'last_90_days', label: 'Last 90 Days', count: 0 },
      { value: 'last_year', label: 'Last Year', count: 0 },
      { value: 'last_2_years', label: 'Last 2 Years', count: 0 },
      { value: 'last_5_years', label: 'Last 5 Years', count: 0 },
    ],
  },
]

export function FilterPanel({ filters, onFilterChange, resultCount, className = '' }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['market', 'device_class'])

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }, [])

  const toggleFilter = useCallback((groupId: string, value: string) => {
    onFilterChange({
      ...filters,
      [groupId]: filters[groupId]?.includes(value)
        ? filters[groupId].filter(v => v !== value)
        : [...(filters[groupId] || []), value],
    })
  }, [filters, onFilterChange])

  const clearFilters = useCallback(() => {
    onFilterChange({})
  }, [onFilterChange])

  const activeFilterCount = Object.values(filters).flat().length

  return (
    <div className={className}>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {(isOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isOpen ? 'block' : 'hidden'} lg:block mt-4 lg:mt-0`}
          >
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Filter Groups */}
              <div className="divide-y divide-gray-100">
                {filterGroups.map(group => (
                  <div key={group.id} className="px-4 py-3">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-900">{group.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedGroups.includes(group.id) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {expandedGroups.includes(group.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2"
                        >
                          {group.options.map(option => {
                            const isSelected = filters[group.id]?.includes(option.value)
                            return (
                              <label
                                key={option.value}
                                className="flex items-center gap-3 cursor-pointer group"
                              >
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'bg-primary-600 border-primary-600'
                                      : 'border-gray-300 group-hover:border-primary-400'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSelected}
                                  onChange={() => toggleFilter(group.id, option.value)}
                                />
                                <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                  {option.label}
                                </span>
                                {option.count !== undefined && option.count > 0 && (
                                  <span className="ml-auto text-xs text-gray-400">
                                    {option.count.toLocaleString()}
                                  </span>
                                )}
                              </label>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-semibold text-gray-900">{resultCount.toLocaleString()}</span> results
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

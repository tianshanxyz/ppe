import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface SearchFilters {
  keyword?: string
  category?: string
  jurisdiction?: string
  status?: string
  riskLevel?: string
  dateRange?: [string, string] | null
  dataSource?: string
}

export interface SearchResult {
  id: string
  title: string
  description: string
  type: 'ppe' | 'enterprise' | 'regulation'
  metadata: Record<string, any>
  updatedAt: string
  status?: string
  jurisdiction?: string
  manufacturer?: string
  category?: string
  dataSource?: string
}

export const useSearchStore = defineStore('search', () => {
  // State
  const filters = ref<SearchFilters>({})
  const results = ref<SearchResult[]>([])
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const searchHistory = ref<string[]>(JSON.parse(localStorage.getItem('searchHistory') || '[]'))

  // Getters
  const hasFilters = computed(() => Object.keys(filters.value).length > 0)
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

  // Actions
  const setFilters = (newFilters: SearchFilters) => {
    filters.value = { ...newFilters }
  }

  const clearFilters = () => {
    filters.value = {}
  }

  const search = async (params?: Partial<SearchFilters>) => {
    loading.value = true
    try {
      const searchParams = { ...filters.value, ...params }
      
      // TODO: 调用搜索API
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...searchParams,
          page: currentPage.value,
          pageSize: pageSize.value
        })
      })
      
      if (!response.ok) {
        throw new Error('搜索失败')
      }
      
      const data = await response.json()
      results.value = data.results
      total.value = data.total
      
      // 保存搜索历史
      if (searchParams.keyword) {
        addToHistory(searchParams.keyword)
      }
      
      return data
    } catch (error) {
      console.error('搜索错误:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const addToHistory = (keyword: string) => {
    if (!searchHistory.value.includes(keyword)) {
      searchHistory.value.unshift(keyword)
      if (searchHistory.value.length > 10) {
        searchHistory.value = searchHistory.value.slice(0, 10)
      }
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
    }
  }

  const clearHistory = () => {
    searchHistory.value = []
    localStorage.removeItem('searchHistory')
  }

  const setPage = (page: number) => {
    currentPage.value = page
  }

  const setPageSize = (size: number) => {
    pageSize.value = size
    currentPage.value = 1
  }

  return {
    filters,
    results,
    loading,
    total,
    currentPage,
    pageSize,
    searchHistory,
    hasFilters,
    totalPages,
    setFilters,
    clearFilters,
    search,
    addToHistory,
    clearHistory,
    setPage,
    setPageSize
  }
})

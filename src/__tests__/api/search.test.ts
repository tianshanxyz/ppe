import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/search/route'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

describe('Search API', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('GET /api/search', () => {
    it('should return search results for valid query', async () => {
      const mockCompanies = [
        {
          id: '1',
          name: 'Test Company',
          market: 'fda',
        },
      ]

      const mockProducts = [
        {
          id: '2',
          name: 'Test Product',
          market: 'fda',
        },
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: mockCompanies, error: null }),
      })

      const { req } = createMocks({
        method: 'GET',
        query: {
          q: 'test',
          market: 'fda',
          page: '1',
          limit: '20',
        },
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should handle missing query parameter', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: {},
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Query parameter is required')
    })

    it('should handle empty query parameter', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { q: '' },
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      })

      const { req } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Failed to search')
    })

    it('should handle pagination correctly', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: {
          q: 'test',
          page: '2',
          limit: '10',
        },
      })

      await GET(req)

      expect(mockSupabaseClient.from).toHaveBeenCalled()
      expect(mockSupabaseClient.limit).toHaveBeenCalledWith(10)
    })

    it('should use default market when not specified', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      await GET(req)

      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })

    it('should handle special characters in query', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { q: 'test&device' },
      })

      const response = await GET(req)
      
      // Should not throw error
      expect(response).toBeDefined()
    })

    it('should handle long query strings', async () => {
      const longQuery = 'a'.repeat(200)
      const { req } = createMocks({
        method: 'GET',
        query: { q: longQuery },
      })

      const response = await GET(req)
      
      // Should handle gracefully
      expect(response).toBeDefined()
    })

    it('should return proper response structure', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
      })

      const { req } = createMocks({
        method: 'GET',
        query: { q: 'test' },
      })

      const response = await GET(req)
      const data = await response.json()

      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('companies')
      expect(data.data).toHaveProperty('products')
      expect(data.data).toHaveProperty('pagination')
    })
  })
})

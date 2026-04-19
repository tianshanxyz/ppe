import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchPage from '@/app/search/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Supabase
const mockSupabaseFrom = jest.fn()
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}))

describe('Search Page Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render search page with all elements', () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    })

    render(<SearchPage />)

    expect(screen.getByPlaceholderText(/搜索医疗器械/i)).toBeInTheDocument()
    expect(screen.getByText(/搜索/i)).toBeInTheDocument()
  })

  it('should perform search when form is submitted', async () => {
    const mockData = [
      {
        id: '1',
        device_name: 'Test Device',
        applicant: 'Test Company',
        decision_date: '2024-01-01',
        decision: 'APPROVED',
        product_code: 'ABC',
      },
    ]

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      }),
    })

    render(<SearchPage />)

    const searchInput = screen.getByPlaceholderText(/搜索医疗器械/i)
    const searchButton = screen.getByText(/搜索/i)

    await userEvent.type(searchInput, 'test device')
    fireEvent.click(searchButton)

    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalled()
    })
  })

  it('should filter by region', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    })

    render(<SearchPage />)

    const regionSelect = screen.getByLabelText(/地区/i)
    fireEvent.change(regionSelect, { target: { value: 'FDA' } })

    await waitFor(() => {
      expect(mockSupabaseFrom).toHaveBeenCalled()
    })
  })

  it('should show loading state during search', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: [], error: null, count: 0 }), 100))
      ),
    })

    render(<SearchPage />)

    const searchButton = screen.getByText(/搜索/i)
    fireEvent.click(searchButton)

    expect(screen.getByText(/搜索中/i)).toBeInTheDocument()
  })

  it('should display search results', async () => {
    const mockData = [
      {
        id: '1',
        device_name: 'Cardiac Monitor',
        applicant: 'MedTech Inc',
        decision_date: '2024-01-15',
        decision: 'APPROVED',
        product_code: 'CM123',
      },
    ]

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 1,
      }),
    })

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByText('Cardiac Monitor')).toBeInTheDocument()
    })

    expect(screen.getByText('MedTech Inc')).toBeInTheDocument()
    expect(screen.getByText('APPROVED')).toBeInTheDocument()
  })

  it('should handle search errors gracefully', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      }),
    })

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByText(/搜索失败/i)).toBeInTheDocument()
    })
  })

  it('should handle pagination', async () => {
    const mockData = Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      device_name: `Device ${i + 1}`,
      applicant: `Company ${i + 1}`,
      decision_date: '2024-01-01',
      decision: 'APPROVED',
      product_code: `CODE${i + 1}`,
    }))

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: 100,
      }),
    })

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByText('Device 1')).toBeInTheDocument()
    })

    // Check if pagination is shown
    expect(screen.getByText(/共 100 条结果/i)).toBeInTheDocument()
  })
})

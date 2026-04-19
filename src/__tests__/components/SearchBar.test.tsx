import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchBar } from '@/components/search/SearchBar'
import { useRouter } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('SearchBar Component', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  it('should render search bar with placeholder', () => {
    render(<SearchBar />)
    expect(screen.getByPlaceholderText('Search products, companies...')).toBeInTheDocument()
  })

  it('should render with initial query', () => {
    render(<SearchBar initialQuery="test query" />)
    expect(screen.getByDisplayValue('test query')).toBeInTheDocument()
  })

  it('should render with custom placeholder', () => {
    render(<SearchBar placeholder="Custom placeholder" />)
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
  })

  it('should navigate to search results on submit', () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText('Search products, companies...')
    fireEvent.change(input, { target: { value: 'medical device' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=medical%20device')
  })

  it('should not navigate on empty query', () => {
    render(<SearchBar />)
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should not navigate on whitespace-only query', () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText('Search products, companies...')
    fireEvent.change(input, { target: { value: '   ' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show history on focus', async () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText('Search products, companies...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument()
    })
  })

  it('should hide history when clicking outside', async () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText('Search products, companies...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear history/i })).toBeInTheDocument()
    })
    
    fireEvent.mouseDown(document.body)
    
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /clear history/i })).not.toBeInTheDocument()
    })
  })

  it('should handle history selection', async () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText('Search products, companies...')
    fireEvent.focus(input)
    
    await waitFor(() => {
      const historyItem = screen.getByRole('button', { name: /test/i })
      if (historyItem) {
        fireEvent.click(historyItem)
        expect(mockPush).toHaveBeenCalled()
      }
    })
  })

  it('should trim query before navigation', () => {
    render(<SearchBar />)
    
    const input = screen.getByPlaceholderText('Search products, companies...')
    fireEvent.change(input, { target: { value: '  medical device  ' } })
    
    const form = screen.getByRole('form')
    fireEvent.submit(form)
    
    expect(mockPush).toHaveBeenCalledWith('/search?q=medical%20device')
  })

  it('should apply custom className', () => {
    render(<SearchBar className="custom-class" />)
    expect(screen.getByRole('form')).toHaveClass('custom-class')
  })

  it('should have search icon', () => {
    render(<SearchBar />)
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('should have history toggle button', () => {
    render(<SearchBar />)
    expect(screen.getByRole('button', { name: /search history/i })).toBeInTheDocument()
  })
})

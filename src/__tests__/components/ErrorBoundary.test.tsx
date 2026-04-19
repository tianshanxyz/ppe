import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, ErrorFallback } from '@/components/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
  // Suppress console.error for these tests
  const originalConsoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  it('should render children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
    expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('should show error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should show technical details when toggled', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    const toggleButton = screen.getByText('Show Technical Details')
    fireEvent.click(toggleButton)
    
    expect(screen.getByText('Hide Technical Details')).toBeInTheDocument()
  })

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn()
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(onError).toHaveBeenCalled()
  })

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })
})

describe('ErrorFallback Component', () => {
  it('should render error fallback with title and description', () => {
    const error = new Error('Test error')
    const resetError = jest.fn()
    
    render(
      <ErrorFallback 
        error={error} 
        resetError={resetError}
        title="Custom Title"
        description="Custom description"
      />
    )
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom description')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should call resetError when retry button is clicked', () => {
    const error = new Error('Test error')
    const resetError = jest.fn()
    
    render(<ErrorFallback error={error} resetError={resetError} />)
    
    fireEvent.click(screen.getByRole('button', { name: /retry/i }))
    expect(resetError).toHaveBeenCalledTimes(1)
  })

  it('should render with default title and description', () => {
    const error = new Error('Test error')
    const resetError = jest.fn()
    
    render(<ErrorFallback error={error} resetError={resetError} />)
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('An error occurred while loading this section.')).toBeInTheDocument()
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Email" name="email" />)
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should render input with placeholder', () => {
    render(<Input placeholder="Enter email" name="email" />)
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('should handle value changes', () => {
    const handleChange = jest.fn()
    render(<Input name="email" onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test@example.com' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('should show error state', () => {
    render(<Input name="email" error="Invalid email" />)
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500')
  })

  it('should show helper text', () => {
    render(<Input name="email" helperText="We will never share your email" />)
    expect(screen.getByText('We will never share your email')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input name="email" disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should render different sizes', () => {
    const { rerender } = render(<Input name="email" size="sm" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<Input name="email" size="md" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-4', 'py-2')

    rerender(<Input name="email" size="lg" />)
    expect(screen.getByRole('textbox')).toHaveClass('px-4', 'py-3', 'text-lg')
  })

  it('should render as full width when fullWidth is true', () => {
    render(<Input name="email" fullWidth />)
    expect(screen.getByRole('textbox')).toHaveClass('w-full')
  })

  it('should render with left icon', () => {
    const LeftIcon = () => <span data-testid="left-icon">Icon</span>
    render(<Input name="email" leftIcon={<LeftIcon />} />)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('should render with right icon', () => {
    const RightIcon = () => <span data-testid="right-icon">Icon</span>
    render(<Input name="email" rightIcon={<RightIcon />} />)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('should render required indicator', () => {
    render(<Input label="Email" name="email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})

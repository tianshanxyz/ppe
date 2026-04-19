import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'

describe('Card Component', () => {
  it('should render card with content', () => {
    render(
      <Card>
        <CardContent>Card Content</CardContent>
      </Card>
    )
    expect(screen.getByText('Card Content')).toBeInTheDocument()
  })

  it('should render card with header', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
      </Card>
    )
    expect(screen.getByText('Card Title')).toBeInTheDocument()
    expect(screen.getByText('Card Description')).toBeInTheDocument()
  })

  it('should render card with footer', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    )
    expect(screen.getByText('Footer Content')).toBeInTheDocument()
  })

  it('should apply hover effect when hoverable is true', () => {
    render(
      <Card hoverable>
        <CardContent>Hoverable Card</CardContent>
      </Card>
    )
    expect(screen.getByText('Hoverable Card').parentElement).toHaveClass('hover:shadow-lg')
  })

  it('should apply clickable styles when onClick is provided', () => {
    const handleClick = jest.fn()
    render(
      <Card onClick={handleClick}>
        <CardContent>Clickable Card</CardContent>
      </Card>
    )
    expect(screen.getByText('Clickable Card').parentElement).toHaveClass('cursor-pointer')
  })

  it('should render with custom className', () => {
    render(
      <Card className="custom-class">
        <CardContent>Custom Card</CardContent>
      </Card>
    )
    expect(screen.getByText('Custom Card').parentElement).toHaveClass('custom-class')
  })

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This is a complete card</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content goes here</p>
        </CardContent>
        <CardFooter>
          <span>Footer actions</span>
        </CardFooter>
      </Card>
    )
    
    expect(screen.getByText('Complete Card')).toBeInTheDocument()
    expect(screen.getByText('This is a complete card')).toBeInTheDocument()
    expect(screen.getByText('Main content goes here')).toBeInTheDocument()
    expect(screen.getByText('Footer actions')).toBeInTheDocument()
  })
})

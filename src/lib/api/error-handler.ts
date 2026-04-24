import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request body',
        code: 'INVALID_BODY',
      },
      { status: 400 }
    )
  }

  console.error('Unhandled API error:', error)

  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : error instanceof Error ? error.message : 'Unknown error'

  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  )
}

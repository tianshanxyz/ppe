import { NextResponse } from 'next/server'

/**
 * API 响应包装器
 * 
 * 统一的 API 响应格式，包含版本信息
 */
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    version: string
    timestamp: string
    requestId?: string
    pagination?: Pagination
  }
}

/**
 * 成功响应
 */
export function successResponse<T>(
  data: T,
  options?: {
    version?: string
    message?: string
    pagination?: Pagination
  }
): NextResponse<ApiResponse<T>> {
  const { version = 'v1', message, pagination } = options || {}

  return NextResponse.json({
    success: true,
    data,
    message,
    meta: {
      version,
      timestamp: new Date().toISOString(),
      ...(pagination && { pagination }),
    },
  })
}

/**
 * 错误响应
 */
export function errorResponse(
  error: string,
  options?: {
    version?: string
    status?: number
    message?: string
  }
): NextResponse<ApiResponse<never>> {
  const { version = 'v1', status = 400, message } = options || {}

  return NextResponse.json(
    {
      success: false,
      error,
      message,
      meta: {
        version,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  )
}

/**
 * 分页响应
 */
export function paginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  },
  options?: {
    version?: string
  }
): NextResponse<ApiResponse<T[]>> {
  const { version = 'v1' } = options || {}
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return NextResponse.json({
    success: true,
    data,
    meta: {
      version,
      timestamp: new Date().toISOString(),
      pagination: {
        ...pagination,
        totalPages,
      },
    },
  })
}

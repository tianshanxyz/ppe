import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'
import { createLogger } from '@/lib/logging/pino'
import { captureException } from '@/lib/monitoring/sentry'
import { medplum } from '@/lib/medplum/service'

// 日志配置
const logger = createLogger({ module: 'medplum-search' })

// 搜索设备
export const GET = withRateLimit(async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'Device'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filters = searchParams.get('filters')

    logger.info({
      query,
      type,
      page,
      limit,
      filters: filters || undefined,
    }, 'Medplum search request')

    let result: any

    // 根据类型执行不同的搜索
    switch (type) {
      case 'Device':
        result = await searchDevices(query, page, limit, filters || undefined)
        break
      case 'Organization':
        result = await searchOrganizations(query, page, limit, filters || undefined)
        break
      case 'RegulatoryAuthorization':
        result = await searchRegulatoryAuthorizations(query, page, limit, filters || undefined)
        break
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported search type'
          },
          { status: 400 }
        )
    }

    // 处理搜索结果
    const processedResult = processSearchResult(result, type)

    return NextResponse.json({
      success: true,
      data: processedResult.data,
      pagination: processedResult.pagination,
      type,
      query
    })
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Medplum search error')
    
    captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { module: 'medplum-search' },
      extra: { endpoint: '/api/medplum/search' }
    })

    // 降级到本地搜索
    const fallbackResult = await getFallbackSearchResult(request)
    if (fallbackResult) {
      return NextResponse.json({
        success: true,
        data: fallbackResult.data,
        pagination: fallbackResult.pagination,
        type: 'Device',
        query: request.nextUrl.searchParams.get('q') || '',
        fallback: true,
        message: 'Using local data due to Medplum service issues'
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Search failed. Please try again later.'
      },
      { status: 500 }
    )
  }
}, {
  maxRequests: 60,
  windowInSeconds: 60 // 1 分钟 60 次请求
})

// 搜索设备
async function searchDevices(
  query: string,
  page: number,
  limit: number,
  filters?: string
) {
  try {
    const filterParams = filters ? JSON.parse(filters) : {}
    
    const result = await medplum.searchDevices({
      name: query,
      manufacturer: filterParams.manufacturer,
      type: filterParams.type,
      page,
      limit
    })

    return result
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      query
    }, 'Device search error')
    throw error
  }
}

// 搜索组织
async function searchOrganizations(
  query: string,
  page: number,
  limit: number,
  filters?: string
) {
  try {
    const filterParams = filters ? JSON.parse(filters) : {}
    
    const result = await medplum.searchOrganizations({
      name: query,
      type: filterParams.type,
      city: filterParams.city,
      country: filterParams.country,
      page,
      limit
    })

    return result
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      query
    }, 'Organization search error')
    throw error
  }
}

// 搜索法规授权
async function searchRegulatoryAuthorizations(
  query: string,
  page: number,
  limit: number,
  filters?: string
) {
  try {
    const filterParams = filters ? JSON.parse(filters) : {}
    
    const result = await medplum.searchRegulatoryAuthorizations({
      device: filterParams.device,
      status: filterParams.status,
      authority: filterParams.authority,
      page,
      limit
    })

    return result
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      query
    }, 'Regulatory authorization search error')
    throw error
  }
}

// 处理搜索结果
function processSearchResult(result: any, type: string) {
  const entries = result.entry || []
  const total = result.total || entries.length
  
  const data = entries.map((entry: any) => {
    const resource = entry.resource
    
    switch (type) {
      case 'Device':
        return processDeviceResource(resource)
      case 'Organization':
        return processOrganizationResource(resource)
      case 'RegulatoryAuthorization':
        return processRegulatoryAuthorizationResource(resource)
      default:
        return resource
    }
  })

  return {
    data,
    pagination: {
      total,
      page: 1,
      limit: entries.length,
      totalPages: Math.ceil(total / entries.length)
    }
  }
}

// 处理设备资源
function processDeviceResource(resource: any) {
  return {
    id: resource.id,
    name: resource.deviceName?.[0]?.name || 'Unknown Device',
    type: resource.type?.coding?.[0]?.display || 'Unknown Type',
    manufacturer: resource.manufacturer || 'Unknown Manufacturer',
    model: resource.modelNumber || 'Unknown Model',
    version: resource.version?.[0]?.value || 'Unknown Version',
    status: resource.status || 'unknown',
    description: resource.description || '',
    dataSource: 'Medplum',
    resourceType: 'Device',
    medplumId: resource.id
  }
}

// 处理组织资源
function processOrganizationResource(resource: any) {
  return {
    id: resource.id,
    name: resource.name || 'Unknown Organization',
    type: resource.type?.[0]?.coding?.[0]?.display || 'Unknown Type',
    address: resource.address?.[0]?.text || '',
    city: resource.address?.[0]?.city || '',
    country: resource.address?.[0]?.country || '',
    phone: resource.telecom?.[0]?.value || '',
    dataSource: 'Medplum',
    resourceType: 'Organization',
    medplumId: resource.id
  }
}

// 处理法规授权资源
function processRegulatoryAuthorizationResource(resource: any) {
  return {
    id: resource.id,
    name: resource.name || 'Unknown Authorization',
    status: resource.status || 'unknown',
    authority: resource.authority?.display || 'Unknown Authority',
    device: resource.device?.display || 'Unknown Device',
    validityPeriod: {
      start: resource.validityPeriod?.start || '',
      end: resource.validityPeriod?.end || ''
    },
    dataSource: 'Medplum',
    resourceType: 'RegulatoryAuthorization',
    medplumId: resource.id
  }
}

// 降级到本地搜索
async function getFallbackSearchResult(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20')

    // 这里应该集成本地数据库搜索
    // 例如使用 Supabase 搜索本地设备数据
    // const supabase = createClient()
    // const { data, error, count } = await supabase
    //   .from('devices')
    //   .select('*')
    //   .ilike('name', `%${query}%`)
    //   .limit(limit)
    //   .select('*', { count: 'exact' })

    // 模拟本地数据
    const mockData = Array(Math.min(limit, 5)).fill(0).map((_, index) => ({
      id: `local-${Date.now()}-${index}`,
      name: `Local Device ${index + 1}`,
      type: 'Medical Device',
      manufacturer: 'Local Manufacturer',
      model: `Model ${index + 1}`,
      version: '1.0',
      status: 'active',
      description: 'Local device data for fallback',
      dataSource: 'Local',
      resourceType: 'Device'
    }))

    return {
      data: mockData,
      pagination: {
        total: 5,
        page: 1,
        limit: mockData.length,
        totalPages: 1
      }
    }
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 'Fallback search error')
    return null
  }
}

// POST 方法 - 高级搜索
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, type, filters, page = 1, limit = 20 } = body

    logger.info({
      query,
      type,
      page,
      limit,
      filters: filters || undefined,
    }, 'Medplum advanced search request')

    let result: any

    // 根据类型执行不同的搜索
    switch (type) {
      case 'Device':
        result = await searchDevices(query, page, limit, JSON.stringify(filters))
        break
      case 'Organization':
        result = await searchOrganizations(query, page, limit, JSON.stringify(filters))
        break
      case 'RegulatoryAuthorization':
        result = await searchRegulatoryAuthorizations(query, page, limit, JSON.stringify(filters))
        break
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported search type'
          },
          { status: 400 }
        )
    }

    // 处理搜索结果
    const processedResult = processSearchResult(result, type)

    return NextResponse.json({
      success: true,
      data: processedResult.data,
      pagination: processedResult.pagination,
      type,
      query
    })
  } catch (error) {
    logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'Medplum advanced search error')
    
    captureException(error instanceof Error ? error : new Error(String(error)), {
      tags: { module: 'medplum-search' },
      extra: { endpoint: '/api/medplum/search' }
    })

    return NextResponse.json(
      {
        success: false,
        error: 'Advanced search failed. Please try again later.'
      },
      { status: 500 }
    )
  }
}

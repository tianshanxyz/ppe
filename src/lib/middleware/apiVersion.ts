import { NextRequest, NextResponse } from 'next/server'

/**
 * API 版本控制中间件
 * 
 * 功能：
 * - 解析 API 版本号（从 URL 路径或请求头）
 * - 验证 API 版本是否支持
 * - 添加版本信息到响应头
 * - 处理版本弃用警告
 */

export interface ApiVersion {
  version: string
  deprecated?: boolean
  sunsetDate?: string
  supported: boolean
}

/**
 * 支持的 API 版本列表
 */
const SUPPORTED_VERSIONS: Record<string, ApiVersion> = {
  'v1': {
    version: 'v1',
    supported: true,
    deprecated: false,
  },
  'v2': {
    version: 'v2',
    supported: true,
    deprecated: false,
  },
  // 未来版本
  'v3': {
    version: 'v3',
    supported: false,
    deprecated: false,
  },
}

/**
 * 当前默认 API 版本
 */
export const DEFAULT_API_VERSION = 'v1'

/**
 * 解析 API 版本号
 * 
 * 优先级：
 * 1. URL 路径：/api/v1/search
 * 2. 请求头：X-API-Version: v1
 * 3. 查询参数：?api-version=v1
 * 4. 默认版本：v1
 */
export function parseApiVersion(request: NextRequest): string {
  // 1. 从 URL 路径解析
  const pathParts = request.nextUrl.pathname.split('/')
  const pathVersion = pathParts.find(part => part.startsWith('v') && /^\d+$/.test(part.slice(1)))
  if (pathVersion && SUPPORTED_VERSIONS[pathVersion]?.supported) {
    return pathVersion
  }

  // 2. 从请求头解析
  const headerVersion = request.headers.get('X-API-Version')
  if (headerVersion && SUPPORTED_VERSIONS[headerVersion]?.supported) {
    return headerVersion
  }

  // 3. 从查询参数解析
  const queryVersion = request.nextUrl.searchParams.get('api-version')
  if (queryVersion && SUPPORTED_VERSIONS[queryVersion]?.supported) {
    return queryVersion
  }

  // 4. 返回默认版本
  return DEFAULT_API_VERSION
}

/**
 * 验证 API 版本
 */
export function validateApiVersion(version: string): ApiVersion {
  return SUPPORTED_VERSIONS[version] || {
    version,
    supported: false,
    deprecated: false,
  }
}

/**
 * API 版本控制中间件
 * 
 * 使用示例：
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withApiVersion(async (request, version) => {
 *     // version = 'v1' | 'v2'
 *     // 根据版本执行不同逻辑
 *   })(request)
 * }
 * ```
 */
export function withApiVersion(
  handler: (request: NextRequest, version: string) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const version = parseApiVersion(request)
    const versionInfo = validateApiVersion(version)

    // 如果版本不支持，返回错误
    if (!versionInfo.supported) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported API version',
          message: `API version '${version}' is not supported. Supported versions: ${Object.keys(SUPPORTED_VERSIONS).filter(v => SUPPORTED_VERSIONS[v].supported).join(', ')}`,
        },
        {
          status: 400,
          headers: {
            'X-Supported-Versions': Object.keys(SUPPORTED_VERSIONS).filter(v => SUPPORTED_VERSIONS[v].supported).join(', '),
          },
        }
      )
    }

    // 执行处理函数
    const response = await handler(request, version)

    // 添加版本信息到响应头
    response.headers.set('X-API-Version', version)
    
    // 如果版本已弃用，添加警告头
    if (versionInfo.deprecated) {
      response.headers.set('X-API-Deprecation', 'true')
      
      if (versionInfo.sunsetDate) {
        response.headers.set('X-API-Sunset', versionInfo.sunsetDate)
      }
    }

    return response
  }
}

/**
 * 获取 API 版本信息
 */
export function getApiVersionInfo(): Record<string, ApiVersion> {
  return SUPPORTED_VERSIONS
}

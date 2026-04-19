// Medplum 服务核心模块
import axios, { AxiosInstance, AxiosError } from 'axios'
import { createLogger } from '@/lib/logging/pino'
import { captureException } from '@/lib/monitoring/sentry'
import { cacheService, generateCacheKey, CACHE_CONFIG } from '@/lib/medplum/cache'

// 日志配置
const logger = createLogger({ module: 'medplum-service' })

// Medplum 配置接口
interface MedplumConfig {
  baseUrl: string
  clientId: string
  clientSecret: string
  timeout?: number
  retryAttempts?: number
}

// Medplum 认证响应
interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

// Medplum 服务类
class MedplumService {
  private config: MedplumConfig
  private axios: AxiosInstance
  private authToken: string | null = null
  private tokenExpiry: number | null = null
  private refreshToken: string | null = null

  constructor(config: MedplumConfig) {
    this.config = {
      timeout: 30000, // 默认30秒超时
      retryAttempts: 3, // 默认3次重试
      ...config
    }

    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/fhir+json'
      }
    })

    // 添加请求拦截器
    this.axios.interceptors.request.use(
      async (config) => {
        const token = await this.getAuthToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // 添加响应拦截器
    this.axios.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // 令牌过期，尝试刷新
          try {
            await this.refreshAuthToken()
            // 重试原始请求
            const originalRequest = error.config
            if (originalRequest) {
              const token = await this.getAuthToken()
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return this.axios(originalRequest)
              }
            }
          } catch (refreshError) {
            logger.error({
              error: refreshError instanceof Error ? refreshError.message : 'Unknown error'
            }, 'Token refresh failed')
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // 获取认证令牌
  async getAuthToken(): Promise<string> {
    if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.authToken
    }

    if (this.refreshToken) {
      try {
        await this.refreshAuthToken()
        if (this.authToken) {
          return this.authToken
        }
      } catch (error) {
        logger.warn({
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Refresh token failed, falling back to client credentials')
      }
    }

    await this.authenticate()
    if (!this.authToken) {
      throw new Error('Failed to authenticate with Medplum')
    }

    return this.authToken
  }

  // 使用客户端凭证认证
  private async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Medplum')

      const response = await axios.post<AuthResponse>(
        `${this.config.baseUrl}/oauth2/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          scope: 'openid fhir'
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      this.authToken = response.data.access_token
      this.refreshToken = response.data.refresh_token
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000 // 提前60秒过期

      logger.info('Medplum authentication successful')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Medplum authentication failed')
      captureException(error instanceof Error ? error : new Error(String(error)), {
        tags: { module: 'medplum-service' },
        extra: { action: 'authenticate' }
      })
      throw error
    }
  }

  // 刷新认证令牌
  private async refreshAuthToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      logger.info('Refreshing Medplum token')

      const response = await axios.post<AuthResponse>(
        `${this.config.baseUrl}/oauth2/token`,
        {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      this.authToken = response.data.access_token
      this.refreshToken = response.data.refresh_token
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000 // 提前60秒过期

      logger.info('Medplum token refreshed successfully')
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Medplum token refresh failed')
      // 清除令牌，下次会重新认证
      this.authToken = null
      this.tokenExpiry = null
      this.refreshToken = null
      throw error
    }
  }

  // 通用 API 调用方法
  async apiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    let attempts = 0
    const maxAttempts = this.config.retryAttempts || 3

    while (attempts < maxAttempts) {
      try {
        attempts++
        
        const config: any = {
          method,
          url: endpoint,
          params
        }

        if (data && (method === 'POST' || method === 'PUT')) {
          config.data = data
        }

        const startTime = Date.now()
        const response = await this.axios(config)
        const duration = Date.now() - startTime

        logger.info({
          method,
          endpoint,
          duration: `${duration}ms`,
          status: response.status
        }, 'Medplum API call successful')

        return response.data as T
      } catch (error) {
        const isNetworkError = !(error as any).response
        const isRetryable = isNetworkError || 
          [429, 500, 502, 503, 504].includes((error as any).response?.status)

        if (isRetryable && attempts < maxAttempts) {
          const delay = Math.pow(2, attempts - 1) * 1000 // 指数退避
          logger.warn({
            method,
            endpoint,
            attempt: attempts,
            delay: `${delay}ms`,
            error: error instanceof Error ? error.message : 'Unknown error'
          }, 'Retrying Medplum API call')
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        logger.error({
          method,
          endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        }, 'Medplum API call failed')

        captureException(error instanceof Error ? error : new Error(String(error)), {
          tags: { module: 'medplum-service' },
          extra: { method, endpoint, attempt: attempts }
        })

        throw error
      }
    }

    throw new Error('Max retry attempts reached')
  }

  // 搜索设备
  async searchDevices(params: {
    name?: string
    manufacturer?: string
    type?: string
    page?: number
    limit?: number
  }): Promise<any> {
    const cacheKey = generateCacheKey(CACHE_CONFIG.PREFIX.SEARCH, params)
    const cachedValue = await cacheService.get(cacheKey)
    if (cachedValue) {
      return cachedValue
    }
    
    const result = await this.apiCall('GET', '/Device', undefined, {
      _count: params.limit || 20,
      _page: params.page || 1,
      ...(params.name && { name: params.name }),
      ...(params.manufacturer && { manufacturer: params.manufacturer }),
      ...(params.type && { type: params.type })
    })
    
    await cacheService.set(cacheKey, result, CACHE_CONFIG.TTL.SEARCH)
    return result
  }

  // 搜索组织
  async searchOrganizations(params: {
    name?: string
    type?: string
    city?: string
    country?: string
    page?: number
    limit?: number
  }): Promise<any> {
    const cacheKey = generateCacheKey(CACHE_CONFIG.PREFIX.SEARCH, params)
    const cachedValue = await cacheService.get(cacheKey)
    if (cachedValue) {
      return cachedValue
    }
    
    const result = await this.apiCall('GET', '/Organization', undefined, {
      _count: params.limit || 20,
      _page: params.page || 1,
      ...(params.name && { name: params.name }),
      ...(params.type && { type: params.type }),
      ...(params.city && { city: params.city }),
      ...(params.country && { country: params.country })
    })
    
    await cacheService.set(cacheKey, result, CACHE_CONFIG.TTL.SEARCH)
    return result
  }

  // 搜索法规授权
  async searchRegulatoryAuthorizations(params: {
    device?: string
    status?: string
    authority?: string
    page?: number
    limit?: number
  }): Promise<any> {
    const cacheKey = generateCacheKey(CACHE_CONFIG.PREFIX.REGULATORY, params)
    const cachedValue = await cacheService.get(cacheKey)
    if (cachedValue) {
      return cachedValue
    }
    
    const result = await this.apiCall('GET', '/RegulatoryAuthorization', undefined, {
      _count: params.limit || 20,
      _page: params.page || 1,
      ...(params.device && { device: params.device }),
      ...(params.status && { status: params.status }),
      ...(params.authority && { authority: params.authority })
    })
    
    await cacheService.set(cacheKey, result, CACHE_CONFIG.TTL.REGULATORY)
    return result
  }

  // 获取单个资源
  async getResource<T>(resourceType: string, id: string): Promise<T> {
    const cacheKey = generateCacheKey(CACHE_CONFIG.PREFIX.DEVICE, resourceType, id)
    const cachedValue = await cacheService.get(cacheKey)
    if (cachedValue) {
      return cachedValue as T
    }
    
    const result = await this.apiCall('GET', `/${resourceType}/${id}`) as T
    
    await cacheService.set(cacheKey, result, CACHE_CONFIG.TTL.DEVICE)
    return result
  }

  // 创建资源
  async createResource<T>(resourceType: string, resource: any): Promise<T> {
    return this.apiCall('POST', `/${resourceType}`, resource)
  }

  // 更新资源
  async updateResource<T>(resourceType: string, id: string, resource: any): Promise<T> {
    return this.apiCall('PUT', `/${resourceType}/${id}`, resource)
  }

  // 删除资源
  async deleteResource(resourceType: string, id: string): Promise<void> {
    await this.apiCall('DELETE', `/${resourceType}/${id}`)
  }

  // 配置预警规则
  async createSubscription(subscription: any): Promise<any> {
    return this.apiCall('POST', '/Subscription', subscription)
  }

  // 获取审计日志
  async getAuditEvents(params: {
    user?: string
    action?: string
    resourceType?: string
    start?: string
    end?: string
    page?: number
    limit?: number
  }): Promise<any> {
    return this.apiCall('GET', '/AuditEvent', undefined, {
      _count: params.limit || 20,
      _page: params.page || 1,
      ...(params.user && { user: params.user }),
      ...(params.action && { action: params.action }),
      ...(params.resourceType && { resourceType: params.resourceType }),
      ...(params.start && { date: `ge${params.start}` }),
      ...(params.end && { date: `le${params.end}` })
    })
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string }> {
    try {
      await this.apiCall('GET', '/metadata')
      return { status: 'healthy' }
    } catch (error) {
      return { status: 'unhealthy' }
    }
  }

  // 清除认证状态
  clearAuth(): void {
    this.authToken = null
    this.tokenExpiry = null
    this.refreshToken = null
    logger.info('Medplum auth cleared')
  }
}

// 全局 Medplum 服务实例
let medplumService: MedplumService | null = null

// 创建 Medplum 服务实例
export function createMedplumService(): MedplumService {
  if (!medplumService) {
    const config: MedplumConfig = {
      baseUrl: process.env.MEDPLUM_BASE_URL || 'https://api.medplum.com',
      clientId: process.env.MEDPLUM_CLIENT_ID || '',
      clientSecret: process.env.MEDPLUM_CLIENT_SECRET || '',
      timeout: 30000,
      retryAttempts: 3
    }

    if (!config.clientId || !config.clientSecret) {
      logger.warn('Medplum API credentials not configured')
    }

    medplumService = new MedplumService(config)
  }

  return medplumService
}

// 导出默认实例
export const medplum = createMedplumService()

export default MedplumService

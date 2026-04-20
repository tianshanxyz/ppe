/**
 * API密钥管理系统 - 服务层
 *
 * B-002: API密钥管理
 */

import { createClient } from '@/lib/supabase/server'
import { createHash, randomBytes } from 'crypto'
import {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  UpdateApiKeyRequest,
  ValidateApiKeyResponse,
  ApiKeyUsageResponse,
  RateLimitRecord,
  DEFAULT_RATE_LIMIT,
  DEFAULT_USAGE_QUOTA,
  DEFAULT_PERMISSIONS,
  generateApiKey,
  generateApiKeyPrefix,
  checkPermission,
  checkEndpointAccess,
  checkIpAllowed,
} from './types'

// ============================================
// API密钥服务
// ============================================

export class ApiKeyService {
  /**
   * 创建新的API密钥
   */
  async createApiKey(
    userId: string,
    request: CreateApiKeyRequest
  ): Promise<CreateApiKeyResponse> {
    const supabase = await createClient()
    const now = new Date()

    try {
      // 生成密钥
      const fullKey = generateApiKey()
      const keyPrefix = generateApiKeyPrefix(fullKey)
      const keyHash = this.hashApiKey(fullKey)

      // 构建API密钥对象
      const apiKey: ApiKey = {
        id: crypto.randomUUID(),
        userId,
        name: request.name,
        description: request.description,
        keyPrefix,
        keyHash,
        permissions: request.permissions || DEFAULT_PERMISSIONS,
        allowedEndpoints: request.allowedEndpoints || ['*'],
        allowedIps: request.allowedIps,
        rateLimit: { ...DEFAULT_RATE_LIMIT, ...request.rateLimit },
        usageQuota: { ...DEFAULT_USAGE_QUOTA, ...request.usageQuota },
        status: 'active',
        expiresAt: request.expiresInDays
          ? new Date(now.getTime() + request.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined,
        usage: {
          totalRequests: 0,
          requestsThisMonth: 0,
          requestsToday: 0,
          dataTransferThisMonth: 0,
        },
        metadata: {
          createdAt: now.toISOString(),
          createdBy: userId,
        },
      }

      // 保存到数据库
      const { error } = await supabase.from('api_keys').insert({
        id: apiKey.id,
        user_id: apiKey.userId,
        name: apiKey.name,
        description: apiKey.description,
        key_prefix: apiKey.keyPrefix,
        key_hash: apiKey.keyHash,
        permissions: apiKey.permissions,
        allowed_endpoints: apiKey.allowedEndpoints,
        allowed_ips: apiKey.allowedIps,
        rate_limit: apiKey.rateLimit,
        usage_quota: apiKey.usageQuota,
        status: apiKey.status,
        expires_at: apiKey.expiresAt,
        usage: apiKey.usage,
        metadata: apiKey.metadata,
        created_at: apiKey.metadata.createdAt,
        updated_at: apiKey.metadata.createdAt,
      })

      if (error) throw error

      // 记录审计日志
      await this.logAuditEvent(apiKey.id, userId, 'created', {
        ip: 'unknown',
        userAgent: 'unknown',
      })

      return {
        success: true,
        apiKey: {
          ...apiKey,
          fullKey, // 只返回这一次
        },
      }
    } catch (error) {
      console.error('创建API密钥失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '创建API密钥失败',
      }
    }
  }

  /**
   * 列出用户的所有API密钥
   */
  async listApiKeys(userId: string): Promise<ListApiKeysResponse> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const keys: ApiKey[] = (data || []).map(this.transformDbToApiKey)

      return {
        success: true,
        keys,
        total: keys.length,
      }
    } catch (error) {
      console.error('获取API密钥列表失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取API密钥列表失败',
      }
    }
  }

  /**
   * 获取单个API密钥
   */
  async getApiKey(keyId: string, userId: string): Promise<ApiKey | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('id', keyId)
        .eq('user_id', userId)
        .single()

      if (error || !data) return null

      return this.transformDbToApiKey(data)
    } catch (error) {
      console.error('获取API密钥失败:', error)
      return null
    }
  }

  /**
   * 更新API密钥
   */
  async updateApiKey(
    keyId: string,
    userId: string,
    request: UpdateApiKeyRequest
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const now = new Date()

    try {
      const updates: any = {
        updated_at: now.toISOString(),
      }

      if (request.name !== undefined) updates.name = request.name
      if (request.description !== undefined) updates.description = request.description
      if (request.status !== undefined) updates.status = request.status
      if (request.permissions !== undefined) updates.permissions = request.permissions
      if (request.allowedEndpoints !== undefined) updates.allowed_endpoints = request.allowedEndpoints
      if (request.allowedIps !== undefined) updates.allowed_ips = request.allowedIps
      if (request.rateLimit !== undefined) {
        const { data: existing } = await supabase
          .from('api_keys')
          .select('rate_limit')
          .eq('id', keyId)
          .single()
        updates.rate_limit = { ...existing?.rate_limit, ...request.rateLimit }
      }
      if (request.usageQuota !== undefined) {
        const { data: existing } = await supabase
          .from('api_keys')
          .select('usage_quota')
          .eq('id', keyId)
          .single()
        updates.usage_quota = { ...existing?.usage_quota, ...request.usageQuota }
      }

      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', keyId)
        .eq('user_id', userId)

      if (error) throw error

      // 记录审计日志
      await this.logAuditEvent(keyId, userId, 'updated', {})

      return { success: true }
    } catch (error) {
      console.error('更新API密钥失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新API密钥失败',
      }
    }
  }

  /**
   * 撤销API密钥
   */
  async revokeApiKey(
    keyId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const now = new Date()

    try {
      const { error } = await supabase
        .from('api_keys')
        .update({
          status: 'revoked',
          metadata: {
            revoked_at: now.toISOString(),
            revoked_by: userId,
            revoke_reason: reason,
          },
          updated_at: now.toISOString(),
        })
        .eq('id', keyId)
        .eq('user_id', userId)

      if (error) throw error

      // 记录审计日志
      await this.logAuditEvent(keyId, userId, 'revoked', { errorMessage: reason })

      return { success: true }
    } catch (error) {
      console.error('撤销API密钥失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '撤销API密钥失败',
      }
    }
  }

  /**
   * 验证API密钥
   */
  async validateApiKey(
    apiKeyString: string,
    endpoint: string,
    clientIp: string
  ): Promise<ValidateApiKeyResponse> {
    // 验证密钥格式
    if (!apiKeyString.startsWith('pk_live_') || apiKeyString.length !== 40) {
      return {
        valid: false,
        error: 'Invalid API key format',
        errorCode: 'INVALID_KEY',
      }
    }

    const supabase = await createClient()
    const keyHash = this.hashApiKey(apiKeyString)

    try {
      // 查询密钥
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', keyHash)
        .single()

      if (error || !data) {
        return {
          valid: false,
          error: 'Invalid API key',
          errorCode: 'INVALID_KEY',
        }
      }

      const apiKey = this.transformDbToApiKey(data)

      // 检查状态
      if (apiKey.status === 'revoked') {
        return {
          valid: false,
          error: 'API key has been revoked',
          errorCode: 'REVOKED',
        }
      }

      if (apiKey.status === 'expired' ||
          (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date())) {
        return {
          valid: false,
          error: 'API key has expired',
          errorCode: 'EXPIRED',
        }
      }

      if (apiKey.status === 'inactive') {
        return {
          valid: false,
          error: 'API key is inactive',
          errorCode: 'REVOKED',
        }
      }

      // 检查IP白名单
      if (!checkIpAllowed(apiKey, clientIp)) {
        return {
          valid: false,
          error: 'IP address not allowed',
          errorCode: 'IP_NOT_ALLOWED',
        }
      }

      // 检查端点访问权限
      if (!checkEndpointAccess(apiKey, endpoint)) {
        return {
          valid: false,
          error: 'Endpoint not allowed',
          errorCode: 'INVALID_KEY',
        }
      }

      // 检查限流
      const rateLimitCheck = await this.checkRateLimit(apiKey.id, apiKey.rateLimit)
      if (!rateLimitCheck.allowed) {
        return {
          valid: false,
          error: `Rate limit exceeded: ${rateLimitCheck.window} limit reached`,
          errorCode: 'RATE_LIMITED',
        }
      }

      // 检查配额
      const quotaCheck = await this.checkQuota(apiKey)
      if (!quotaCheck.allowed) {
        return {
          valid: false,
          error: 'Monthly quota exceeded',
          errorCode: 'RATE_LIMITED',
        }
      }

      // 更新使用量
      await this.incrementUsage(apiKey.id, clientIp, endpoint)

      // 记录审计日志
      await this.logAuditEvent(apiKey.id, apiKey.userId, 'used', {
        ip: clientIp,
        endpoint,
      })

      return {
        valid: true,
        apiKey,
      }
    } catch (error) {
      console.error('验证API密钥失败:', error)
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        errorCode: 'INVALID_KEY',
      }
    }
  }

  /**
   * 获取API密钥使用情况
   */
  async getApiKeyUsage(keyId: string, userId: string): Promise<ApiKeyUsageResponse> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('usage, usage_quota, rate_limit')
        .eq('id', keyId)
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        return {
          success: false,
          error: 'API key not found',
        }
      }

      const usage = data.usage || {}
      const quota = data.usage_quota || DEFAULT_USAGE_QUOTA

      // 计算配额使用百分比
      const quotaPercentage = quota.maxRequestsPerMonth > 0
        ? ((usage.requests_this_month || 0) / quota.maxRequestsPerMonth) * 100
        : 0

      // 获取限流状态
      const rateLimitStatus = await this.getRateLimitStatus(keyId, data.rate_limit)

      return {
        success: true,
        usage: {
          totalRequests: usage.total_requests || 0,
          requestsThisMonth: usage.requests_this_month || 0,
          requestsToday: usage.requests_today || 0,
          dataTransferThisMonth: usage.data_transfer_this_month || 0,
          lastRequestAt: usage.last_request_at,
          lastRequestIp: usage.last_request_ip,
          lastRequestEndpoint: usage.last_request_endpoint,
          quotaPercentage,
          rateLimitStatus,
        },
      }
    } catch (error) {
      console.error('获取API密钥使用情况失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取使用情况失败',
      }
    }
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 哈希API密钥
   */
  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }

  /**
   * 转换数据库格式为API格式
   */
  private transformDbToApiKey(data: any): ApiKey {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      keyPrefix: data.key_prefix,
      keyHash: data.key_hash,
      permissions: data.permissions || DEFAULT_PERMISSIONS,
      allowedEndpoints: data.allowed_endpoints || ['*'],
      allowedIps: data.allowed_ips,
      rateLimit: { ...DEFAULT_RATE_LIMIT, ...data.rate_limit },
      usageQuota: { ...DEFAULT_USAGE_QUOTA, ...data.usage_quota },
      status: data.status,
      expiresAt: data.expires_at,
      usage: {
        totalRequests: data.usage?.total_requests || 0,
        requestsThisMonth: data.usage?.requests_this_month || 0,
        requestsToday: data.usage?.requests_today || 0,
        dataTransferThisMonth: data.usage?.data_transfer_this_month || 0,
        lastRequestAt: data.usage?.last_request_at,
        lastRequestIp: data.usage?.last_request_ip,
        lastRequestEndpoint: data.usage?.last_request_endpoint,
      },
      metadata: {
        createdAt: data.metadata?.created_at || data.created_at,
        createdBy: data.metadata?.created_by || data.user_id,
        lastUsedAt: data.metadata?.last_used_at,
        revokedAt: data.metadata?.revoked_at,
        revokedBy: data.metadata?.revoked_by,
        revokeReason: data.metadata?.revoke_reason,
      },
    }
  }

  /**
   * 检查限流
   */
  private async checkRateLimit(
    keyId: string,
    rateLimit: { requestsPerSecond: number; requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number }
  ): Promise<{ allowed: boolean; window?: string }> {
    const supabase = await createClient()
    const now = new Date()

    const windows = [
      { name: 'second', limit: rateLimit.requestsPerSecond, duration: 1000 },
      { name: 'minute', limit: rateLimit.requestsPerMinute, duration: 60 * 1000 },
      { name: 'hour', limit: rateLimit.requestsPerHour, duration: 60 * 60 * 1000 },
      { name: 'day', limit: rateLimit.requestsPerDay, duration: 24 * 60 * 60 * 1000 },
    ]

    for (const window of windows) {
      const windowStart = new Date(now.getTime() - window.duration)

      // 查询当前窗口的请求数
      const { count } = await supabase
        .from('api_key_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('key_id', keyId)
        .eq('window', window.name)
        .gte('window_start', windowStart.toISOString())

      if ((count || 0) >= window.limit) {
        return { allowed: false, window: window.name }
      }
    }

    return { allowed: true }
  }

  /**
   * 检查配额
   */
  private async checkQuota(apiKey: ApiKey): Promise<{ allowed: boolean }> {
    const usage = apiKey.usage
    const quota = apiKey.usageQuota

    if (quota.maxRequestsPerMonth > 0 && usage.requestsThisMonth >= quota.maxRequestsPerMonth) {
      return { allowed: false }
    }

    return { allowed: true }
  }

  /**
   * 增加使用量
   */
  private async incrementUsage(keyId: string, clientIp: string, endpoint: string): Promise<void> {
    const supabase = await createClient()
    const now = new Date()

    try {
      // 更新API密钥使用量
      await supabase.rpc('increment_api_key_usage', {
        p_key_id: keyId,
        p_client_ip: clientIp,
        p_endpoint: endpoint,
      })

      // 记录限流窗口
      const windows = ['second', 'minute', 'hour', 'day']
      for (const window of windows) {
        await supabase.from('api_key_rate_limits').upsert({
          key_id: keyId,
          window,
          window_start: now.toISOString(),
          request_count: 1,
        }, {
          onConflict: 'key_id,window,window_start',
        })
      }
    } catch (error) {
      console.error('增加使用量失败:', error)
    }
  }

  /**
   * 获取限流状态
   */
  private async getRateLimitStatus(
    keyId: string,
    rateLimit: { requestsPerSecond: number; requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number }
  ): Promise<any> {
    const supabase = await createClient()
    const now = new Date()

    const windows = [
      { name: 'perSecond', dbName: 'second', limit: rateLimit.requestsPerSecond, duration: 1000 },
      { name: 'perMinute', dbName: 'minute', limit: rateLimit.requestsPerMinute, duration: 60 * 1000 },
      { name: 'perHour', dbName: 'hour', limit: rateLimit.requestsPerHour, duration: 60 * 60 * 1000 },
      { name: 'perDay', dbName: 'day', limit: rateLimit.requestsPerDay, duration: 24 * 60 * 60 * 1000 },
    ]

    const status: any = {}

    for (const window of windows) {
      const windowStart = new Date(now.getTime() - window.duration)

      const { count } = await supabase
        .from('api_key_rate_limits')
        .select('*', { count: 'exact', head: true })
        .eq('key_id', keyId)
        .eq('window', window.dbName)
        .gte('window_start', windowStart.toISOString())

      const used = count || 0
      status[window.name] = {
        used,
        limit: window.limit,
        remaining: Math.max(0, window.limit - used),
      }
    }

    return status
  }

  /**
   * 记录审计日志
   */
  private async logAuditEvent(
    keyId: string,
    userId: string,
    action: 'created' | 'used' | 'updated' | 'revoked' | 'expired',
    details: any
  ): Promise<void> {
    const supabase = await createClient()

    try {
      await supabase.from('api_key_audit_logs').insert({
        key_id: keyId,
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('记录审计日志失败:', error)
    }
  }
}

// 导出单例
export const apiKeyService = new ApiKeyService()

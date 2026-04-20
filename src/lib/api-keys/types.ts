/**
 * API密钥管理系统 - 类型定义
 *
 * B-002: API密钥管理
 */

// ============================================
// API密钥基础类型
// ============================================

export interface ApiKey {
  id: string
  userId: string
  name: string
  description?: string

  // 密钥信息（创建时只返回一次完整密钥）
  keyPrefix: string // 前8位，用于显示
  keyHash: string // 存储的哈希值

  // 权限范围
  permissions: ApiKeyPermission[]
  allowedEndpoints: string[] // 允许的API端点，['*']表示全部
  allowedIps?: string[] // 允许的IP白名单

  // 使用限制
  rateLimit: RateLimitConfig
  usageQuota: UsageQuotaConfig

  // 状态
  status: 'active' | 'inactive' | 'revoked' | 'expired'
  expiresAt?: string

  // 使用统计
  usage: ApiKeyUsage

  // 元数据
  metadata: {
    createdAt: string
    createdBy: string
    lastUsedAt?: string
    revokedAt?: string
    revokedBy?: string
    revokeReason?: string
  }
}

export interface ApiKeyPermission {
  resource: string // 'companies', 'products', 'search', 'ai', etc.
  actions: ('read' | 'write' | 'delete' | '*')[]
}

export interface RateLimitConfig {
  requestsPerSecond: number
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstAllowance: number // 突发请求容忍量
}

export interface UsageQuotaConfig {
  maxRequestsPerMonth: number
  maxDataTransferPerMonth: number // MB
}

export interface ApiKeyUsage {
  totalRequests: number
  requestsThisMonth: number
  requestsToday: number
  dataTransferThisMonth: number // MB
  lastRequestAt?: string
  lastRequestIp?: string
  lastRequestEndpoint?: string
}

// ============================================
// API请求/响应类型
// ============================================

export interface CreateApiKeyRequest {
  name: string
  description?: string
  permissions?: ApiKeyPermission[]
  allowedEndpoints?: string[]
  allowedIps?: string[]
  rateLimit?: Partial<RateLimitConfig>
  usageQuota?: Partial<UsageQuotaConfig>
  expiresInDays?: number // 默认永不过期
}

export interface CreateApiKeyResponse {
  success: boolean
  apiKey?: ApiKey & { fullKey: string } // 只返回一次完整密钥
  error?: string
}

export interface ListApiKeysResponse {
  success: boolean
  keys?: ApiKey[]
  total?: number
  error?: string
}

export interface UpdateApiKeyRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive'
  permissions?: ApiKeyPermission[]
  allowedEndpoints?: string[]
  allowedIps?: string[]
  rateLimit?: Partial<RateLimitConfig>
  usageQuota?: Partial<UsageQuotaConfig>
}

export interface RevokeApiKeyRequest {
  reason?: string
}

export interface ValidateApiKeyResponse {
  valid: boolean
  apiKey?: ApiKey
  error?: string
  errorCode?: 'INVALID_KEY' | 'REVOKED' | 'EXPIRED' | 'IP_NOT_ALLOWED' | 'RATE_LIMITED'
}

export interface ApiKeyUsageResponse {
  success: boolean
  usage?: ApiKeyUsage & {
    quotaPercentage: number
    rateLimitStatus: {
      perSecond: { used: number; limit: number; remaining: number }
      perMinute: { used: number; limit: number; remaining: number }
      perHour: { used: number; limit: number; remaining: number }
      perDay: { used: number; limit: number; remaining: number }
    }
  }
  error?: string
}

// ============================================
// 限流记录类型
// ============================================

export interface RateLimitRecord {
  keyId: string
  window: 'second' | 'minute' | 'hour' | 'day'
  windowStart: string
  requestCount: number
}

// ============================================
// 审计日志类型
// ============================================

export interface ApiKeyAuditLog {
  id: string
  keyId: string
  userId: string
  action: 'created' | 'used' | 'updated' | 'revoked' | 'expired'
  details: {
    ip?: string
    userAgent?: string
    endpoint?: string
    requestMethod?: string
    responseStatus?: number
    errorMessage?: string
  }
  createdAt: string
}

// ============================================
// 默认配置
// ============================================

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  requestsPerSecond: 10,
  requestsPerMinute: 100,
  requestsPerHour: 1000,
  requestsPerDay: 10000,
  burstAllowance: 20,
}

export const DEFAULT_USAGE_QUOTA: UsageQuotaConfig = {
  maxRequestsPerMonth: 100000,
  maxDataTransferPerMonth: 1024, // 1GB
}

export const DEFAULT_PERMISSIONS: ApiKeyPermission[] = [
  { resource: 'companies', actions: ['read'] },
  { resource: 'products', actions: ['read'] },
  { resource: 'search', actions: ['read'] },
]

// ============================================
// 工具函数
// ============================================

export function generateApiKey(): string {
  // 生成格式: pk_live_xxxxxxxxxxxxxxxxxxxxxxxx (32位随机字符)
  const prefix = 'pk_live_'
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = prefix
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export function generateApiKeyPrefix(key: string): string {
  return key.slice(0, 12) // pk_live_xxxx
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return key
  return key.slice(0, 12) + '...' + key.slice(-4)
}

export function isValidApiKeyFormat(key: string): boolean {
  return /^pk_live_[A-Za-z0-9]{32}$/.test(key)
}

export function checkPermission(
  apiKey: ApiKey,
  resource: string,
  action: string
): boolean {
  // 检查是否有全局权限
  const globalPermission = apiKey.permissions.find(p => p.resource === '*')
  if (globalPermission?.actions.includes('*')) return true

  // 检查特定资源权限
  const resourcePermission = apiKey.permissions.find(p => p.resource === resource)
  if (!resourcePermission) return false

  if (resourcePermission.actions.includes('*')) return true
  return resourcePermission.actions.includes(action as any)
}

export function checkEndpointAccess(apiKey: ApiKey, endpoint: string): boolean {
  if (apiKey.allowedEndpoints.includes('*')) return true
  return apiKey.allowedEndpoints.some(pattern => {
    // 支持通配符匹配，如 /api/companies/*
    if (pattern.endsWith('/*')) {
      return endpoint.startsWith(pattern.slice(0, -2))
    }
    return pattern === endpoint
  })
}

export function checkIpAllowed(apiKey: ApiKey, ip: string): boolean {
  if (!apiKey.allowedIps || apiKey.allowedIps.length === 0) return true
  return apiKey.allowedIps.includes(ip)
}

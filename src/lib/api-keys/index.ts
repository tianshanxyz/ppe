/**
 * API密钥管理系统 - 主入口
 *
 * B-002: API密钥管理
 */

// 导出类型
export {
  ApiKey,
  ApiKeyPermission,
  RateLimitConfig,
  UsageQuotaConfig,
  ApiKeyUsage,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  UpdateApiKeyRequest,
  RevokeApiKeyRequest,
  ValidateApiKeyResponse,
  ApiKeyUsageResponse,
  ApiKeyAuditLog,
  DEFAULT_RATE_LIMIT,
  DEFAULT_USAGE_QUOTA,
  DEFAULT_PERMISSIONS,
  generateApiKey,
  generateApiKeyPrefix,
  maskApiKey,
  isValidApiKeyFormat,
  checkPermission,
  checkEndpointAccess,
  checkIpAllowed,
} from './types'

// 导出服务
export { ApiKeyService, apiKeyService } from './service'

// 导出中间件
export {
  extractApiKey,
  getClientIp,
  withApiKeyAuth,
  withApiKeyPermission,
  withApiKeyAuthAndPermission,
} from './middleware'

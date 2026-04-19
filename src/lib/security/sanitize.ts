/**
 * 输入验证与安全工具函数
 * 用于防止 SQL 注入、XSS 等安全问题
 */

/**
 * 验证输入类型
 */
function isString(input: unknown): input is string {
  return typeof input === 'string'
}

/**
 * 清理用户输入，防止 SQL 注入和 XSS
 */
export function sanitizeInput(input: string): string {
  if (!isString(input)) {
    return ''
  }

  let sanitized = input.trim()

  // 移除危险字符
  sanitized = sanitized
    .replace(/[;'"\\]/g, '') // 移除引号和分号
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // 移除 script 标签
    .replace(/javascript:/gi, '') // 移除 javascript: 协议
    .replace(/on\w+\s*=/gi, '') // 移除 onclick= 等事件处理器

  return sanitized
}

/**
 * 验证输入长度
 */
export function validateInputLength(
  input: string,
  minLength: number = 0,
  maxLength: number = 1000
): boolean {
  if (!isString(input)) {
    return false
  }
  const length = input.length
  return length >= minLength && length <= maxLength
}

/**
 * 验证搜索查询
 */
export function validateSearchQuery(query: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  if (!query || query.trim() === '') {
    return { valid: false, sanitized: '', error: '查询不能为空' }
  }

  if (!validateInputLength(query, 1, 200)) {
    return { valid: false, sanitized: '', error: '查询长度必须在 1-200 字符之间' }
  }

  const sanitized = sanitizeInput(query)

  return { valid: true, sanitized }
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证 ID 格式 (UUID 或数字)
 */
export function validateId(id: string): boolean {
  if (!isString(id)) {
    return false
  }
  
  // UUID 格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  // 数字格式
  const numericRegex = /^\d+$/
  
  return uuidRegex.test(id) || numericRegex.test(id)
}

/**
 * 验证分页参数
 */
export function validatePagination(
  page?: string,
  limit?: string
): {
  valid: boolean
  page: number
  limit: number
  error?: string
} {
  const pageNum = page ? parseInt(page, 10) : 1
  const limitNum = limit ? parseInt(limit, 10) : 20

  if (isNaN(pageNum) || pageNum < 1) {
    return { valid: false, page: 1, limit: 20, error: '页码必须大于等于 1' }
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { valid: false, page: 1, limit: 20, error: '每页数量必须在 1-100 之间' }
  }

  return { valid: true, page: pageNum, limit: limitNum }
}

/**
 * 验证枚举值
 */
export function validateEnum<T extends string>(
  value: string | null,
  allowedValues: T[],
  defaultValue: T
): { valid: boolean; value: T; error?: string } {
  if (!value) {
    return { valid: true, value: defaultValue }
  }

  if (allowedValues.includes(value as T)) {
    return { valid: true, value: value as T }
  }

  return {
    valid: false,
    value: defaultValue,
    error: `值必须是以下之一：${allowedValues.join(', ')}`
  }
}

/**
 * 验证数组参数
 */
export function validateArrayParam(
  param: string | null | undefined,
  allowedValues?: string[]
): string[] {
  if (!param) {
    return []
  }

  const items = param.split(',').map(item => item.trim()).filter(Boolean)

  if (allowedValues) {
    return items.filter(item => allowedValues.includes(item))
  }

  return items
}

/**
 * 验证请求体大小
 */
export function validateBodySize(body: unknown, maxSize: number = 1024 * 1024): boolean {
  const size = JSON.stringify(body).length
  return size <= maxSize
}

/**
 * 清理 HTML 标签 (用于富文本)
 */
export function sanitizeHtml(html: string): string {
  if (!isString(html)) {
    return ''
  }

  // 移除所有 script 标签和事件处理器
  let sanitized = html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]*/gi, '')

  return sanitized
}

/**
 * 验证 IP 地址格式
 */
export function validateIpAddress(ip: string): boolean {
  if (!isString(ip)) {
    return false
  }

  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  // IPv6 (简化版)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    return parts.every(part => {
      const num = parseInt(part, 10)
      return num >= 0 && num <= 255
    })
  }

  return ipv6Regex.test(ip)
}

/**
 * 验证 URL 格式
 */
export function validateUrl(url: string): boolean {
  if (!isString(url)) {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证 API 请求
 */
export interface ApiValidationResult<T = any> {
  valid: boolean
  data?: T
  error?: string
  status?: number
}

/**
 * 通用 API 请求验证器
 */
export function validateApiRequest(
  params: Record<string, any>,
  schema: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'array'
      required?: boolean
      minLength?: number
      maxLength?: number
      min?: number
      max?: number
      pattern?: RegExp
      allowedValues?: unknown[]
      default?: unknown
    }
  }
): ApiValidationResult<Record<string, any>> {
  const result: Record<string, any> = {}
  const errors: string[] = []

  for (const [key, rules] of Object.entries(schema)) {
    const value = params[key]

    // 检查必填字段
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${key} 是必填字段`)
      continue
    }

    // 处理默认值
    if (value === undefined || value === null) {
      if (rules.default !== undefined) {
        result[key] = rules.default
      }
      continue
    }

    // 类型检查
    if (rules.type === 'string') {
      if (typeof value !== 'string') {
        errors.push(`${key} 必须是字符串类型`)
        continue
      }

      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${key} 长度不能小于 ${rules.minLength}`)
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${key} 长度不能大于 ${rules.maxLength}`)
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} 格式不正确`)
      }

      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors.push(`${key} 必须是以下值之一：${rules.allowedValues.join(', ')}`)
      }

      result[key] = value
    } else if (rules.type === 'number') {
      const num = typeof value === 'string' ? parseFloat(value) : value

      if (typeof num !== 'number' || isNaN(num)) {
        errors.push(`${key} 必须是数字类型`)
        continue
      }

      if (rules.min !== undefined && num < rules.min) {
        errors.push(`${key} 不能小于 ${rules.min}`)
      }

      if (rules.max !== undefined && num > rules.max) {
        errors.push(`${key} 不能大于 ${rules.max}`)
      }

      result[key] = num
    } else if (rules.type === 'boolean') {
      if (typeof value !== 'boolean') {
        errors.push(`${key} 必须是布尔类型`)
        continue
      }

      result[key] = value
    } else if (rules.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(`${key} 必须是数组类型`)
        continue
      }

      result[key] = value
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; '),
      status: 400
    }
  }

  return {
    valid: true,
    data: result
  }
}

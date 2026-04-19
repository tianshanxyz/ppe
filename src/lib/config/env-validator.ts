/**
 * 环境变量验证器
 * 
 * 在应用启动时验证所有必需的环境变量是否已正确配置
 * 防止因环境变量缺失导致的运行时错误
 */

interface EnvVarConfig {
  name: string
  required: boolean
  pattern?: RegExp
  example?: string
}

// 环境变量配置清单
const ENV_VAR_CONFIGS: EnvVarConfig[] = [
  // Supabase 配置
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    pattern: /^https:\/\/[a-z]+\.supabase\.co$/,
    example: 'https://your-project.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    pattern: /^[a-zA-Z0-9._-]+$/,
    example: 'your-anon-key',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    pattern: /^[a-zA-Z0-9._-]+$/,
    example: 'your-service-role-key',
  },

  // Medplum 配置
  {
    name: 'MEDPLUM_BASE_URL',
    required: false,
    pattern: /^https?:\/\/.+/i,
    example: 'https://api.medplum.com',
  },
  {
    name: 'MEDPLUM_CLIENT_ID',
    required: false,
    example: 'your-medplum-client-id',
  },
  {
    name: 'MEDPLUM_CLIENT_SECRET',
    required: false,
    example: 'your-medplum-client-secret',
  },

  // AI 服务配置
  {
    name: 'VOLCANO_API_KEY',
    required: false,
    example: 'your-volcano-api-key',
  },
  {
    name: 'ALIBABA_BAILIAN_API_KEY',
    required: false,
    example: 'your-alibaba-api-key',
  },

  // 翻译服务配置
  {
    name: 'BAIDU_TRANSLATE_APP_ID',
    required: false,
    example: 'your-baidu-app-id',
  },
  {
    name: 'BAIDU_TRANSLATE_SECRET_KEY',
    required: false,
    example: 'your-baidu-secret-key',
  },

  // 搜索服务配置
  {
    name: 'BAIDU_AI_SEARCH_KEY',
    required: false,
    example: 'your-baidu-ai-search-key',
  },

  // 监控配置
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    pattern: /^https:\/\/[a-f0-9]+@sentry\.io\/\d+$/,
    example: 'https://your-key@sentry.io/your-project-id',
  },

  // 应用配置
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: false,
    pattern: /^https?:\/\/.+/i,
    example: 'https://mdlooker.com',
  },
]

// 验证结果
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
}

/**
 * 验证单个环境变量
 */
function validateEnvVar(config: EnvVarConfig): {
  valid: boolean
  error?: string
  warning?: string
} {
  const value = process.env[config.name]

  // 检查必需的环境变量
  if (config.required && !value) {
    return {
      valid: false,
      error: `必需的环境变量 ${config.name} 未设置。示例：${config.example}`,
    }
  }

  // 如果变量未设置但不是必需的，跳过
  if (!value) {
    return { valid: true }
  }

  // 检查格式（如果有 pattern）
  if (config.pattern && !config.pattern.test(value)) {
    return {
      valid: false,
      error: `环境变量 ${config.name} 格式不正确。应为：${config.pattern.toString()}`,
    }
  }

  // 检查是否为示例值
  if (config.example && value === config.example) {
    return {
      valid: true,
      warning: `环境变量 ${config.name} 仍为示例值，请替换为实际值`,
    }
  }

  // 检查常见错误模式
  if (value.includes('your-') || value.includes('YOUR_')) {
    return {
      valid: true,
      warning: `环境变量 ${config.name} 似乎仍为占位符，请替换为实际值`,
    }
  }

  return { valid: true }
}

/**
 * 验证所有环境变量
 */
export function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  }

  // 验证每个环境变量
  ENV_VAR_CONFIGS.forEach((config) => {
    const validation = validateEnvVar(config)

    if (!validation.valid && validation.error) {
      result.valid = false
      result.errors.push(validation.error)
    } else if (validation.warning) {
      result.warnings.push(validation.warning)
    }
  })

  // 添加信息性消息
  if (process.env.NODE_ENV === 'development') {
    result.info.push('运行在开发环境')
  } else if (process.env.NODE_ENV === 'production') {
    result.info.push('运行在生产环境')
  }

  if (process.env.VERCEL) {
    result.info.push('部署在 Vercel')
  }

  return result
}

/**
 * 验证环境变量并记录结果
 */
export function validateAndLog(): boolean {
  const result = validateEnvironment()

  // 在构建时跳过错误检查（Vercel 构建期间环境变量可能未设置）
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.VERCEL_ENV === 'production'

  // 记录错误
  if (result.errors.length > 0) {
    if (isBuildPhase) {
      // 构建时只记录警告，不阻止构建
      console.warn('\n⚠️  环境变量未配置（构建阶段跳过）:\n')
      result.errors.forEach((error) => {
        console.warn(`  • ${error}`)
      })
      console.warn('\n请在 Vercel 控制台配置这些环境变量\n')
    } else {
      console.error('\n❌ 环境变量配置错误:\n')
      result.errors.forEach((error) => {
        console.error(`  • ${error}`)
      })
      console.error('\n请检查 .env.production 或 .env.local 文件\n')
    }
  }

  // 记录警告
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  环境变量警告:\n')
    result.warnings.forEach((warning) => {
      console.warn(`  • ${warning}`)
    })
    console.warn('\n')
  }

  // 记录信息
  if (result.info.length > 0) {
    console.info('\nℹ️  环境信息:\n')
    result.info.forEach((info) => {
      console.info(`  • ${info}`)
    })
    console.info('\n')
  }

  // 构建时始终返回 true，不阻止构建
  return isBuildPhase ? true : result.valid
}

/**
 * 中间件：在请求时验证环境变量（仅开发环境）
 */
export function withEnvValidation<T extends (...args: unknown[]) => any>(handler: T): T {
  return ((...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      const result = validateEnvironment()
      if (!result.valid) {
        console.error('环境变量验证失败，应用可能无法正常工作')
      }
    }
    return handler(...args)
  }) as T
}

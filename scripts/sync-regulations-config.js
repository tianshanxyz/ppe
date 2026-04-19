/**
 * 法规数据智能同步配置
 */

// 同步阶段配置
const SYNC_PHASES = {
  mvp: {
    phase: 'mvp',
    maxRecords: 5000,
    yearRange: 5,
    batchSize: 100,
    delayMs: 1000,
    incremental: true,
    description: 'MVP阶段：快速同步核心法规'
  },
  growth: {
    phase: 'growth',
    maxRecords: 50000,
    yearRange: 10,
    batchSize: 500,
    delayMs: 500,
    incremental: true,
    description: '增长阶段：同步更多法规数据'
  },
  full: {
    phase: 'full',
    maxRecords: 200000,
    yearRange: 20,
    batchSize: 1000,
    delayMs: 200,
    incremental: true,
    description: '完整阶段：同步全部法规数据'
  }
}

// 数据源配置
const DATA_SOURCES = {
  FDA: {
    name: 'FDA',
    url: 'https://www.fda.gov',
    updateFrequency: 'weekly', // 每周更新
    priority: 1
  },
  'EU MDCG': {
    name: 'EU MDCG',
    url: 'https://ec.europa.eu',
    updateFrequency: 'monthly', // 每月更新
    priority: 2
  },
  NMPA: {
    name: 'NMPA',
    url: 'https://www.nmpa.gov.cn',
    updateFrequency: 'monthly', // 每月更新
    priority: 3
  },
  'Other Markets': {
    name: 'Other Markets',
    url: 'various',
    updateFrequency: 'monthly', // 每月更新
    priority: 4
  }
}

// 智能同步配置
const INCREMENTAL_SYNC_CONFIG = {
  enabled: true,
  checkInterval: 24 * 60 * 60 * 1000, // 24小时
  maxRetries: 3,
  retryDelay: 5000, // 5秒
  timeout: 300000, // 5分钟
  batchSize: 100,
  delayBetweenBatches: 1000 // 1秒
}

// 数据质量检查配置
const QUALITY_CHECK_CONFIG = {
  enabled: true,
  checkInterval: 24 * 60 * 60 * 1000, // 每天
  requiredFields: ['title', 'jurisdiction', 'effective_date'],
  minCompleteness: 0.9, // 90%完整度
  maxDuplicateRate: 0.05, // 5%重复率
  maxErrorRate: 0.01 // 1%错误率
}

module.exports = {
  SYNC_PHASES,
  DATA_SOURCES,
  INCREMENTAL_SYNC_CONFIG,
  QUALITY_CHECK_CONFIG
}

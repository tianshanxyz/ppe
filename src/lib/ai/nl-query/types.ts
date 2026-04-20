/**
 * 自然语言查询系统 - 类型定义
 * 
 * A-003: AI助手升级（自然语言查询）
 */

// ============================================
// 查询意图类型
// ============================================

export type QueryIntentType = 
  | 'search'           // 搜索查询
  | 'compare'          // 对比查询
  | 'analyze'          // 分析查询
  | 'recommend'        // 推荐查询
  | 'explain'          // 解释查询
  | 'status_check'     // 状态检查
  | 'trend_analysis'   // 趋势分析
  | 'unknown'          // 未知意图

export interface QueryIntent {
  type: QueryIntentType
  confidence: number  // 0-1
  subType?: string    // 子类型，如 search:product, search:company
}

// ============================================
// 实体类型
// ============================================

export type EntityType = 'product' | 'company' | 'regulation' | 'certification' | 'market'

export interface ExtractedEntity {
  type: EntityType
  value: string
  normalizedValue?: string
  confidence: number
  position?: { start: number; end: number }
}

// ============================================
// 查询条件/槽位
// ============================================

export interface QueryCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between'
  value: unknown
  logic?: 'and' | 'or'
}

export interface QuerySlot {
  name: string
  value: unknown
  required: boolean
  filled: boolean
}

// ============================================
// 排序和分页
// ============================================

export interface QuerySort {
  field: string
  direction: 'asc' | 'desc'
}

export interface QueryPagination {
  page: number
  pageSize: number
  offset: number
}

// ============================================
// 自然语言解析结果
// ============================================

export interface NLParseResult {
  originalQuery: string
  intent: QueryIntent
  entities: ExtractedEntity[]
  conditions: QueryCondition[]
  slots: QuerySlot[]
  sort?: QuerySort
  pagination: QueryPagination
  timeRange?: { start?: Date; end?: Date }
  confidence: number
}

// ============================================
// 结构化查询
// ============================================

export interface StructuredQuery {
  entityType: EntityType
  filters: QueryCondition[]
  sort?: QuerySort
  pagination: QueryPagination
  includeRelated?: boolean
  fields?: string[]
}

// ============================================
// 查询执行结果
// ============================================

export interface QueryExecutionResult<T = unknown> {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  executionTimeMs: number
  error?: string
}

// ============================================
// AI响应
// ============================================

export interface AIQueryResponse {
  success: boolean
  answer: string
  structuredQuery?: StructuredQuery
  results?: QueryExecutionResult
  suggestions?: string[]
  relatedQuestions?: string[]
  confidence: number
  processingTimeMs: number
  context?: {
    previousQueries?: string[]
    currentEntity?: EntityType
    filters?: Record<string, unknown>
  }
}

// ============================================
// 对话上下文
// ============================================

export interface ConversationContext {
  sessionId: string
  userId?: string
  history: ConversationMessage[]
  currentEntity?: EntityType
  accumulatedFilters?: QueryCondition[]
  lastQuery?: string
  lastResults?: unknown[]
  createdAt: Date
  updatedAt: Date
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    intent?: QueryIntentType
    entities?: ExtractedEntity[]
    results?: unknown[]
  }
}

// ============================================
// 提示词模板
// ============================================

export interface PromptTemplate {
  name: string
  template: string
  variables: string[]
  examples?: { input: string; output: string }[]
}

// ============================================
// 性能指标
// ============================================

export interface NLQueryMetrics {
  totalQueries: number
  avgParseTimeMs: number
  avgExecutionTimeMs: number
  avgTotalTimeMs: number
  intentAccuracy: number
  entityAccuracy: number
  userSatisfaction: number
}

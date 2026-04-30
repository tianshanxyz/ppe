/**
 * 自然语言查询系统 - 主入口
 *
 * A-003: AI助手升级（自然语言查询）
 */

export * from './types'
export * from './intent-classifier'
export * from './query-executor'
export * from './response-generator'

import { intentClassifier } from './intent-classifier'
import { queryExecutor } from './query-executor'
import { responseGenerator } from './response-generator'
import {
  NLParseResult,
  StructuredQuery,
  AIQueryResponse,
  ConversationContext,
  QueryIntentType,
  EntityType,
} from './types'

// ============================================
// NL查询引擎
// ============================================

export interface NLQueryOptions {
  useAI?: boolean
  context?: ConversationContext
  maxResults?: number
}

export class NLQueryEngine {
  /**
   * 处理自然语言查询
   */
  async query(userQuery: string, options: NLQueryOptions = {}): Promise<AIQueryResponse> {
    const startTime = Date.now()
    const { useAI = false, context, maxResults = 20 } = options

    try {
      // 1. 解析查询
      const parseResult = intentClassifier.parse(userQuery)

      // 2. 转换为结构化查询
      const structuredQuery = this.buildStructuredQuery(parseResult, maxResults)

      // 3. 执行查询
      const executionResult = await queryExecutor.execute(structuredQuery)

      // 4. 生成响应
      let response: AIQueryResponse

      if (useAI) {
        // 使用AI生成高级响应
        response = await this.generateAIResponse(
          parseResult,
          structuredQuery,
          executionResult,
          context
        )
      } else {
        // 使用模板生成简单响应
        response = responseGenerator.generateSimpleResponse(
          parseResult.intent.type,
          structuredQuery.entityType,
          executionResult,
          userQuery
        )
      }

      // 5. 更新上下文
      if (context) {
        this.updateContext(context, userQuery, response, parseResult)
      }

      response.processingTimeMs = Date.now() - startTime
      return response
    } catch (error) {
      return {
        success: false,
        answer: `查询处理失败：${error instanceof Error ? error.message : '未知错误'}`,
        confidence: 0,
        processingTimeMs: Date.now() - startTime,
      }
    }
  }

  /**
   * 构建结构化查询
   */
  private buildStructuredQuery(parseResult: NLParseResult, maxResults: number): StructuredQuery {
    // 确定实体类型
    let entityType: EntityType = 'product'

    // 从意图子类型推断
    if (parseResult.intent.subType === 'company') {
      entityType = 'company'
    }

    // 从实体推断
    const entityTypes = parseResult.entities.map((e) => e.type)
    if (entityTypes.includes('company')) {
      entityType = 'company'
    } else if (entityTypes.includes('product')) {
      entityType = 'product'
    }

    return {
      entityType,
      filters: parseResult.conditions,
      sort: parseResult.sort,
      pagination: {
        page: 1,
        pageSize: maxResults,
        offset: 0,
      },
    }
  }

  /**
   * 生成AI响应
   */
  private async generateAIResponse(
    parseResult: NLParseResult,
    structuredQuery: StructuredQuery,
    executionResult: ReturnType<typeof queryExecutor.execute> extends Promise<infer T> ? T : never,
    context?: ConversationContext
  ): Promise<AIQueryResponse> {
    // 构建提示词
    const prompt = responseGenerator.buildPrompt(
      parseResult.intent.type,
      parseResult.originalQuery,
      executionResult,
      structuredQuery,
      context
    )

    // 调用AI API
    try {
      // 使用环境变量或默认当前域名
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
        (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
      
      const response = await fetch(`${baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error('AI API error')
      }

      const data = await response.json()

      return {
        success: true,
        answer: data.message || data.answer,
        structuredQuery,
        results: executionResult,
        confidence: parseResult.confidence,
        processingTimeMs: 0, // 会在外层更新
      }
    } catch (error) {
      // AI失败时回退到简单响应
      return responseGenerator.generateSimpleResponse(
        parseResult.intent.type,
        structuredQuery.entityType,
        executionResult,
        parseResult.originalQuery
      )
    }
  }

  /**
   * 更新对话上下文
   */
  private updateContext(
    context: ConversationContext,
    userQuery: string,
    response: AIQueryResponse,
    parseResult: NLParseResult
  ): void {
    // 添加用户消息
    context.history.push({
      role: 'user',
      content: userQuery,
      timestamp: new Date(),
      metadata: {
        intent: parseResult.intent.type,
        entities: parseResult.entities,
      },
    })

    // 添加助手消息
    context.history.push({
      role: 'assistant',
      content: response.answer,
      timestamp: new Date(),
      metadata: {
        results: response.results?.data,
      },
    })

    // 更新上下文信息
    context.lastQuery = userQuery
    context.lastResults = response.results?.data
    context.currentEntity = response.structuredQuery?.entityType
    context.updatedAt = new Date()

    // 限制历史长度
    if (context.history.length > 20) {
      context.history = context.history.slice(-20)
    }
  }

  /**
   * 创建新会话
   */
  createSession(userId?: string): ConversationContext {
    return {
      sessionId: this.generateSessionId(),
      userId,
      history: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 导出单例
export const nlQueryEngine = new NLQueryEngine()

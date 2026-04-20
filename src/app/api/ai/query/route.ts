/**
 * AI自然语言查询 API
 *
 * POST /api/ai/query
 * 支持自然语言查询，返回结构化结果和自然语言回答
 *
 * A-003: AI助手升级（自然语言查询）
 */

import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'
import { nlQueryEngine, ConversationContext } from '@/lib/ai/nl-query'

// 简单的会话存储（生产环境应使用Redis）
const sessionStore = new Map<string, ConversationContext>()

interface QueryRequest {
  query: string
  sessionId?: string
  useAI?: boolean
  maxResults?: number
}

export async function POST(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const body: QueryRequest = await request.json()
      const { query, sessionId, useAI = false, maxResults = 20 } = body

      // 验证请求
      if (!query || query.trim().length < 2) {
        return NextResponse.json(
          { error: '查询内容不能为空，至少需要2个字符' },
          { status: 400 }
        )
      }

      // 获取或创建会话
      let context: ConversationContext | undefined
      if (sessionId) {
        context = sessionStore.get(sessionId)
      }

      if (!context) {
        context = nlQueryEngine.createSession()
        sessionStore.set(context.sessionId, context)
      }

      // 执行查询
      const result = await nlQueryEngine.query(query, {
        useAI,
        context,
        maxResults,
      })

      // 更新会话存储
      sessionStore.set(context.sessionId, context)

      return NextResponse.json({
        success: result.success,
        answer: result.answer,
        sessionId: context.sessionId,
        results: result.results,
        suggestions: result.suggestions,
        relatedQuestions: result.relatedQuestions,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs,
      })
    } catch (error) {
      console.error('AI query error:', error)
      return NextResponse.json(
        {
          success: false,
          error: '查询处理失败',
          message: error instanceof Error ? error.message : '未知错误',
        },
        { status: 500 }
      )
    }
  }, request)
}

/**
 * GET /api/ai/query?sessionId=xxx
 * 获取会话历史
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const sessionId = request.nextUrl.searchParams.get('sessionId')

      if (!sessionId) {
        return NextResponse.json(
          { error: '缺少sessionId参数' },
          { status: 400 }
        )
      }

      const context = sessionStore.get(sessionId)

      if (!context) {
        return NextResponse.json(
          { error: '会话不存在或已过期' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        sessionId: context.sessionId,
        history: context.history,
        currentEntity: context.currentEntity,
        createdAt: context.createdAt,
        updatedAt: context.updatedAt,
      })
    } catch (error) {
      console.error('Get session error:', error)
      return NextResponse.json(
        { error: '获取会话失败' },
        { status: 500 }
      )
    }
  }, request)
}

/**
 * DELETE /api/ai/query?sessionId=xxx
 * 删除会话
 */
export async function DELETE(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const sessionId = request.nextUrl.searchParams.get('sessionId')

      if (!sessionId) {
        return NextResponse.json(
          { error: '缺少sessionId参数' },
          { status: 400 }
        )
      }

      const deleted = sessionStore.delete(sessionId)

      return NextResponse.json({
        success: deleted,
        message: deleted ? '会话已删除' : '会话不存在',
      })
    } catch (error) {
      console.error('Delete session error:', error)
      return NextResponse.json(
        { error: '删除会话失败' },
        { status: 500 }
      )
    }
  }, request)
}

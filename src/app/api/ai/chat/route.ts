import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'

// 火山引擎方舟 API 配置
const API_KEY = process.env.VOLCENGINE_ARK_API_KEY
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

interface ConversationMessage {
  role: string
  content: string
}

interface AIUsage {
  input_tokens?: number
  output_tokens?: number
  total_tokens?: number
  [key: string]: number | string | undefined
}

export async function POST(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      // 检查 API KEY
      if (!API_KEY) {
        console.warn('VOLCENGINE_ARK_API_KEY not configured, using fallback response')
        return NextResponse.json({
          success: true,
          message: generateFallbackResponse(new Error('AI service not configured')),
          model: 'fallback',
          usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
        })
      }

      const body = await request.json()
      const { message, conversationHistory = [], context = '' } = body

    // 构建提示词
    const systemPrompt = `你是 MDLooker 的 AI 智能助手，专门为用户提供医疗器械法规合规咨询服务。
你的职责：
1. 解答关于全球医疗器械法规的问题（FDA、CE、NMPA、PMDA 等）
2. 提供市场准入指导和建议
3. 帮助理解合规要求和流程
4. 推荐相关的法规和文档

回答要求：
- 专业、准确、条理清晰
- 如果不确定，请说明并建议用户咨询专业顾问
- 优先提供实用、可操作的建议
- 使用中文回答，除非用户要求使用其他语言`

    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: ConversationMessage) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    // 调用火山引擎方舟 API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'doubao-pro-4k-241215',
        messages,
        parameters: {
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.8,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('AI API error:', errorData)
      throw new Error(errorData.message || 'AI service unavailable')
    }

    const result = await response.json()
    
    // 提取 AI 回复
    const aiResponse = result.choices?.[0]?.message?.content || '抱歉，我无法回答这个问题。'

    return NextResponse.json({
      success: true,
      message: aiResponse,
      model: 'doubao-pro-4k-241215',
      usage: result.usage as AIUsage,
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
        fallback: true,
        message: generateFallbackResponse(error),
      },
      { status: error instanceof Error && error.message.includes('API') ? 503 : 500 }
    )
  }
}, {
  maxRequests: 20,
  windowInSeconds: 60,
  enableAuthBoost: true,
  authBoostMultiplier: 3,
})(request)
}

// 备用回复（当 AI 服务不可用时）
function generateFallbackResponse(error: unknown): string {
  const fallbackResponses = [
    `您好！AI 服务暂时不可用（${error instanceof Error ? error.message : '未知错误'}）。

作为替代，我可以为您提供一些基础指导：

**常见法规咨询主题：**
1. FDA 510(k) 注册流程
2. CE MDR 认证要求
3. 中国 NMPA 注册程序
4. 临床试验要求
5. 质量管理体系（GMP/ISO 13485）

建议您：
- 访问我们的法规数据库获取详细信息
- 联系专业法规顾问获取个性化建议
- 查看相关市场的官方指南文档

请稍后再试，AI 服务将很快恢复。`,
  ]

  return fallbackResponses[0]
}

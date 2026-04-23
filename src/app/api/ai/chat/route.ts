import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/middleware/rateLimit'

// 火山引擎方舟 API 配置
const API_KEY = process.env.VOLCENGINE_ARK_API_KEY
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

// 模型选择配置
const AI_MODELS = {
  chat: 'doubao-pro-4k-241215',
  document: 'doubao-lite-32k-240828',
  analysis: 'doubao-pro-32k-241215',
}

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

// 场景化系统提示词
const SYSTEM_PROMPTS: Record<string, string> = {
  default: `You are MDLooker AI, a professional PPE (Personal Protective Equipment) compliance consultant.
Your expertise covers global PPE regulations including CE/UKCA marking, FDA regulations, NMPA registration, and other international standards.

Your responsibilities:
1. Answer questions about PPE regulations and compliance requirements
2. Provide market access guidance for different countries/regions
3. Help users understand certification processes and timelines
4. Recommend relevant documents, standards, and testing requirements
5. Assist with product classification and risk assessment

Response requirements:
- Be professional, accurate, and well-structured
- Use English by default; respond in Chinese only when user asks in Chinese
- If uncertain, clearly state it and recommend consulting professional advisors
- Prioritize practical, actionable advice
- Include specific regulation references when possible
- Keep responses concise but comprehensive`,

  document: `You are MDLooker AI Document Assistant, specialized in PPE compliance document generation and review.
Your expertise covers technical file preparation, DoC (Declaration of Conformity) drafting, risk assessment reports, and other compliance documentation.

Your responsibilities:
1. Generate compliance document drafts based on user requirements
2. Review and suggest improvements for existing documents
3. Explain document requirements for different markets
4. Help structure technical files according to regulations
5. Provide templates and best practices for documentation

Response requirements:
- Generate structured, regulation-compliant document content
- Use English by default; respond in Chinese only when user asks in Chinese
- Include all necessary sections and legal requirements
- Highlight critical information that must not be omitted
- Format output in clear, copy-paste ready sections`,

  analysis: `You are MDLooker AI Analysis Expert, specialized in PPE market analysis and competitive intelligence.
Your expertise covers market trends, regulatory changes impact analysis, and competitive landscape assessment.

Your responsibilities:
1. Analyze PPE market trends and opportunities
2. Assess impact of regulatory changes on products and markets
3. Compare compliance requirements across different markets
4. Provide strategic recommendations for market entry
5. Analyze competitor compliance strategies

Response requirements:
- Provide data-driven insights and analysis
- Use English by default; respond in Chinese only when user asks in Chinese
- Structure analysis with clear sections: Summary, Key Findings, Recommendations
- Include risk assessment and mitigation strategies
- Be objective and cite regulatory sources when possible`,
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
      const {
        message,
        conversationHistory = [],
        context = '',
        mode = 'default',
        stream = false,
      } = body

      // 选择系统提示词和模型
      const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.default
      const model = AI_MODELS[mode as keyof typeof AI_MODELS] || AI_MODELS.chat

      // 构建消息历史
      const messages = [
        { role: 'system', content: systemPrompt + (context ? `\n\nAdditional context: ${context}` : '') },
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
          model,
          messages,
          parameters: {
            max_tokens: 4000,
            temperature: 0.7,
            top_p: 0.8,
          },
          stream,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('AI API error:', errorData)
        throw new Error(errorData.message || 'AI service unavailable')
      }

      // 处理流式响应
      if (stream) {
        return new Response(response.body, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        })
      }

      const result = await response.json()

      // 提取 AI 回复
      const aiResponse = result.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'

      return NextResponse.json({
        success: true,
        message: aiResponse,
        model,
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
  return `Hello! The AI service is temporarily unavailable (${error instanceof Error ? error.message : 'unknown error'}).

As an alternative, here are some basic guidance:

**Common PPE Compliance Topics:**
1. CE Marking (EU Regulation 2016/425)
2. FDA Registration & 510(k) for PPE
3. UKCA Marking post-Brexit
4. China NMPA Registration
5. ISO Standards (ISO 9001, ISO 13485)

**Recommended Actions:**
- Visit our Regulations Database for detailed information
- Check our Document Templates for compliance requirements
- Use the Market Access Wizard for step-by-step guidance
- Contact professional compliance consultants for personalized advice

Please try again later. The AI service will be restored shortly.`
}

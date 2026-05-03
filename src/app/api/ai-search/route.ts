import { NextRequest, NextResponse } from 'next/server'

const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

export async function POST(request: NextRequest) {
  try {
    // 优先使用 VOLCENGINE_ARK_API_KEY（与项目其他模块一致），兼容 ARK_API_KEY
    const ARK_API_KEY = process.env.VOLCENGINE_ARK_API_KEY || process.env.ARK_API_KEY
    if (!ARK_API_KEY) {
      console.warn('VOLCENGINE_ARK_API_KEY not configured, using fallback response')
      const { query } = await request.json()
      return NextResponse.json({
        query,
        answer: generateFallbackResponse(),
        suggestions: [
          'Visit our Regulations Database for detailed information',
          'Check our Document Templates for compliance requirements',
          'Use the Market Access Wizard for step-by-step guidance',
        ],
        relatedTopics: ['CE Marking', 'FDA 510(k)', 'UKCA Marking', 'NMPA Registration'],
        confidence: 'low',
      })
    }

    const { query, context } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 构建系统提示词
    const systemPrompt = `You are an expert PPE (Personal Protective Equipment) compliance assistant specialized in the PPE industry.
Your task is to help users find information about PPE products, compliance requirements, and market access.

STRICT DOMAIN CONSTRAINTS:
- You MUST prioritize site data: PPE products, manufacturers, regulations, compliance guides, certification requirements, and market access information.
- You MAY reference authoritative external sources when necessary, including: FDA (U.S. Food and Drug Administration), NMPA (National Medical Products Administration of China), EU Commission (European Commission regulations), OSHA, ANSI, ISO, IEC, and other recognized regulatory bodies and standards organizations.
- You MUST REFUSE to answer questions that are completely unrelated to the PPE industry. This includes topics like entertainment, sports, cooking, general technology, politics, finance, etc.
- If a question is unrelated to PPE, respond EXACTLY with: "I'm specialized in PPE (Personal Protective Equipment) compliance and regulations. I can help you with questions about PPE products, certifications, market access, and related regulations. Please ask a PPE-related question."

Available information categories:
1. Products: Safety footwear, gloves, helmets, eye protection, hearing protection, respiratory protection, protective clothing, fall protection
2. Markets: EU (CE marking), US (FDA), UK (UKCA), China (NMPA), Japan (PMDA)
3. Compliance: Standards, certifications, testing requirements, documentation
4. Manufacturers: Company information, certifications, product categories

Response format:
- Provide clear, structured answers
- Include specific standards and regulations when relevant
- Cite authoritative sources (FDA, NMPA, EU Commission, etc.) when referencing external regulations
- Suggest next steps or related resources
- If unsure, acknowledge limitations and suggest contacting experts`

    // 调用火山方舟 API
    // 注意：火山方舟API的 temperature、max_tokens、top_p 应直接放在 body 中，而非 parameters 子对象
    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: query,
      },
    ]

    // 如果有上下文，添加到消息中
    if (context) {
      messages.splice(1, 0, {
        role: 'assistant',
        content: context,
      })
    }

    const requestBody = {
      model: 'doubao-pro-32k-241215',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.8,
    }

    console.log('[AI Search] Sending request to ARK API, model:', requestBody.model, 'query:', query.substring(0, 100))

    const response = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorData: Record<string, unknown> = {}
      try {
        errorData = JSON.parse(errorText)
      } catch {
        // errorText is not JSON
      }
      console.error('[AI Search] ARK API error:', response.status, response.statusText, errorData)
      console.error('[AI Search] Request model:', requestBody.model)

      // 返回友好的回退响应，而不是500错误
      return NextResponse.json({
        query,
        answer: generateFallbackResponse(query),
        suggestions: [
          'Visit our Regulations Database for detailed information',
          'Check our Document Templates for compliance requirements',
          'Use the Market Access Wizard for step-by-step guidance',
        ],
        relatedTopics: ['CE Marking', 'FDA 510(k)', 'UKCA Marking', 'NMPA Registration'],
        confidence: 'low',
      })
    }

    const data = await response.json()
    console.log('[AI Search] ARK API response received, finish_reason:', data.choices?.[0]?.finish_reason)

    const aiResponse = data.choices?.[0]?.message?.content || ''

    if (!aiResponse) {
      console.warn('[AI Search] Empty AI response, using fallback')
      return NextResponse.json({
        query,
        answer: generateFallbackResponse(query),
        suggestions: [
          'Visit our Regulations Database for detailed information',
          'Check our Document Templates for compliance requirements',
        ],
        relatedTopics: ['CE Marking', 'FDA 510(k)', 'UKCA Marking'],
        confidence: 'low',
      })
    }

    // 解析AI响应，提取结构化信息
    const structuredResponse = {
      query,
      answer: aiResponse,
      suggestions: extractSuggestions(aiResponse),
      relatedTopics: extractRelatedTopics(aiResponse),
      confidence: data.choices?.[0]?.finish_reason === 'stop' ? 'high' : 'medium',
    }

    return NextResponse.json(structuredResponse)

  } catch (error) {
    console.error('[AI Search] API error:', error)
    // 不返回500错误，而是返回友好的回退响应
    return NextResponse.json({
      query: 'search',
      answer: generateFallbackResponse(),
      suggestions: [
        'Visit our Regulations Database for detailed information',
        'Check our Document Templates for compliance requirements',
        'Use the Market Access Wizard for step-by-step guidance',
      ],
      relatedTopics: ['CE Marking', 'FDA 510(k)', 'UKCA Marking', 'NMPA Registration'],
      confidence: 'low',
    })
  }
}

/**
 * 备用回复（当 AI 服务不可用时）
 */
function generateFallbackResponse(query?: string): string {
  const queryStr = query ? ` regarding "${query}"` : ''

  return `The AI service is currently unavailable, but here is some general guidance${queryStr}:

**Common PPE Compliance Topics:**
1. CE Marking (EU Regulation 2016/425) - Required for PPE sold in the EU market
2. FDA Registration & 510(k) - Required for most PPE sold in the US market
3. UKCA Marking - Required for PPE sold in the UK post-Brexit
4. China NMPA Registration - Required for PPE sold in the Chinese market
5. ISO Standards (ISO 9001, ISO 13485) - Quality management system standards

**Recommended Actions:**
- Visit our Regulations Database for detailed information
- Check our Document Templates for compliance requirements
- Use the Market Access Wizard for step-by-step guidance
- Contact professional compliance consultants for personalized advice

Please try again later. The AI service will be restored shortly.`
}

/**
 * 从AI响应中提取建议
 */
function extractSuggestions(response: string): string[] {
  const suggestions: string[] = []
  
  // 查找"建议"、"推荐"等关键词后的内容
  const suggestionPatterns = [
    /(?:建议|推荐|您可以|请考虑)[：:]\s*([^\n]+)/g,
    /(?:next steps?|recommendations?|suggestions?)[：:]\s*([^\n]+)/gi,
  ]
  
  for (const pattern of suggestionPatterns) {
    let match
    while ((match = pattern.exec(response)) !== null) {
      suggestions.push(match[1].trim())
    }
  }
  
  return suggestions.slice(0, 5)
}

/**
 * 从AI响应中提取相关主题
 */
function extractRelatedTopics(response: string): string[] {
  const topics: string[] = []
  
  // 查找相关主题
  const topicPatterns = [
    /(?:相关|related)[：:]\s*([^\n]+)/g,
    /(?:see also|related topics?)[：:]\s*([^\n]+)/gi,
  ]
  
  for (const pattern of topicPatterns) {
    let match
    while ((match = pattern.exec(response)) !== null) {
      topics.push(...match[1].split(/[,，]/).map(t => t.trim()))
    }
  }
  
  return topics.slice(0, 5)
}

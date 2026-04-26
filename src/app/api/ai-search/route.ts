import { NextRequest, NextResponse } from 'next/server'

const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const ARK_API_KEY = process.env.ARK_API_KEY
    if (!ARK_API_KEY) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set ARK_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    const { query, context } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // 构建系统提示词
    const systemPrompt = `You are an expert PPE (Personal Protective Equipment) compliance assistant. 
Your task is to help users find information about PPE products, compliance requirements, and market access.

Available information categories:
1. Products: Safety footwear, gloves, helmets, eye protection, hearing protection, respiratory protection, protective clothing, fall protection
2. Markets: EU (CE marking), US (FDA), UK (UKCA), China (NMPA), Japan (PMDA)
3. Compliance: Standards, certifications, testing requirements, documentation
4. Manufacturers: Company information, certifications, product categories

Response format:
- Provide clear, structured answers
- Include specific standards and regulations when relevant
- Suggest next steps or related resources
- If unsure, acknowledge limitations and suggest contacting experts`

    // 调用火山方舟 API
    const response = await fetch(ARK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-r1-250120',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: query,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('ARK API error:', errorData)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content || ''

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
    console.error('AI Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
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

import { NextRequest, NextResponse } from 'next/server'

const ARK_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const DEFAULT_API_KEY = 'ba75b0e2-7406-47d3-a800-86171840a388'

const MODEL_CANDIDATES = [
  process.env.VOLCENGINE_ARK_MODEL,
  process.env.VOLCENGINE_ARK_ENDPOINT_ID,
  'doubao-1.5-pro-32k-250115',
  'doubao-pro-32k-241215',
  'doubao-pro-4k-241215',
  'doubao-lite-32k-240828',
].filter(Boolean) as string[]

const NON_PPE_INDICATORS = [
  "i'm specialized in ppe",
  "i specialize in ppe",
  "ppe-related question",
  "ppe related question",
  "outside the ppe domain",
  "outside my area",
  "not related to ppe",
  "unrelated to ppe",
  "cannot assist with",
  "i can only help with ppe",
  "i focus on ppe",
  "我专注于ppe",
  "我专注于个人防护装备",
  "不属于ppe",
  "与ppe无关",
  "请询问ppe相关问题",
]

function isNonPpeResponse(content: string): boolean {
  const lower = content.toLowerCase()
  return NON_PPE_INDICATORS.some(indicator => lower.includes(indicator))
}

export async function POST(request: NextRequest) {
  try {
    const ARK_API_KEY = process.env.VOLCENGINE_ARK_API_KEY || process.env.ARK_API_KEY || DEFAULT_API_KEY

    const body = await request.json()
    const { query, context, stream = false, conversationHistory = [] } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

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
- If unsure, acknowledge limitations and suggest contacting experts
- Use English by default; respond in Chinese only when user asks in Chinese`

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ]

    if (context) {
      messages.push({ role: 'assistant', content: context })
    }

    if (Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        if (msg.role && msg.content) {
          messages.push({ role: msg.role, content: msg.content })
        }
      }
    }

    messages.push({ role: 'user', content: query })

    let lastError: unknown = null
    for (const model of MODEL_CANDIDATES) {
      const requestBody = {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.8,
        stream,
      }

      console.log('[AI Search] Trying model:', model, 'stream:', stream, 'query:', query.substring(0, 100))

      try {
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
          } catch {}
          console.error('[AI Search] ARK API error with model', model, ':', response.status, response.statusText, errorData)
          lastError = errorData
          continue
        }

        if (stream) {
          return new Response(response.body, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        }

        const data = await response.json()
        console.log('[AI Search] ARK API response received with model', model, ', finish_reason:', data.choices?.[0]?.finish_reason)

        const aiResponse = data.choices?.[0]?.message?.content || ''

        if (!aiResponse) {
          console.warn('[AI Search] Empty AI response with model', model)
          continue
        }

        const nonPpe = isNonPpeResponse(aiResponse)

        const searchEngines = nonPpe ? [
          { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(query)}` },
          { name: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(query)}` },
          { name: 'Baidu', url: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}` },
        ] : undefined

        const structuredResponse = {
          query,
          answer: aiResponse,
          suggestions: extractSuggestions(aiResponse),
          relatedTopics: extractRelatedTopics(aiResponse),
          confidence: data.choices?.[0]?.finish_reason === 'stop' ? 'high' : 'medium',
          isNonPpe: nonPpe,
          searchEngines,
        }

        return NextResponse.json(structuredResponse)
      } catch (fetchError) {
        console.error('[AI Search] Fetch error with model', model, ':', fetchError)
        lastError = fetchError
        continue
      }
    }

    console.error('[AI Search] All model candidates failed, returning fallback. Last error:', lastError)
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
      isNonPpe: false,
    })

  } catch (error) {
    console.error('[AI Search] API error:', error)
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
      isNonPpe: false,
    })
  }
}

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

function extractSuggestions(response: string): string[] {
  const suggestions: string[] = []

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

function extractRelatedTopics(response: string): string[] {
  const topics: string[] = []

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

import { NextRequest, NextResponse } from 'next/server'

// 阿里云百炼 API 配置
const API_KEY = process.env.ALIBABA_BAILIAN_API_KEY
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

if (!API_KEY) {
  console.error('ALIBABA_BAILIAN_API_KEY environment variable is required')
}

export interface ExtractedInfo {
  productName: string
  deviceClass: string
  productCode: string
  predicateDevices: string[]
  indication: string
  technology: string
  clinicalExemption: boolean
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { document, type } = body

    if (!document || !type) {
      return NextResponse.json(
        { error: 'Document and type are required' },
        { status: 400 }
      )
    }

    if (!['510k', 'pma', 'ce'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be 510k, pma, or ce' },
        { status: 400 }
      )
    }

    // 构建提示词
    const systemPrompt = buildSystemPrompt(type)
    const userPrompt = buildUserPrompt(document)

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]

    // 调用阿里云百炼 API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-max',
        input: {
          messages,
        },
        parameters: {
          max_tokens: 3000,
          temperature: 0.3,
          top_p: 0.9,
          result_format: 'message',
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('AI extraction error:', errorData)
      throw new Error(errorData.message || 'AI service unavailable')
    }

    const result = await response.json()

    // 提取 AI 回复
    const aiResponse = result.output?.choices?.[0]?.message?.content || ''

    // 解析 AI 响应
    const extractedInfo = parseAIResponse(aiResponse)

    return NextResponse.json({
      success: true,
      data: extractedInfo,
      model: 'qwen-max',
      usage: result.usage,
    })
  } catch (error) {
    console.error('AI extraction error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI service error',
      },
      { status: error instanceof Error && error.message.includes('API') ? 503 : 500 }
    )
  }
}

function buildSystemPrompt(type: string): string {
  const prompts: Record<string, string> = {
    '510k': `你是医疗器械法规专家，请从以下 FDA 510(k) 文档中提取结构化信息。

要求：
1. 信息准确，引用原文
2. 不确定字段标注低置信度
3. 以 JSON 格式返回结果

请提取以下字段：
{
  "productName": "产品全称",
  "deviceClass": "分类 (Class I/II/III)",
  "productCode": "产品代码",
  "predicateDevices": ["前代产品列表"],
  "indication": "适用范围/适应症",
  "technology": "核心技术描述",
  "clinicalExemption": true/false (是否临床豁免),
  "confidence": 0.95 (置信度 0-1)
}`,

    'pma': `你是医疗器械法规专家，请从以下 FDA PMA 文档中提取结构化信息。

要求：
1. 信息准确，引用原文
2. 不确定字段标注低置信度
3. 以 JSON 格式返回结果

请提取以下字段：
{
  "productName": "产品全称",
  "deviceClass": "分类 (Class I/II/III)",
  "productCode": "产品代码",
  "indication": "适用范围/适应症",
  "technology": "核心技术描述",
  "clinicalData": "临床数据摘要",
  "riskFactors": "风险因素",
  "confidence": 0.95 (置信度 0-1)
}`,

    'ce': `你是医疗器械法规专家，请从以下 CE 文档中提取结构化信息。

要求：
1. 信息准确，引用原文
2. 不确定字段标注低置信度
3. 以 JSON 格式返回结果

请提取以下字段：
{
  "productName": "产品全称",
  "deviceClass": "分类 (Class I/IIa/IIb/III)",
  "productCode": "产品代码",
  "intendedPurpose": "预期用途",
  "technology": "核心技术描述",
  "standards": "符合的标准",
  "clinicalEvaluation": "临床评价摘要",
  "confidence": 0.95 (置信度 0-1)
}`,
  }

  return prompts[type] || prompts['510k']
}

function buildUserPrompt(document: string): string {
  return `请从以下医疗器械文档中提取信息：

文档内容：
${document.substring(0, 15000)} // 截断到 15000 字符以避免 token 超限

请以严格的 JSON 格式返回提取结果，不要包含任何其他文本。`
}

function parseAIResponse(response: string): ExtractedInfo {
  try {
    // 尝试从响应中提取 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[0]
      const parsed = JSON.parse(jsonStr)

      return {
        productName: parsed.productName || parsed.product_name || '',
        deviceClass: parsed.deviceClass || parsed.device_class || '',
        productCode: parsed.productCode || parsed.product_code || '',
        predicateDevices: parsed.predicateDevices || parsed.predicate_devices || [],
        indication: parsed.indication || parsed.indications || '',
        technology: parsed.technology || parsed.technologies || '',
        clinicalExemption: parsed.clinicalExemption ?? parsed.clinical_exemption ?? false,
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      }
    }
  } catch (error) {
    console.error('JSON parsing error:', error)
  }

  // 如果解析失败，返回默认值
  return {
    productName: '',
    deviceClass: '',
    productCode: '',
    predicateDevices: [],
    indication: '',
    technology: '',
    clinicalExemption: false,
    confidence: 0.3,
  }
}

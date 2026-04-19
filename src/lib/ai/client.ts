import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AIContent {
  content: string
  model: string
  tokens: number
  timestamp: string
}

export async function generateAIContent(prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是一位专业的医疗器械合规专家，专注于法规解读、产品注册和风险评估。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    const data = await response.json()
    return data.message || 'AI 生成内容失败'
  } catch (error) {
    console.error('AI content generation error:', error)
    throw error
  }
}

export async function generateComparisonAnalysis(
  type: 'company' | 'product',
  items: unknown[],
  comparisonData: unknown
): Promise<string> {
  try {
    const context = {
      type,
      items,
      comparison: comparisonData,
    }

    const prompt = `你是一位医疗器械行业分析师，请根据以下${type === 'company' ? '企业' : '产品'}对比数据生成一份专业的对比分析报告：

对比类型: ${type === 'company' ? '企业' : '产品'}对比
对比项数量: ${items.length}

${type === 'company' ? '企业信息：' : '产品信息：'}
${items.map((item, i) => `${i + 1}. ${item.name || item.product_name} - ${item.country || item.market}`).join('\n')}

对比数据：
${JSON.stringify(comparisonData, null, 2)}

请生成以下内容：
1. 整体对比概览
2. 关键差异分析
3. 优势与劣势评估
4. 合规性建议

请以专业、简洁的方式生成报告。`

    return await generateAIContent(prompt)
  } catch (error) {
    console.error('AI comparison analysis error:', error)
    throw error
  }
}

export async function generateRegulatoryAnalysis(
  company: unknown,
  products: unknown[],
  regulations: unknown[]
): Promise<string> {
  try {
    const prompt = `你是一位医疗器械法规专家，请根据以下公司和产品信息，结合相关法规要求，生成一份法规合规性分析报告：

公司信息：
- 公司名称: ${company.name}
- 所在国家: ${company.country}
- 注册号: ${company.registration_number}

产品信息：
${products.slice(0, 5).map((p, i) => `${i + 1}. ${p.product_name} - ${p.market}市场 - ${p.device_class}类别`).join('\n')}

相关法规：
${regulations.slice(0, 3).map((r, i) => `${i + 1}. ${r.title} (${r.jurisdiction})`).join('\n')}

请生成以下内容：
1. 法规符合性评估
2. 潜在合规风险
3. 合规改进建议

请以专业、简洁的方式生成报告。`

    return await generateAIContent(prompt)
  } catch (error) {
    console.error('AI regulatory analysis error:', error)
    throw error
  }
}

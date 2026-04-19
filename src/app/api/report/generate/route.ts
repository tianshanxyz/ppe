import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIContent } from '@/lib/ai/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyId, type = 'compliance' } = body

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 获取公司数据
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // 获取产品数据
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // 获取风险警报
    const { data: risks, error: risksError } = await supabase
      .from('risk_alerts')
      .select('*')
      .eq('entity_type', 'company')
      .eq('entity_id', companyId)

    if (risksError) {
      console.error('Error fetching risks:', risksError)
      return NextResponse.json(
        { error: 'Failed to fetch risks' },
        { status: 500 }
      )
    }

    // 获取法规知识库
    const { data: regulations, error: regulationsError } = await supabase
      .from('regulations')
      .select('*')
      .limit(10)

    if (regulationsError) {
      console.error('Error fetching regulations:', regulationsError)
      return NextResponse.json(
        { error: 'Failed to fetch regulations' },
        { status: 500 }
      )
    }

    // 生成 AI 增强的报告内容
    const aiReport = await generateAIReport(company, products, risks, regulations)

    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const reportData = {
      company,
      products: products || [],
      risks: risks || [],
      aiAnalysis: aiReport,
    }

    // 保存报告数据到数据库
    const { error: saveError } = await supabase
      .from('reports')
      .insert({
        id: reportId,
        company_id: companyId,
        type,
        data: reportData,
        status: 'generated',
      })

    if (saveError) {
      console.error('Error saving report:', saveError)
      // 继续返回报告数据，即使保存失败
    }

    return NextResponse.json({
      data: {
        reportId,
        type,
        generatedAt: new Date().toISOString(),
        reportData,
      },
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Report generation failed' },
      { status: 500 }
    )
  }
}

/**
 * 生成 AI 增强的报告内容
 */
async function generateAIReport(
  company: unknown,
  products: unknown[],
  risks: unknown[],
  regulations: unknown[]
) {
  try {
    // 构建上下文
    const context = {
      company: {
        name: company.name,
        country: company.country,
        status: company.status,
        registrationNumber: company.registration_number,
      },
      products: products?.slice(0, 5).map(p => ({
        name: p.product_name,
        market: p.market,
        status: p.status,
        deviceClass: p.device_class,
      })) || [],
      risks: risks?.slice(0, 3).map(r => ({
        level: r.risk_level,
        message: r.message,
        date: r.created_at,
      })) || [],
    }

    // 构建 AI 提示词
    const prompt = `你是一位医疗器械合规专家，请根据以下公司信息生成一份专业的合规分析报告：

公司信息：
- 公司名称: ${context.company.name}
- 所在国家: ${context.company.country}
- 状态: ${context.company.status}
- 注册号: ${context.company.registrationNumber}

产品信息：
${context.products.map((p, i) => `${i + 1}. ${p.name} - ${p.market}市场 - ${p.deviceClass}类别 - ${p.status}`).join('\n')}

风险警报：
${context.risks.map((r, i) => `${i + 1}. [${r.level}] ${r.message} (${r.date})`).join('\n') || '无风险警报'}

请生成以下内容：
1. 公司概况总结
2. 产品合规性分析
3. 风险评估与建议
4. 合规建议

请以专业、简洁的方式生成报告。`;

    // 调用 AI 生成报告
    const aiResponse = await generateAIContent(prompt)

    return {
      summary: aiResponse,
      generatedAt: new Date().toISOString(),
      model: 'volcengine-ark',
    }
  } catch (error) {
    console.error('AI report generation error:', error)
    return {
      summary: 'AI report generation failed, please try again later',
      generatedAt: new Date().toISOString(),
      model: 'volcengine-ark',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

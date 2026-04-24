import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { calculateTrustScore } from '@/lib/trust/scoring'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
      const supabase = await createClient()

    // 获取企业基本信息
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: '企业不存在' },
        { status: 404 }
      )
    }

    // 获取企业相关产品（使用 all_products 视图）
    const { data: products } = await supabase
      .from('all_products')
      .select('*')
      .eq('company_id', id)
      .limit(50)

    // 获取企业风险警报
    const { data: alerts } = await supabase
      .from('risk_alerts')
      .select('*')
      .eq('entity_type', 'company')
      .eq('entity_id', id)
      .order('detected_at', { ascending: false })
      .limit(20)

    // 获取企业变更历史
    const { data: history } = await supabase
      .from('change_history')
      .select('*')
      .eq('entity_type', 'company')
      .eq('entity_id', id)
      .order('changed_at', { ascending: false })
      .limit(20)

    // 获取企业数据源链接
    const { data: sources } = await supabase
      .from('data_sources')
      .select('*')
      .eq('entity_type', 'company')
      .eq('entity_id', id)

    // 计算可信度评分
    const trustScore = calculateTrustScore(company, { data: { alerts: alerts || [] } })

    return NextResponse.json({
      company: {
        ...company,
        trustScore,
        productCount: products?.length || 0,
      },
      products: products || [],
      alerts: alerts || [],
      history: history || [],
      sources: sources || [],
    })
  } catch (error) {
    console.error('获取企业详情错误:', error)
    return NextResponse.json(
      { error: '获取企业详情失败' },
      { status: 500 }
    )
  }
}

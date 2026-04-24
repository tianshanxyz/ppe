import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

interface EntityData {
  id: string
  name: string
  [key: string]: string | number | boolean | null | undefined
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
  try {
    const { entityType, entityId } = await params

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required parameters: entityType and entityId' },
        { status: 400 }
      )
    }

    
      const supabase = await createClient()
    let data: EntityData | null = null

    if (entityType === 'company') {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', entityId)
        .single()

      if (error || !companyData) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        )
      }
      data = companyData
    } else if (entityType === 'product') {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', entityId)
        .single()

      if (error || !productData) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      data = productData
    } else if (entityType === 'certificate') {
      const { data: certificateData, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', entityId)
        .single()

      if (error || !certificateData) {
        return NextResponse.json(
          { error: 'Certificate not found' },
          { status: 404 }
        )
      }
      data = certificateData
    } else {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    // 获取已有的风险警报
    const { data: existingAlerts } = await supabase
      .from('risk_alerts')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('detected_at', { ascending: false })

    return NextResponse.json({
      data: {
        alerts: existingAlerts || [],
        summary: {
          total: existingAlerts?.length || 0,
          high: existingAlerts?.filter(a => a.risk_level === 'high').length || 0,
          medium: existingAlerts?.filter(a => a.risk_level === 'medium').length || 0,
          low: existingAlerts?.filter(a => a.risk_level === 'low').length || 0,
        },
      },
    })
  } catch (error) {
    console.error('Risk detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { entityType, data } = body

    if (!entityType || !data) {
      return NextResponse.json(
        { error: 'Missing required parameters: entityType and data' },
        { status: 400 }
      )
    }

    if (!['company', 'product', 'certificate'].includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      )
    }

    
      const supabase = await createClient()

    // 这里可以添加风险检测逻辑
    // 目前返回空的结果
    return NextResponse.json({
      data: {
        alerts: [],
        summary: {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      },
    })
  } catch (error) {
    console.error('Risk detection error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

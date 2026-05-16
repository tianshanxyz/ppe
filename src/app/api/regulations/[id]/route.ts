import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service-client'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Regulation ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch the regulation from Supabase
    const { data: regulation, error } = await supabase
      .from('ppe_regulations')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Regulation fetch error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch regulation' },
        { status: 500 }
      )
    }

    if (!regulation) {
      return NextResponse.json(
        { success: false, error: 'Regulation not found' },
        { status: 404 }
      )
    }

    // Map database fields to API response format
    const mappedRegulation = {
      id: regulation.id,
      category_id: '',
      market_code: regulation.region || '',
      title: regulation.name || '',
      title_zh: regulation.name || '',
      regulation_number: regulation.code || '',
      document_type: 'regulation',
      issuing_authority: regulation.region || '',
      effective_date: '',
      status: 'active',
      summary: (regulation.description || '').substring(0, 300),
      summary_zh: '',
      full_text: regulation.description || '',
    }

    // Find related regulations from the same region
    const { data: relatedData } = await supabase
      .from('ppe_regulations')
      .select('id, name, code, region')
      .eq('region', regulation.region)
      .neq('id', id)
      .limit(5)

    const related = (relatedData || []).map((reg: any) => ({
      id: reg.id,
      title: reg.name || '',
      title_zh: reg.name || '',
      regulation_number: reg.code || '',
      document_type: 'regulation',
      market_code: reg.region || '',
      status: 'active',
    }))

    return NextResponse.json({
      success: true,
      data: mappedRegulation,
      related,
    })
  } catch (error) {
    console.error('Regulation fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch regulation',
      },
      { status: 500 }
    )
  }
}

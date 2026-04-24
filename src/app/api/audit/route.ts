import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { validateEnum, validatePagination } from '@/lib/security/sanitize'
import { withRateLimit } from '@/lib/middleware/rateLimit'

// GET /api/audit - Get audit reports
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    
      const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const reportTypeParam = searchParams.get('report_type')
    const limitParam = searchParams.get('limit')
    
    // 验证报告类型参数
    const allowedReportTypes = [
      'data_sync',
      'security_scan',
      'quality_check',
      'compliance_review',
      'performance_audit'
    ]
    
    const reportTypeValidation = validateEnum(
      reportTypeParam,
      allowedReportTypes,
      undefined as any
    )
    
    // 验证分页参数
    const paginationValidation = validatePagination(undefined, limitParam ?? undefined)
    if (!paginationValidation.valid) {
      return NextResponse.json(
        { success: false, error: paginationValidation.error },
        { status: 400 }
      )
    }
    
    const reportType = reportTypeValidation.valid ? reportTypeValidation.value : undefined
    const limit = paginationValidation.limit
  
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (reportType) {
      query = query.eq('report_type', reportType)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error fetching audit reports:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch audit reports' },
      { status: 500 }
    )
  }
}, {
  maxRequests: 30,
  windowInSeconds: 60,
  enableAuthBoost: true,
  authBoostMultiplier: 2,
})(request)
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { validateEnum, validatePagination, sanitizeInput } from '@/lib/security/sanitize'
import { withRateLimit } from '@/lib/middleware/rateLimit'

// GET /api/alerts - Get all alerts
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const statusParam = searchParams.get('status')
    const severityParam = searchParams.get('severity')
    const limitParam = searchParams.get('limit')
    
    // 验证状态参数
    const statusValidation = validateEnum(
      statusParam,
      ['active', 'resolved', 'archived'],
      undefined as any
    )
    
    // 验证严重程度参数
    const severityValidation = validateEnum(
      severityParam,
      ['low', 'medium', 'high', 'critical'],
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
    
    const status = statusValidation.valid ? statusValidation.value : undefined
    const severity = severityValidation.valid ? severityValidation.value : undefined
    const limit = paginationValidation.limit
  
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (status) {
        query = query.eq('status', status)
      }
      
      if (severity) {
        query = query.eq('severity', severity)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        data,
        count: data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching alerts:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch alerts' },
        { status: 500 }
      )
    }
  }, {
    maxRequests: 100,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}

// POST /api/alerts - Create new alert
export async function POST(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const supabase = await createClient()
    
    try {
      const body = await request.json()
      
      // 验证请求体大小
      const bodySize = JSON.stringify(body).length
      if (bodySize > 1024 * 1024) { // 1MB limit
        return NextResponse.json(
          { success: false, error: '请求体过大' },
          { status: 413 }
        )
      }
      
      const { 
        alert_type, 
        severity, 
        title, 
        message, 
        data_source_id,
        metadata 
      } = body
      
      // 验证必填字段
      if (!alert_type || !title || !message) {
        return NextResponse.json(
          { success: false, error: '缺少必填字段：alert_type, title, message' },
          { status: 400 }
        )
      }
      
      // 验证字段类型和长度
      if (typeof alert_type !== 'string' || alert_type.length > 100) {
        return NextResponse.json(
          { success: false, error: 'alert_type 必须是字符串且长度不超过 100' },
          { status: 400 }
        )
      }
      
      if (typeof title !== 'string' || title.length > 500) {
        return NextResponse.json(
          { success: false, error: 'title 必须是字符串且长度不超过 500' },
          { status: 400 }
        )
      }
      
      if (typeof message !== 'string' || message.length > 5000) {
        return NextResponse.json(
          { success: false, error: 'message 必须是字符串且长度不超过 5000' },
          { status: 400 }
        )
      }
      
      // 验证严重程度
      const allowedSeverities = ['low', 'medium', 'high', 'critical']
      if (severity && !allowedSeverities.includes(severity)) {
        return NextResponse.json(
          { success: false, error: 'severity 必须是以下值之一：low, medium, high, critical' },
          { status: 400 }
        )
      }
      
      // 清理输入
      const sanitizedTitle = sanitizeInput(title)
      const sanitizedMessage = sanitizeInput(message)
      
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          alert_type: sanitizeInput(alert_type),
          severity: severity || 'medium',
          title: sanitizedTitle,
          message: sanitizedMessage,
          data_source_id,
          metadata,
          status: 'active'
        })
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        data
      })
    } catch (error) {
      console.error('Error creating alert:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create alert' },
        { status: 500 }
      )
    }
  }, {
    maxRequests: 20,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}

// PATCH /api/alerts/:id - Update alert status
export async function PATCH(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    const supabase = await createClient()
    
    try {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')
      const body = await request.json()
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Alert ID required' },
          { status: 400 }
        )
      }
      
      const { data, error } = await supabase
        .from('alerts')
        .update({
          ...body,
          resolved_at: body.status === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({
        success: true,
        data
      })
    } catch (error) {
      console.error('Error updating alert:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update alert' },
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

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/logs - Get data update logs
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const dataSourceId = searchParams.get('data_source_id')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  try {
    let query = supabase
      .from('data_update_logs')
      .select(`
        *,
        data_sources(name, display_name)
      `)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (dataSourceId) {
      query = query.eq('data_source_id', dataSourceId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        offset,
        limit,
        total: count
      }
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logs' },
      { status: 500 }
    )
  }
}

// POST /api/logs - Create new log entry
export async function POST(request: Request) {
  const supabase = await createClient()
  
  try {
    const body = await request.json()
    const {
      data_source_id,
      operation_type,
      status,
      records_processed,
      records_inserted,
      records_updated,
      records_failed,
      error_message,
      started_at,
      completed_at,
      metadata
    } = body
    
    const { data, error } = await supabase
      .from('data_update_logs')
      .insert({
        data_source_id,
        operation_type,
        status,
        records_processed: records_processed || 0,
        records_inserted: records_inserted || 0,
        records_updated: records_updated || 0,
        records_failed: records_failed || 0,
        error_message,
        started_at: started_at || new Date().toISOString(),
        completed_at,
        metadata
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error creating log:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create log' },
      { status: 500 }
    )
  }
}

// PATCH /api/logs/:id - Update log entry (e.g., mark as completed)
export async function PATCH(request: Request) {
  const supabase = await createClient()
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Log ID required' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('data_update_logs')
      .update({
        ...body,
        completed_at: body.status === 'completed' ? new Date().toISOString() : undefined
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
    console.error('Error updating log:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update log' },
      { status: 500 }
    )
  }
}

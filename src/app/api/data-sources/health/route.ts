import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/data-sources/health - Get data source health status
export async function GET(request: Request) {
  
      const supabase = await createClient()
  
  try {
    const { data: dataSources, error } = await supabase
      .from('data_sources')
      .select('*')
      .eq('is_active', true)
    
    if (error) throw error
    
    const healthData = (dataSources || []).map((source: any) => {
      const issues: string[] = []
      let healthScore = 100
      
      // Check record count
      const minRecords = source.name === 'fda' ? 5000 : source.name === 'eudamed' ? 10000 : 1000
      if (source.record_count < minRecords) {
        healthScore -= 30
        issues.push(`Low record count: ${source.record_count} (min: ${minRecords})`)
      }
      
      // Check last sync time
      if (source.last_sync_at) {
        const hoursSinceSync = (Date.now() - new Date(source.last_sync_at).getTime()) / (1000 * 60 * 60)
        const maxHours = source.name === 'eudamed' ? 168 : 24
        if (hoursSinceSync > maxHours) {
          healthScore -= 40
          issues.push(`Data stale: last sync ${Math.round(hoursSinceSync)}h ago`)
        } else if (hoursSinceSync > maxHours * 0.8) {
          healthScore -= 15
          issues.push(`Data aging: last sync ${Math.round(hoursSinceSync)}h ago`)
        }
      } else {
        healthScore -= 50
        issues.push('Never synced')
      }
      
      return {
        id: source.id,
        name: source.name,
        display_name: source.display_name,
        status: source.status,
        record_count: source.record_count,
        last_sync_at: source.last_sync_at,
        health_score: Math.max(0, healthScore),
        issues
      }
    })
    
    return NextResponse.json({
      success: true,
      data: healthData
    })
  } catch (error) {
    console.error('Error fetching data source health:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data source health' },
      { status: 500 }
    )
  }
}

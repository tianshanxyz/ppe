import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST /api/audit/run - Run a data audit
export async function POST(request: Request) {
  
      const supabase = await createClient()
  
  try {
    const auditResults: Record<string, any> = {
      data_sources: {},
      data_quality: {},
      compliance: {}
    }
    
    let overallStatus = 'passed'
    const issues: string[] = []
    
    // 1. Check data sources
    const { data: dataSources, error: dsError } = await supabase
      .from('data_sources')
      .select('*')
      .eq('is_active', true)
    
    if (dsError) throw dsError
    
    for (const source of dataSources || []) {
      const sourceHealth: Record<string, any> = {
        name: source.display_name,
        status: source.status,
        record_count: source.record_count,
        last_sync_at: source.last_sync_at,
        health_score: 100,
        issues: []
      }
      
      // Check record count
      const minRecords = source.name === 'fda' ? 5000 : source.name === 'eudamed' ? 10000 : 1000
      if (source.record_count < minRecords) {
        sourceHealth.health_score -= 30
        sourceHealth.issues.push(`Low record count: ${source.record_count} (min: ${minRecords})`)
        if (overallStatus !== 'failed') overallStatus = 'warning'
      }
      
      // Check last sync time
      if (source.last_sync_at) {
        const hoursSinceSync = (Date.now() - new Date(source.last_sync_at).getTime()) / (1000 * 60 * 60)
        const maxHours = source.name === 'eudamed' ? 168 : 24
        if (hoursSinceSync > maxHours) {
          sourceHealth.health_score -= 40
          sourceHealth.issues.push(`Data stale: last sync ${Math.round(hoursSinceSync)}h ago (max: ${maxHours}h)`)
          overallStatus = 'failed'
        } else if (hoursSinceSync > maxHours * 0.8) {
          sourceHealth.health_score -= 15
          sourceHealth.issues.push(`Data aging: last sync ${Math.round(hoursSinceSync)}h ago`)
          if (overallStatus !== 'failed') overallStatus = 'warning'
        }
      } else {
        sourceHealth.health_score -= 50
        sourceHealth.issues.push('Never synced')
        overallStatus = 'failed'
      }
      
      // Check API connectivity
      if (source.api_endpoint) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          
          const testUrl = source.name === 'fda' 
            ? `https://api.fda.gov/device/510k.json?api_key=${source.api_key || ''}&limit=1`
            : source.api_endpoint
          
          const response = await fetch(testUrl, { signal: controller.signal })
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            sourceHealth.health_score -= 20
            sourceHealth.issues.push(`API returned ${response.status}`)
            if (overallStatus !== 'failed') overallStatus = 'warning'
          }
        } catch (error) {
          sourceHealth.health_score -= 25
          sourceHealth.issues.push('API unreachable')
          overallStatus = 'failed'
        }
      }
      
      sourceHealth.health_score = Math.max(0, sourceHealth.health_score)
      auditResults.data_sources[source.name] = sourceHealth
      issues.push(...sourceHealth.issues)
    }
    
    // 2. Check data quality (sample records)
    const { count: eudamedCount } = await supabase
      .from('eudamed_registrations')
      .select('*', { count: 'exact', head: true })
    
    auditResults.data_quality.eudamed = {
      total_records: eudamedCount || 0,
      status: (eudamedCount || 0) >= 10000 ? 'good' : (eudamedCount || 0) >= 1000 ? 'acceptable' : 'poor'
    }
    
    // 3. Check companies table
    const { count: companiesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
    
    auditResults.data_quality.companies = {
      total_records: companiesCount || 0,
      status: (companiesCount || 0) >= 1000 ? 'good' : (companiesCount || 0) >= 100 ? 'acceptable' : 'poor'
    }
    
    // 4. Check products table
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
    
    auditResults.data_quality.products = {
      total_records: productsCount || 0,
      status: (productsCount || 0) >= 1000 ? 'good' : (productsCount || 0) >= 100 ? 'acceptable' : 'poor'
    }
    
    // Save audit report
    const summary = issues.length === 0 
      ? 'All systems operating normally' 
      : `Found ${issues.length} issue(s) across ${dataSources?.length || 0} data sources`
    
    const { data: auditLog, error: insertError } = await supabase
      .from('audit_logs')
      .insert({
        report_type: 'full_audit',
        status: overallStatus,
        summary,
        details: auditResults,
        completed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error saving audit report:', insertError)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        status: overallStatus,
        summary,
        details: auditResults,
        issues,
        audit_id: auditLog?.id
      }
    })
  } catch (error) {
    console.error('Error running audit:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to run audit' },
      { status: 500 }
    )
  }
}

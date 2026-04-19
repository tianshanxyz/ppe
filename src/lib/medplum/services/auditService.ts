/**
 * Medplum 审计日志服务
 * 
 * 提供与 Medplum 审计日志系统的集成功能，包括：
 * - 审计日志 API 调用
 * - 日志查看页面集成
 * - 日志筛选功能
 * - 审计分析
 * 
 * @module lib/medplum/services/auditService
 */

import { getMedplumClient } from '../client'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'

/**
 * 审计事件类型
 */
export enum AuditEventType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  SEARCH = 'search',
  ACCESS = 'access',
  ERROR = 'error'
}

/**
 * 审计日志接口
 */
export interface MedplumAuditLog {
  id: string
  eventType: AuditEventType
  action: string
  resourceType: string
  resourceId: string
  userId: string
  ipAddress: string
  userAgent: string
  timestamp: string
  details: unknown
  medplumId: string
}

/**
 * 获取 Medplum 审计日志
 */
export async function getMedplumAuditEvents(params?: {
  limit?: number
  offset?: number
  startTime?: string
  endTime?: string
  eventType?: AuditEventType
  resourceType?: string
  userId?: string
}) {
  try {
    const medplumClient = getMedplumClient()
    
    if (!medplumClient.isAuthenticated()) {
      throw new Error('Not authenticated')
    }
    
    const searchParams: Record<string, string> = {
      _count: (params?.limit || 20).toString(),
      _offset: (params?.offset || 0).toString(),
      _sort: '-recorded',
    }

    // 添加过滤条件
    if (params?.startTime) {
      searchParams._ge = params.startTime
    }

    if (params?.endTime) {
      searchParams._le = params.endTime
    }

    if (params?.userId) {
      searchParams.agent = params.userId
    }

    const result = await medplumClient.searchResources('AuditEvent', searchParams)
    return result
  } catch (error) {
    console.error('Failed to get Medplum audit events:', error)
    throw error
  }
}

/**
 * 同步 Medplum 审计日志到本地
 */
export async function syncAuditLogs(startTime?: string) {
  try {
    const logs = await getMedplumAuditEvents({
      limit: 1000,
      startTime: startTime || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    })

    if ((logs as any).entry) {
      await saveAuditLogsToLocal((logs as any).entry)
    }

    console.log(`Synced ${(logs as any).total || 0} audit logs from Medplum`)
    return (logs as any).total || 0
  } catch (error) {
    console.error('Failed to sync audit logs:', error)
    throw error
  }
}

/**
 * 保存审计日志到本地数据库
 */
async function saveAuditLogsToLocal(auditEntries: unknown[]) {
  try {
    const supabase = await createSupabaseClient()
    const logsToInsert = auditEntries.map((entry: any) => {
      const audit = entry.resource as any
      return mapMedplumAuditToLocal(audit)
    })

    if (logsToInsert.length > 0) {
      const { error } = await supabase
        .from('audit_logs')
        .insert(logsToInsert)

      if (error) {
        console.error('Failed to save audit logs to database:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Error saving audit logs to local:', error)
    throw error
  }
}

/**
 * 映射 Medplum 审计到本地格式
 */
function mapMedplumAuditToLocal(audit: any): MedplumAuditLog {
  return {
    id: `medplum-${audit.id}`,
    eventType: mapAuditEventType(audit.type?.coding?.[0]?.code),
    action: audit.action?.coding?.[0]?.display || 'unknown',
    resourceType: audit.entity?.[0]?.what?.reference?.split('/')[0] || 'unknown',
    resourceId: audit.entity?.[0]?.what?.reference?.split('/')[1] || '',
    userId: audit.agent?.[0]?.who?.reference?.split('/')[1] || 'unknown',
    ipAddress: audit.agent?.[0]?.network?.address || 'unknown',
    userAgent: audit.agent?.[0]?.network?.userAgent || 'unknown',
    timestamp: audit.recorded || new Date().toISOString(),
    details: {
      outcome: audit.outcome,
      outcomeDesc: audit.outcomeDesc,
      purposeOfEvent: audit.purposeOfEvent?.map((p: any) => p.text).join(', ')
    },
    medplumId: audit.id
  }
}

/**
 * 映射审计事件类型
 */
function mapAuditEventType(code?: string): AuditEventType {
  switch (code) {
    case 'login':
      return AuditEventType.LOGIN
    case 'logout':
      return AuditEventType.LOGOUT
    case 'create':
      return AuditEventType.CREATE
    case 'update':
      return AuditEventType.UPDATE
    case 'delete':
      return AuditEventType.DELETE
    case 'search':
      return AuditEventType.SEARCH
    case 'access':
      return AuditEventType.ACCESS
    case 'error':
      return AuditEventType.ERROR
    default:
      return AuditEventType.ACCESS
  }
}

/**
 * 分析审计日志
 */
export async function analyzeAuditLogs(params?: {
  startTime?: string
  endTime?: string
  eventType?: AuditEventType
  resourceType?: string
}) {
  try {
    const supabase = await createSupabaseClient()
    let query = supabase
      .from('audit_logs')
      .select('*')

    // 添加过滤条件
    if (params?.startTime) {
      query = query.gte('timestamp', params.startTime)
    }

    if (params?.endTime) {
      query = query.lte('timestamp', params.endTime)
    }

    if (params?.eventType) {
      query = query.eq('event_type', params.eventType)
    }

    if (params?.resourceType) {
      query = query.eq('resource_type', params.resourceType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Failed to analyze audit logs:', error)
      throw error
    }

    // 生成分析报告
    return generateAuditReport(data)
  } catch (error) {
    console.error('Error analyzing audit logs:', error)
    throw error
  }
}

/**
 * 生成审计报告
 */
function generateAuditReport(logs: any[]) {
  const report = {
    totalEvents: logs.length,
    eventsByType: logs.reduce((acc: Record<string, number>, log: any) => {
      acc[log.event_type] = (acc[log.event_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    eventsByResource: logs.reduce((acc: Record<string, number>, log: any) => {
      acc[log.resource_type] = (acc[log.resource_type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    topUsers: logs.reduce((acc: Record<string, number>, log: any) => {
      acc[log.user_id] = (acc[log.user_id] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    timeline: logs.map(log => ({
      timestamp: log.timestamp,
      eventType: log.event_type,
      action: log.action,
      resourceType: log.resource_type
    })).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }

  return report
}

/**
 * 清理过期审计日志
 */
export async function cleanupAuditLogs(daysToKeep: number = 90) {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString()
    const supabase = await createSupabaseClient()

    const { error } = await supabase
      .from('audit_logs')
      .delete()
      .lt('timestamp', cutoffDate)

    if (error) {
      console.error('Failed to cleanup audit logs:', error)
      throw error
    }

    console.log(`Cleaned up audit logs older than ${daysToKeep} days`)
    return true
  } catch (error) {
    console.error('Error cleaning up audit logs:', error)
    throw error
  }
}

/**
 * 集成审计日志功能
 */
export async function integrateAuditLogs() {
  try {
    // 1. 同步初始审计日志
    await syncAuditLogs()

    // 2. 测试审计日志分析
    const analysis = await analyzeAuditLogs()
    console.log('Audit log analysis:', analysis)

    // 3. 清理过期日志
    await cleanupAuditLogs()

    console.log('Audit logs integrated successfully')
    return true
  } catch (error) {
    console.error('Failed to integrate audit logs:', error)
    throw error
  }
}

/**
 * 测试审计日志功能
 */
export async function testAuditFunctionality() {
  try {
    // 1. 测试获取审计日志
    const logs = await getMedplumAuditEvents({ limit: 10 })
    console.log('Retrieved audit logs:', (logs as any).total)

    // 2. 测试同步
    const synced = await syncAuditLogs()
    console.log('Synced audit logs:', synced)

    // 3. 测试分析
    const analysis = await analyzeAuditLogs()
    console.log('Audit log analysis generated')

    // 4. 测试清理
    await cleanupAuditLogs(1)

    console.log('Audit functionality test completed successfully')
    return true
  } catch (error) {
    console.error('Audit functionality test failed:', error)
    throw error
  }
}

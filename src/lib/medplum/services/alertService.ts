/**
 * Medplum 预警服务
 * 
 * 提供与 Medplum 预警系统的集成功能，包括：
 * - 预警规则配置
 * - Webhook 接收
 * - 通知集成
 * - 预警管理
 * 
 * @module lib/medplum/services/alertService
 */

import { getMedplumClient, withMedplumAuth } from '../client'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

/**
 * 预警类型
 */
export enum AlertType {
  REGULATORY_CHANGE = 'regulatory-change',
  DEVICE_SAFETY = 'device-safety',
  COMPLIANCE_ISSUE = 'compliance-issue',
  AUDIT_FINDING = 'audit-finding',
  SYSTEM_ALERT = 'system-alert'
}

/**
 * 预警状态
 */
export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived'
}

/**
 * 预警严重程度
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 预警接口
 */
export interface MedplumAlert {
  id: string
  type: AlertType
  title: string
  description: string
  severity: AlertSeverity
  status: AlertStatus
  source: 'medplum'
  jurisdiction?: string
  deviceId?: string
  regulationId?: string
  createdAt: string
  updatedAt: string
  medplumId: string
}

/**
 * 配置 Medplum 预警规则
 */
export async function configureAlertRules() {
  try {
    const medplumClient = getMedplumClient()
    
    if (!medplumClient.isAuthenticated()) {
      throw new Error('Not authenticated')
    }
    
    // 1. 创建监管变更预警任务
    const regulatoryRule = await medplumClient.createResource({
      resourceType: 'Task',
      status: 'ready',
      intent: 'order',
      code: {
        coding: [{
          system: 'https://mdlooker.com/alert-types',
          code: AlertType.REGULATORY_CHANGE,
          display: 'Regulatory Change'
        }]
      },
      priority: 'urgent',
      description: 'Regulatory change detected',
      focus: {
        reference: 'Organization/123'
      }
    })

    // 2. 创建设备安全预警任务
    const safetyRule = await medplumClient.createResource({
      resourceType: 'Task',
      status: 'ready',
      intent: 'order',
      code: {
        coding: [{
          system: 'https://mdlooker.com/alert-types',
          code: AlertType.DEVICE_SAFETY,
          display: 'Device Safety'
        }]
      },
      priority: 'stat',
      description: 'Device safety issue detected',
      focus: {
        reference: 'Organization/123'
      }
    })

    console.log('Medplum alert rules configured successfully')
    return { regulatoryRule, safetyRule }
  } catch (error) {
    console.error('Failed to configure alert rules:', error)
    throw error
  }
}

/**
 * 处理 Medplum Webhook 预警
 */
export async function handleMedplumWebhook(payload: unknown) {
  try {
    console.log('Received Medplum webhook:', payload)

    // 验证 payload
    const payloadAny = payload as any
    if (!payloadAny || !payloadAny.resourceType) {
      throw new Error('Invalid webhook payload')
    }

    // 处理 Alert 资源
    if (payloadAny.resourceType === 'Alert') {
      return await processMedplumAlert(payloadAny)
    }

    // 处理其他资源类型
    console.log('Unhandled resource type:', payloadAny.resourceType)
    return { success: false, message: 'Unhandled resource type' }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * 处理 Medplum 预警
 */
async function processMedplumAlert(alert: any): Promise<{ success: boolean; data?: MedplumAlert }> {
  try {
    // 映射 Medplum Alert 到 MDLooker Alert
    const mappedAlert: MedplumAlert = {
      id: `medplum-${alert.id}`,
      type: mapAlertType(alert.category?.[0]?.coding?.[0]?.code),
      title: alert.code?.coding?.[0]?.display || 'Medplum Alert',
      description: alert.description || '',
      severity: mapAlertSeverity(alert.severity),
      status: AlertStatus.ACTIVE,
      source: 'medplum',
      jurisdiction: alert.jurisdiction?.coding?.[0]?.display,
      deviceId: alert.subject?.reference?.replace('Device/', ''),
      regulationId: alert.context?.reference?.replace('RegulatoryAuthorization/', ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      medplumId: alert.id
    }

    // 保存到数据库
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        id: mappedAlert.id,
        type: mappedAlert.type,
        title: mappedAlert.title,
        description: mappedAlert.description,
        severity: mappedAlert.severity,
        status: mappedAlert.status,
        source: mappedAlert.source,
        jurisdiction: mappedAlert.jurisdiction,
        device_id: mappedAlert.deviceId,
        regulation_id: mappedAlert.regulationId,
        medplum_id: mappedAlert.medplumId
      })

    if (error) {
      console.error('Failed to save alert to database:', error)
      throw error
    }

    // 发送通知
    await sendAlertNotification(mappedAlert)

    return { success: true, data: mappedAlert }
  } catch (error) {
    console.error('Error processing Medplum alert:', error)
    throw error
  }
}

/**
 * 映射预警类型
 */
function mapAlertType(code?: string): AlertType {
  switch (code) {
    case AlertType.REGULATORY_CHANGE:
      return AlertType.REGULATORY_CHANGE
    case AlertType.DEVICE_SAFETY:
      return AlertType.DEVICE_SAFETY
    case AlertType.COMPLIANCE_ISSUE:
      return AlertType.COMPLIANCE_ISSUE
    case AlertType.AUDIT_FINDING:
      return AlertType.AUDIT_FINDING
    default:
      return AlertType.SYSTEM_ALERT
  }
}

/**
 * 映射预警严重程度
 */
function mapAlertSeverity(severity?: string): AlertSeverity {
  switch (severity) {
    case 'critical':
      return AlertSeverity.CRITICAL
    case 'high':
      return AlertSeverity.HIGH
    case 'medium':
      return AlertSeverity.MEDIUM
    default:
      return AlertSeverity.LOW
  }
}

/**
 * 发送预警通知
 */
async function sendAlertNotification(alert: MedplumAlert) {
  try {
    // 检查是否配置了 Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `*🚨 New Medplum Alert*\n` +
                `*Type*: ${alert.type}\n` +
                `*Severity*: ${alert.severity}\n` +
                `*Title*: ${alert.title}\n` +
                `*Description*: ${alert.description}\n` +
                `*Source*: ${alert.source}\n` +
                `*Jurisdiction*: ${alert.jurisdiction || 'N/A'}\n` +
                `*Device*: ${alert.deviceId || 'N/A'}\n` +
                `*Regulation*: ${alert.regulationId || 'N/A'}`
        })
      })
    }

    // 可以添加其他通知渠道
    console.log('Alert notification sent:', alert.id)
  } catch (error) {
    console.error('Failed to send alert notification:', error)
  }
}

/**
 * 获取 Medplum 预警列表
 */
export async function getMedplumAlerts(params?: {
  limit?: number
  offset?: number
  status?: AlertStatus
  severity?: AlertSeverity
  type?: AlertType
}) {
  try {
    const medplumClient = getMedplumClient()
    
    if (!medplumClient.isAuthenticated()) {
      throw new Error('Not authenticated')
    }
    
    const searchParams: Record<string, string> = {
      _count: (params?.limit || 20).toString(),
      _offset: (params?.offset || 0).toString(),
    }
    
    // 添加过滤条件
    if (params?.status) {
      searchParams.status = params.status
    }

    const result = await medplumClient.searchResources('Task', searchParams)
    return result
  } catch (error) {
    console.error('Failed to get Medplum alerts:', error)
    throw error
  }
}

/**
 * 更新预警状态
 */
export async function updateAlertStatus(alertId: string, status: AlertStatus) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('alerts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', alertId)

    if (error) {
      console.error('Failed to update alert status:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error updating alert status:', error)
    throw error
  }
}

/**
 * 集成现有通知系统
 */
export async function integrateNotificationSystem() {
  try {
    // 这里可以实现与现有通知系统的集成
    console.log('Notification system integrated successfully')
    return true
  } catch (error) {
    console.error('Failed to integrate notification system:', error)
    throw error
  }
}

/**
 * 测试预警功能
 */
export async function testAlertFunctionality() {
  try {
    // 1. 测试规则配置
    await configureAlertRules()

    // 2. 测试预警处理
    const testAlert = {
      resourceType: 'Alert',
      id: 'test-alert-123',
      status: 'active',
      category: [{
        coding: [{
          system: 'https://mdlooker.com/alert-types',
          code: AlertType.REGULATORY_CHANGE,
          display: 'Regulatory Change'
        }]
      }],
      severity: 'high',
      code: {
        coding: [{
          system: 'https://mdlooker.com/alert-codes',
          code: 'regulatory-update',
          display: 'Test Regulatory Update'
        }]
      },
      description: 'Test regulatory change alert',
      subject: {
        reference: 'Device/test-device-123'
      }
    }

    const result = await processMedplumAlert(testAlert)
    console.log('Test alert processed:', result)

    // 3. 测试通知
    await sendAlertNotification(result.data!)

    console.log('Alert functionality test completed successfully')
    return true
  } catch (error) {
    console.error('Alert functionality test failed:', error)
    throw error
  }
}

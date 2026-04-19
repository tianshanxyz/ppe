/**
 * 法规更新提醒系统 - 配置文件
 */

import { PPERegulation } from '@/lib/ppe-database-client'

// 法规更新类型
export type RegulationAlertType = 'NEW' | 'UPDATED' | 'EXPIRED' | 'REPLACED' | 'REVIEWING'

// 风险等级
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// 法规更新提醒
export interface RegulationAlert {
  id: string
  regulation_id: string
  title: string
  jurisdiction: string
  alert_type: RegulationAlertType
  message: string
  detected_at: string
  severity: AlertSeverity
  metadata?: Record<string, any>
}

// 法规更新规则
export interface RegulationAlertRule {
  id: string
  name: string
  description: string
  condition: (regulation: PPERegulation, lastSync: Date) => boolean
  severity: AlertSeverity
  message: string | ((regulation: PPERegulation) => string)
  alertType: RegulationAlertType
}

// 同步配置
export interface RegulationSyncConfig {
  phase: 'mvp' | 'growth' | 'full'
  maxRecords: number
  yearRange: number
  batchSize: number
  delayMs: number
  incremental: boolean
}

// 阶段配置
export const regulationConfigs: Record<string, RegulationSyncConfig> = {
  mvp: {
    phase: 'mvp',
    maxRecords: 5000,
    yearRange: 5,
    batchSize: 100,
    delayMs: 1000,
    incremental: true
  },
  growth: {
    phase: 'growth',
    maxRecords: 50000,
    yearRange: 10,
    batchSize: 500,
    delayMs: 500,
    incremental: true
  },
  full: {
    phase: 'full',
    maxRecords: 200000,
    yearRange: 20,
    batchSize: 1000,
    delayMs: 200,
    incremental: true
  }
}

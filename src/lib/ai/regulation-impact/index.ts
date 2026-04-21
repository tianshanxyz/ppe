/**
 * 法规变更影响分析系统 - 主入口
 *
 * A-008: 法规变更影响分析
 */

// 导出类型
export {
  RegulationChangeType,
  ImpactSeverity,
  ImpactScope,
  RegulationChange,
  AffectedProduct,
  AffectedCompany,
  ImpactAnalysis,
  ImpactReport,
  MonitoringConfig,
  MonitoringTask,
  ImpactAnalysisRequest,
  ImpactQueryRequest,
  DEFAULT_MONITORING_CONFIG,
  CHANGE_TYPE_LABELS,
  SEVERITY_LABELS,
  SEVERITY_COLORS,
  SCOPE_LABELS,
} from './types'

// 导出变更检测器
export { RegulationChangeDetector, changeDetector } from './change-detector'

// 导出影响分析引擎
export { ImpactAnalyzer, impactAnalyzer } from './analyzer'

// 导出报告生成器
export { ReportGenerator, reportGenerator } from './report-generator'

// 导出监控服务
export { RegulationMonitor, regulationMonitor } from './monitor'

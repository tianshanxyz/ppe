/**
 * 监控系统
 * Phase 2: 智能解析模型开发
 *
 * 提供性能监控、指标收集和告警功能
 */

import { EventEmitter } from 'events';

/**
 * 指标类型
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

/**
 * 指标数据点
 */
export interface MetricDataPoint {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

/**
 * 指标定义
 */
export interface Metric {
  name: string;
  type: MetricType;
  description: string;
  unit?: string;
  dataPoints: MetricDataPoint[];
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 请求总数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 最小响应时间（毫秒） */
  minResponseTime: number;
  /** 最大响应时间（毫秒） */
  maxResponseTime: number;
  /** 每秒请求数 */
  requestsPerSecond: number;
  /** 错误率（百分比） */
  errorRate: number;
}

/**
 * 资源使用指标
 */
export interface ResourceMetrics {
  /** CPU 使用率（百分比） */
  cpuUsage: number;
  /** 内存使用（MB） */
  memoryUsage: number;
  /** 内存总量（MB） */
  memoryTotal: number;
  /** 网络请求数 */
  networkRequests: number;
  /** 活跃连接数 */
  activeConnections: number;
}

/**
 * 解析器指标
 */
export interface ParserMetrics {
  /** 解析器名称 */
  parserName: string;
  /** 成功解析数 */
  successCount: number;
  /** 失败解析数 */
  failureCount: number;
  /** 解析的产品数 */
  productsParsed: number;
  /** 平均解析时间（毫秒） */
  averageParseTime: number;
  /** 最后更新时间 */
  lastUpdateTime: string;
}

/**
 * 告警级别
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * 告警规则
 */
export interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  level: AlertLevel;
  duration: number; // 持续时间（毫秒）
  enabled: boolean;
}

/**
 * 告警事件
 */
export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  level: AlertLevel;
  message: string;
  metricValue: number;
  threshold: number;
  timestamp: string;
  resolved?: boolean;
  resolvedAt?: string;
}

/**
 * 监控配置
 */
export interface MonitorConfig {
  /** 收集间隔（毫秒） */
  collectionInterval: number;
  /** 是否启用性能监控 */
  enablePerformance: boolean;
  /** 是否启用资源监控 */
  enableResource: boolean;
  /** 是否启用告警 */
  enableAlerts: boolean;
  /** 数据保留时间（毫秒） */
  dataRetention: number;
}

/**
 * 监控器
 */
export class Monitor extends EventEmitter {
  readonly name = 'Monitor';

  private config: MonitorConfig;
  private metrics: Map<string, Metric> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertHistory: AlertEvent[] = [];
  private collectionTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;

  // 性能统计
  private requestTimes: number[] = [];
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;

  constructor(config?: Partial<MonitorConfig>) {
    super();

    this.config = {
      collectionInterval: 60000, // 1 minute
      enablePerformance: true,
      enableResource: true,
      enableAlerts: true,
      dataRetention: 86400000, // 24 hours
      ...config,
    };
  }

  /**
   * 启动监控
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // 启动指标收集
    this.collectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);

    console.log(`[${this.name}] Monitor started`);
    this.emit('started');
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }

    console.log(`[${this.name}] Monitor stopped`);
    this.emit('stopped');
  }

  /**
   * 记录请求
   */
  recordRequest(duration: number, success: boolean = true): void {
    this.totalRequests++;

    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }

    this.requestTimes.push(duration);

    // 限制存储的请求时间数量
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }

    // 更新指标
    this.updateMetric('requests_total', MetricType.COUNTER, 1);
    this.updateMetric('request_duration', MetricType.HISTOGRAM, duration);

    if (!success) {
      this.updateMetric('requests_failed', MetricType.COUNTER, 1);
    }
  }

  /**
   * 记录解析
   */
  recordParse(parserName: string, duration: number, success: boolean, productCount: number = 0): void {
    const metricName = `parser_${parserName}_parse_time`;
    this.updateMetric(metricName, MetricType.TIMER, duration, { parser: parserName });

    if (success) {
      this.updateMetric(`parser_${parserName}_success`, MetricType.COUNTER, 1, { parser: parserName });
    } else {
      this.updateMetric(`parser_${parserName}_failure`, MetricType.COUNTER, 1, { parser: parserName });
    }

    if (productCount > 0) {
      this.updateMetric(`parser_${parserName}_products`, MetricType.COUNTER, productCount, { parser: parserName });
    }
  }

  /**
   * 更新指标
   */
  updateMetric(name: string, type: MetricType, value: number, labels?: Record<string, string>): void {
    let metric = this.metrics.get(name);

    if (!metric) {
      metric = {
        name,
        type,
        description: '',
        dataPoints: [],
      };
      this.metrics.set(name, metric);
    }

    metric.dataPoints.push({
      timestamp: Date.now(),
      value,
      labels,
    });

    // 清理过期数据
    this.cleanOldData(metric);

    // 检查告警
    if (this.config.enableAlerts) {
      this.checkAlerts(name, value);
    }
  }

  /**
   * 获取指标
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * 获取所有指标
   */
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 计算最近一分钟的请求
    const recentRequests = this.requestTimes.filter((_, index) => {
      // 简化处理，假设请求均匀分布
      return index >= this.requestTimes.length - 60;
    });

    const avgTime = recentRequests.length > 0
      ? recentRequests.reduce((a, b) => a + b, 0) / recentRequests.length
      : 0;

    const minTime = recentRequests.length > 0 ? Math.min(...recentRequests) : 0;
    const maxTime = recentRequests.length > 0 ? Math.max(...recentRequests) : 0;

    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      averageResponseTime: avgTime,
      minResponseTime: minTime,
      maxResponseTime: maxTime,
      requestsPerSecond: recentRequests.length / 60,
      errorRate: this.totalRequests > 0
        ? (this.failedRequests / this.totalRequests) * 100
        : 0,
    };
  }

  /**
   * 获取资源使用指标
   */
  getResourceMetrics(): ResourceMetrics {
    const memUsage = process.memoryUsage();

    return {
      cpuUsage: 0, // 需要额外实现
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024),
      memoryTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      networkRequests: this.totalRequests,
      activeConnections: 0, // 需要额外实现
    };
  }

  /**
   * 获取解析器指标
   */
  getParserMetrics(parserName: string): ParserMetrics | undefined {
    const successMetric = this.metrics.get(`parser_${parserName}_success`);
    const failureMetric = this.metrics.get(`parser_${parserName}_failure`);
    const productsMetric = this.metrics.get(`parser_${parserName}_products`);
    const timeMetric = this.metrics.get(`parser_${parserName}_parse_time`);

    if (!successMetric && !failureMetric) {
      return undefined;
    }

    const successCount = successMetric?.dataPoints.reduce((sum, dp) => sum + dp.value, 0) || 0;
    const failureCount = failureMetric?.dataPoints.reduce((sum, dp) => sum + dp.value, 0) || 0;
    const productsParsed = productsMetric?.dataPoints.reduce((sum, dp) => sum + dp.value, 0) || 0;

    let avgTime = 0;
    if (timeMetric && timeMetric.dataPoints.length > 0) {
      avgTime = timeMetric.dataPoints.reduce((sum, dp) => sum + dp.value, 0) / timeMetric.dataPoints.length;
    }

    return {
      parserName,
      successCount,
      failureCount,
      productsParsed,
      averageParseTime: avgTime,
      lastUpdateTime: new Date().toISOString(),
    };
  }

  /**
   * 添加告警规则
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullRule: AlertRule = { ...rule, id };

    this.alertRules.set(id, fullRule);
    console.log(`[${this.name}] Alert rule added: ${rule.name}`);

    return fullRule;
  }

  /**
   * 移除告警规则
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      console.log(`[${this.name}] Alert rule removed: ${ruleId}`);
    }
    return removed;
  }

  /**
   * 获取告警历史
   */
  getAlertHistory(level?: AlertLevel): AlertEvent[] {
    if (level) {
      return this.alertHistory.filter((alert) => alert.level === level);
    }
    return [...this.alertHistory];
  }

  /**
   * 获取活跃告警
   */
  getActiveAlerts(): AlertEvent[] {
    return this.alertHistory.filter((alert) => !alert.resolved);
  }

  /**
   * 解决告警
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alertHistory.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.emit('alertResolved', alert);
      return true;
    }
    return false;
  }

  /**
   * 收集指标
   */
  private collectMetrics(): void {
    if (this.config.enableResource) {
      const resourceMetrics = this.getResourceMetrics();
      this.updateMetric('memory_usage', MetricType.GAUGE, resourceMetrics.memoryUsage);
      this.updateMetric('memory_total', MetricType.GAUGE, resourceMetrics.memoryTotal);
    }

    if (this.config.enablePerformance) {
      const perfMetrics = this.getPerformanceMetrics();
      this.updateMetric('requests_per_second', MetricType.GAUGE, perfMetrics.requestsPerSecond);
      this.updateMetric('error_rate', MetricType.GAUGE, perfMetrics.errorRate);
    }

    this.emit('metricsCollected', this.getAllMetrics());
  }

  /**
   * 清理过期数据
   */
  private cleanOldData(metric: Metric): void {
    const cutoff = Date.now() - this.config.dataRetention;
    metric.dataPoints = metric.dataPoints.filter((dp) => dp.timestamp > cutoff);
  }

  /**
   * 检查告警
   */
  private checkAlerts(metricName: string, value: number): void {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled || rule.metricName !== metricName) {
        continue;
      }

      const triggered = this.evaluateCondition(value, rule.condition, rule.threshold);

      if (triggered) {
        // 检查是否已存在未解决的相同告警
        const existingAlert = this.alertHistory.find(
          (a) => a.ruleId === rule.id && !a.resolved
        );

        if (!existingAlert) {
          const alert: AlertEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            ruleName: rule.name,
            level: rule.level,
            message: `${rule.name}: ${metricName} is ${value} (threshold: ${rule.threshold})`,
            metricValue: value,
            threshold: rule.threshold,
            timestamp: new Date().toISOString(),
          };

          this.alertHistory.push(alert);
          this.emit('alert', alert);
          console.warn(`[${this.name}] Alert triggered: ${alert.message}`);
        }
      }
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * 导出指标数据
   */
  exportMetrics(format: 'json' | 'prometheus' = 'json'): string {
    if (format === 'prometheus') {
      return this.exportPrometheusFormat();
    }

    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.getAllMetrics(),
      performance: this.getPerformanceMetrics(),
      resource: this.getResourceMetrics(),
    }, null, 2);
  }

  /**
   * 导出 Prometheus 格式
   */
  private exportPrometheusFormat(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.description}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      for (const dp of metric.dataPoints.slice(-10)) {
        const labels = dp.labels
          ? Object.entries(dp.labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(',')
          : '';
        lines.push(`${metric.name}${labels ? `{${labels}}` : ''} ${dp.value}`);
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}

/**
 * 全局监控器实例
 */
let globalMonitor: Monitor | null = null;

/**
 * 获取全局监控器
 */
export function getMonitor(): Monitor {
  if (!globalMonitor) {
    globalMonitor = new Monitor();
  }
  return globalMonitor;
}

/**
 * 设置全局监控器
 */
export function setMonitor(monitor: Monitor): void {
  globalMonitor = monitor;
}

/**
 * 创建监控器
 */
export function createMonitor(config?: Partial<MonitorConfig>): Monitor {
  return new Monitor(config);
}

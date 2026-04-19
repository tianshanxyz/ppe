import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry: client.Registry;

  // 常用指标
  private readonly httpRequestCounter: client.Counter;
  private readonly httpRequestDuration: client.Histogram;
  private readonly httpRequestSummary: client.Summary;
  private readonly activeConnections: client.Gauge;

  constructor() {
    this.registry = new client.Registry();
    
    // 添加默认指标
    this.registry.setDefaultLabels({
      app: 'ppe-platform',
    });
    
    client.collectDefaultMetrics({ register: this.registry });

    // HTTP 请求计数器
    this.httpRequestCounter = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status_code'],
      registers: [this.registry],
    });

    // HTTP 请求耗时
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    // HTTP 请求摘要
    this.httpRequestSummary = new client.Summary({
      name: 'http_request_duration_summary_seconds',
      help: 'Summary of HTTP request duration in seconds',
      labelNames: ['method', 'path'],
      percentiles: [0.5, 0.9, 0.99],
      registers: [this.registry],
    });

    // 活跃连接数
    this.activeConnections = new client.Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    console.log('Metrics service initialized');
  }

  /**
   * 记录 HTTP 请求
   */
  recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    this.httpRequestCounter.inc({ method, path, status_code: statusCode });
    this.httpRequestDuration.observe({ method, path }, durationSeconds);
    this.httpRequestSummary.observe({ method, path }, durationSeconds);
  }

  /**
   * 更新活跃连接数
   */
  updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  /**
   * 获取所有指标
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * 增加自定义计数器
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    let counter = this.registry.getSingleMetric(name) as client.Counter;
    if (!counter) {
      counter = new client.Counter({
        name,
        help: `Custom counter: ${name}`,
        labelNames: labels ? Object.keys(labels) : [],
        registers: [this.registry],
      });
    }
    counter.inc(labels || {});
  }

  /**
   * 更新自定义仪表
   */
  updateGauge(name: string, value: number, labels?: Record<string, string>): void {
    let gauge = this.registry.getSingleMetric(name) as client.Gauge;
    if (!gauge) {
      gauge = new client.Gauge({
        name,
        help: `Custom gauge: ${name}`,
        labelNames: labels ? Object.keys(labels) : [],
        registers: [this.registry],
      });
    }
    gauge.set(labels || {}, value);
  }
}

# 性能基准测试方案 - AI-001

**任务**: AI-001 智能解析模型  
**日期**: 2026-04-18  
**负责人**: AI工程师  
**状态**: 🟡 进行中

---

## 🎯 测试目标

1. **建立性能基线** - 量化系统各项性能指标
2. **识别性能瓶颈** - 发现影响性能的关键环节
3. **验证设计目标** - 确认是否达到预设性能指标
4. **支持容量规划** - 为生产环境部署提供数据支撑

---

## 📊 关键性能指标 (KPI)

### 1. 解析性能指标

| 指标名称 | 目标值 | 可接受范围 | 测试方法 |
|---------|--------|-----------|---------|
| 静态页面解析时间 | < 500ms | < 1000ms | 单页面多次测试取平均 |
| 动态页面解析时间 | < 3s | < 5s | Puppeteer 渲染时间 |
| 字段识别准确率 | ≥ 95% | ≥ 90% | 人工标注对比 |
| 数据提取完整率 | ≥ 98% | ≥ 95% | 字段缺失统计 |
| 单页并发处理能力 | 10 req/s | ≥ 5 req/s | 压力测试 |

### 2. AI 模型性能指标

| 指标名称 | 目标值 | 可接受范围 | 测试方法 |
|---------|--------|-----------|---------|
| 模型推理时间 | < 100ms | < 200ms | 单条数据推理 |
| 模型内存占用 | < 2GB | < 4GB | 进程内存监控 |
| 模型加载时间 | < 30s | < 60s | 冷启动时间 |
| 批量处理吞吐量 | 1000条/分钟 | ≥ 500条/分钟 | 批量测试 |

### 3. 系统资源指标

| 指标名称 | 目标值 | 可接受范围 | 测试方法 |
|---------|--------|-----------|---------|
| CPU 使用率 | < 70% | < 85% | 系统监控 |
| 内存使用率 | < 80% | < 90% | 系统监控 |
| 磁盘 I/O | < 100MB/s | < 200MB/s | iostat |
| 网络带宽 | < 50Mbps | < 100Mbps | 带宽监控 |

---

## 🏗️ 测试环境

### 开发环境
```yaml
环境名称: dev
配置:
  CPU: 4核
  内存: 8GB
  存储: 100GB SSD
  网络: 100Mbps
用途: 功能开发、单元测试
```

### 测试环境
```yaml
环境名称: staging
配置:
  CPU: 8核
  内存: 16GB
  存储: 500GB SSD
  网络: 1Gbps
用途: 性能测试、集成测试
```

### 生产环境（参考）
```yaml
环境名称: production
配置:
  CPU: 16核
  内存: 32GB
  存储: 1TB SSD
  网络: 10Gbps
用途: 生产部署
```

---

## 🧪 测试场景设计

### 场景 1: 单页面解析基准测试

**目的**: 测量单个页面的解析性能

**测试数据**:
- FDA 列表页: 50 个不同页面
- NMPA 列表页: 50 个不同页面
- FDA 详情页: 50 个不同页面
- NMPA 详情页: 50 个不同页面

**测试步骤**:
```typescript
async function benchmarkSinglePage(url: string, parser: PPEParser) {
  const times: number[] = [];
  
  // 预热
  await parser.parse(url);
  
  // 正式测试 10 次
  for (let i = 0; i < 10; i++) {
    const start = Date.now();
    await parser.parse(url);
    times.push(Date.now() - start);
  }
  
  return {
    avg: times.reduce((a, b) => a + b) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    p95: percentile(times, 95),
    p99: percentile(times, 99),
  };
}
```

**预期结果**:
- FDA 静态页面: 平均 < 500ms
- NMPA 动态页面: 平均 < 3s

---

### 场景 2: 并发压力测试

**目的**: 测试系统在高并发下的表现

**测试配置**:
```typescript
const concurrencyLevels = [1, 5, 10, 20, 50];
const testDuration = 60; // 秒
```

**测试步骤**:
```typescript
async function benchmarkConcurrency(
  urls: string[],
  concurrency: number,
  duration: number
) {
  const results = [];
  const startTime = Date.now();
  
  // 使用 Promise pool 控制并发
  const pool = new PromisePool(concurrency);
  
  while (Date.now() - startTime < duration * 1000) {
    const url = getRandomUrl(urls);
    pool.add(() => parser.parse(url));
  }
  
  await pool.all();
  
  return {
    totalRequests: results.length,
    successRate: results.filter(r => r.success).length / results.length,
    avgResponseTime: calculateAvg(results.map(r => r.time)),
    throughput: results.length / duration, // req/s
  };
}
```

**预期结果**:
- 并发 10: 吞吐量 ≥ 10 req/s，成功率 ≥ 99%
- 并发 50: 吞吐量 ≥ 30 req/s，成功率 ≥ 95%

---

### 场景 3: AI 模型推理性能测试

**目的**: 测量 AI 模型的推理性能

**测试数据**:
- 字段识别样本: 1000 条
- HTML 结构样本: 500 条

**测试步骤**:
```python
import time
import psutil
import torch

def benchmark_model(model, test_data):
    # 预热
    for _ in range(10):
        model(test_data[0])
    
    # 测试单条推理
    single_times = []
    for item in test_data[:100]:
        start = time.time()
        model(item)
        single_times.append(time.time() - start)
    
    # 测试批量推理
    batch_sizes = [1, 8, 16, 32, 64]
    batch_results = {}
    
    for batch_size in batch_sizes:
        times = []
        for i in range(0, len(test_data), batch_size):
            batch = test_data[i:i+batch_size]
            start = time.time()
            model(batch)
            times.append(time.time() - start)
        
        batch_results[batch_size] = {
            'avg_time': sum(times) / len(times),
            'throughput': len(test_data) / sum(times),
        }
    
    # 内存占用
    process = psutil.Process()
    memory_mb = process.memory_info().rss / 1024 / 1024
    
    return {
        'single_inference': {
            'avg_ms': sum(single_times) / len(single_times) * 1000,
            'p95_ms': percentile(single_times, 95) * 1000,
        },
        'batch_inference': batch_results,
        'memory_mb': memory_mb,
    }
```

**预期结果**:
- 单条推理: < 100ms
- 批量 32: 吞吐量 ≥ 500条/秒
- 内存占用: < 2GB

---

### 场景 4: 端到端数据流测试

**目的**: 测试完整数据流的性能

**测试流程**:
```
URL列表 → 采集 → 解析 → AI识别 → 数据清洗 → 存储
```

**测试数据量**:
- 小规模: 100 条
- 中规模: 1000 条
- 大规模: 10000 条

**监控指标**:
- 总处理时间
- 各环节耗时占比
- 数据成功率
- 资源使用率

---

### 场景 5: 长时间稳定性测试

**目的**: 测试系统在长时间运行下的稳定性

**测试时长**: 24 小时

**测试内容**:
- 持续采集和解析
- 每小时记录性能指标
- 监控内存泄漏
- 监控错误率

**通过标准**:
- 内存增长 < 10%
- 错误率 < 1%
- 无崩溃或死锁

---

## 📈 测试工具

### 1. 性能测试框架

```typescript
// 自定义性能测试框架
class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];
  
  async run<T>(
    name: string,
    fn: () => Promise<T>,
    options: BenchmarkOptions = {}
  ): Promise<BenchmarkResult> {
    const {
      iterations = 10,
      warmup = 3,
    } = options;
    
    // 预热
    for (let i = 0; i < warmup; i++) {
      await fn();
    }
    
    // 正式测试
    const times: number[] = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      times.push(performance.now() - start);
    }
    
    const result: BenchmarkResult = {
      name,
      iterations,
      avg: times.reduce((a, b) => a + b) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      p95: percentile(times, 95),
      p99: percentile(times, 99),
    };
    
    this.results.push(result);
    return result;
  }
  
  generateReport(): string {
    // 生成 Markdown 报告
    return generateMarkdownReport(this.results);
  }
}
```

### 2. 监控工具

```yaml
# 监控工具栈
工具:
  - name: Prometheus
    用途: 指标收集
    端口: 9090
  
  - name: Grafana
    用途: 可视化
    端口: 3000
  
  - name: Jaeger
    用途: 分布式追踪
    端口: 16686
  
  - name: pprof
    用途: Go/Python 性能分析
    端口: 6060
```

---

## 📅 测试计划

### Phase 1: 基础性能测试 (W5)
- [ ] 单页面解析基准测试
- [ ] AI 模型推理性能测试
- [ ] 建立性能基线

### Phase 2: 压力测试 (W6)
- [ ] 并发压力测试
- [ ] 容量上限测试
- [ ] 性能优化验证

### Phase 3: 稳定性测试 (W7)
- [ ] 24 小时稳定性测试
- [ ] 内存泄漏检测
- [ ] 长时间运行性能衰减测试

### Phase 4: 端到端测试 (W8)
- [ ] 完整数据流测试
- [ ] 生产环境模拟测试
- [ ] 性能调优建议

---

## 📊 测试报告模板

```markdown
# 性能测试报告 - [测试名称]

**测试日期**: YYYY-MM-DD  
**测试人员**: AI工程师  
**测试环境**: staging/production

## 测试概要

| 指标 | 目标值 | 实际值 | 状态 |
|------|--------|--------|------|
| 平均响应时间 | < 500ms | 450ms | ✅ 通过 |
| 吞吐量 | ≥ 10 req/s | 12 req/s | ✅ 通过 |
| 成功率 | ≥ 99% | 99.5% | ✅ 通过 |

## 详细结果

[图表和详细数据]

## 性能瓶颈

1. [瓶颈描述]
   - 影响: [影响程度]
   - 建议: [优化建议]

## 优化建议

1. [建议1]
2. [建议2]

## 结论

[测试结论]
```

---

## 🎯 下一步行动

1. **本周完成**: 搭建测试环境和工具链
2. **下周开始**: 执行基础性能测试
3. **持续进行**: 每次代码变更后回归测试

---

**最后更新**: 2026-04-18  
**下次更新**: 完成基础性能测试后

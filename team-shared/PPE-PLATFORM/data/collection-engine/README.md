# PPE 数据采集引擎

**版本**: v1.0.0  
**数据工程师**: 数据工程师  
**创建日期**: 2026-04-18

---

## 一、项目概述

全球 PPE 数据采集引擎是一个用于采集全球主要国家/地区 PPE（个人防护装备）注册数据的专业工具。

### 支持的数据源

| 数据源 | 国家/地区 | 采集方式 | 优先级 |
|--------|----------|----------|--------|
| FDA | 美国 | Web Scraping | P0 |
| EUDAMED | 欧盟 | Web Scraping | P0 |
| NMPA | 中国 | Web Scraping | P0 |
| PMDA | 日本 | Web Scraping | P0 |
| TGA | 澳大利亚 | Web Scraping | P0 |
| HealthCanada | 加拿大 | Web Scraping | P0 |

---

## 二、核心功能

### 2.1 采集能力

- ✅ **网页抓取**: 基于 Puppeteer 的动态网页采集
- ✅ **API 调用**: 基于 Axios 的 REST API 采集
- ✅ **数据解析**: 基于 Cheerio 的 HTML 解析
- ✅ **批量处理**: 支持大批量数据的分批采集

### 2.2 反爬策略

- ✅ **代理轮换**: 支持 HTTP/HTTPS/SOCKS 代理
- ✅ **User-Agent 轮换**: 内置 20+ 真实浏览器 UA
- ✅ **请求限流**: 可配置的 QPS 限制
- ✅ **随机延迟**: 模拟人类操作间隔
- ✅ **行为模拟**: 鼠标移动、页面滚动等

### 2.3 可靠性保障

- ✅ **错误重试**: 指数退避重试机制
- ✅ **断点续传**: 支持任务中断后恢复
- ✅ **日志记录**: 完整的操作日志
- ✅ **进度追踪**: 实时采集进度监控

---

## 三、项目结构

```
collection-engine/
├── src/
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── core/
│   │   └── BaseCollector.ts  # 基础采集器抽象类
│   ├── collectors/           # 具体数据源采集器
│   │   ├── FDACollector.ts
│   │   ├── EUDAMEDCollector.ts
│   │   ├── NMPACollector.ts
│   │   ├── PMDACollector.ts
│   │   ├── TGACollector.ts
│   │   └── HealthCanadaCollector.ts
│   ├── utils/
│   │   ├── Logger.ts         # 日志工具
│   │   ├── ProxyManager.ts   # 代理管理器
│   │   └── UserAgentRotator.ts # UA 轮换器
│   ├── services/
│   │   └── DatabaseService.ts # 数据库服务
│   └── index.ts              # 入口文件
├── logs/                     # 日志目录
├── package.json
├── tsconfig.json
└── README.md
```

---

## 四、快速开始

### 4.1 安装依赖

```bash
cd collection-engine
npm install
```

### 4.2 配置环境变量

创建 `.env` 文件：

```env
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# 代理配置（可选）
PROXY_LIST=http://proxy1:8080,http://proxy2:8080

# 日志级别
LOG_LEVEL=info
```

### 4.3 运行采集任务

```bash
# 开发模式
npm run dev

# 编译运行
npm run build
npm start
```

---

## 五、使用示例

### 5.1 基础采集

```typescript
import { FDACollector } from './collectors/FDACollector';

const collector = new FDACollector({
  sourceType: 'FDA',
  baseUrl: 'https://www.accessdata.fda.gov',
  headless: true,
  batchSize: 100,
});

const result = await collector.collect({
  category: '呼吸防护',
  dateFrom: new Date('2024-01-01'),
});

console.log(`采集完成: ${result.successCount} 条记录`);
```

### 5.2 使用代理

```typescript
import { FDACollector } from './collectors/FDACollector';

const collector = new FDACollector(
  {
    sourceType: 'FDA',
    baseUrl: 'https://www.accessdata.fda.gov',
    useProxy: true,
  },
  {
    enabled: true,
    rotateProxy: true,
    rotateUserAgent: true,
  }
);
```

### 5.3 监控进度

```typescript
const collector = new FDACollector({...});

// 定时检查进度
const interval = setInterval(() => {
  const progress = collector.getProgress();
  console.log(`进度: ${progress.percentage}%`);
}, 5000);

const result = await collector.collect();
clearInterval(interval);
```

---

## 六、开发新采集器

继承 `BaseCollector` 类并实现抽象方法：

```typescript
import { BaseCollector } from '../core/BaseCollector';
import { CollectionResult, CollectionFilter, PPEProduct, PPEManufacturer, PPECertification } from '../types';
import * as cheerio from 'cheerio';

export class CustomCollector extends BaseCollector {
  async collect(filter?: CollectionFilter): Promise<CollectionResult> {
    this.startTime = Date.now();
    this.status = 'running';
    
    try {
      // 1. 获取页面内容
      const html = await this.fetchWithPuppeteer('https://example.com/ppe');
      
      // 2. 解析 HTML
      const $ = this.parseHTML(html);
      
      // 3. 提取数据
      $('.product-item').each((_, element) => {
        const product = this.parseProduct(element, $);
        if (product) {
          this.collectedProducts.push(product);
        }
      });
      
      // 4. 保存数据
      await this.batchSave();
      
      this.status = 'completed';
      return this.getResult();
      
    } catch (error) {
      this.status = 'failed';
      this.recordError(error as Error);
      return this.getResult();
    } finally {
      await this.closeBrowser();
    }
  }
  
  parseProduct(element: cheerio.Element, $: cheerio.CheerioAPI): PPEProduct | null {
    // 实现产品解析逻辑
    return {
      productName: $(element).find('.name').text(),
      category: '呼吸防护',
      dataSource: 'Custom',
      sourceId: $(element).attr('data-id') || '',
    };
  }
  
  parseManufacturer(element: cheerio.Element, $: cheerio.CheerioAPI): PPEManufacturer | null {
    // 实现制造商解析逻辑
    return null;
  }
  
  parseCertification(element: cheerio.Element, $: cheerio.CheerioAPI): PPECertification | null {
    // 实现认证解析逻辑
    return null;
  }
}
```

---

## 七、配置说明

### 7.1 CollectorConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| sourceType | DataSourceType | - | 数据源类型 |
| baseUrl | string | - | 基础 URL |
| requestTimeout | number | 30000 | 请求超时(ms) |
| retryAttempts | number | 3 | 重试次数 |
| retryDelay | number | 1000 | 重试延迟(ms) |
| rateLimitPerSecond | number | 2 | 每秒请求限制 |
| useProxy | boolean | false | 是否使用代理 |
| headless | boolean | true | 是否无头模式 |
| batchSize | number | 100 | 批量保存大小 |

### 7.2 AntiCrawlConfig

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| enabled | boolean | true | 是否启用反爬 |
| rotateUserAgent | boolean | true | 轮换 UA |
| rotateProxy | boolean | false | 轮换代理 |
| randomDelay | boolean | true | 随机延迟 |
| minDelay | number | 1000 | 最小延迟(ms) |
| maxDelay | number | 5000 | 最大延迟(ms) |
| simulateHuman | boolean | true | 模拟人类行为 |

---

## 八、日志说明

日志文件位于 `logs/` 目录：

- `{sourceType}.log` - 各数据源的采集日志
- `error.log` - 错误日志

日志格式：
```
2026-04-18 10:30:00 [INFO] [FDA] Task started {"taskId": "xxx"}
2026-04-18 10:30:05 [WARN] [FDA] Request failed (attempt 1/3)
2026-04-18 10:35:00 [INFO] [FDA] Task completed {"successCount": 100}
```

---

## 九、性能优化

### 9.1 并发控制

- 使用 `p-throttle` 进行请求限流
- 默认每秒 2 个请求
- 可根据目标网站调整

### 9.2 内存优化

- 批量保存数据，避免内存溢出
- 及时关闭浏览器实例
- 定期清理临时数据

### 9.3 网络优化

- 使用代理池分散请求
- 启用 HTTP Keep-Alive
- 合理设置超时时间

---

## 十、注意事项

1. **遵守 robots.txt** - 采集前检查目标网站的 robots.txt
2. **控制采集频率** - 避免对目标网站造成压力
3. **数据隐私** - 遵守相关数据保护法规
4. **错误处理** - 做好异常处理和日志记录
5. **定期更新** - 目标网站改版时更新采集规则

---

## 十一、后续开发计划

- [ ] 实现具体数据源采集器（FDA、EUDAMED等）
- [ ] 集成 Supabase 数据库服务
- [ ] 实现定时任务调度
- [ ] 添加数据清洗和验证
- [ ] 完善单元测试

---

## 十二、联系方式

如有问题请联系数据工程师。

---

**最后更新**: 2026-04-18

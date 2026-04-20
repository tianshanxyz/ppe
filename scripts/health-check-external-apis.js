#!/usr/bin/env node

/**
 * 外部 API 健康检查脚本
 * 监控 FDA、EUDAMED 等外部数据源的健康状态
 */

const https = require('https');
const http = require('http');

// 配置监控的 API 列表
const APIS_TO_MONITOR = [
  {
    name: 'FDA API',
    url: 'https://api.fda.gov',
    timeout: 5000,
    expectedStatus: 200
  },
  {
    name: 'EUDAMED',
    url: 'https://ec.europa.eu',
    timeout: 5000,
    expectedStatus: 200
  },
  {
    name: 'NMPA',
    url: 'https://www.nmpa.gov.cn',
    timeout: 5000,
    expectedStatus: 200
  }
];

/**
 * 检查单个 API 的健康状态
 */
async function checkApiHealth(api) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const client = api.url.startsWith('https') ? https : http;
    
    const request = client.get(api.url, { timeout: api.timeout }, (res) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        name: api.name,
        status: res.statusCode === api.expectedStatus ? 'healthy' : 'unhealthy',
        statusCode: res.statusCode,
        responseTime: responseTime,
        timestamp: new Date().toISOString()
      });
    });
    
    request.on('error', (error) => {
      resolve({
        name: api.name,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    });
    
    request.on('timeout', () => {
      request.destroy();
      resolve({
        name: api.name,
        status: 'timeout',
        error: 'Request timeout',
        timestamp: new Date().toISOString()
      });
    });
  });
}

/**
 * 发送告警通知
 */
function sendAlert(failedApis) {
  const message = {
    alert_type: 'external_api_health',
    severity: failedApis.length >= 2 ? 'critical' : 'warning',
    timestamp: new Date().toISOString(),
    failed_apis: failedApis,
    message: `${failedApis.length} external API(s) health check failed`
  };
  
  console.log('🚨 ALERT:', JSON.stringify(message, null, 2));
  
  // 这里可以集成 Slack、钉钉等通知渠道
  // 例如：调用 webhook URL
}

/**
 * 主函数
 */
async function main() {
  console.log('🔍 Starting external API health check...');
  
  const results = await Promise.all(
    APIS_TO_MONITOR.map(api => checkApiHealth(api))
  );
  
  const healthyApis = results.filter(r => r.status === 'healthy');
  const failedApis = results.filter(r => r.status !== 'healthy');
  
  console.log('\n📊 Health Check Results:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const icon = result.status === 'healthy' ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (result.responseTime) {
      console.log(`   Response Time: ${result.responseTime}ms`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('='.repeat(50));
  console.log(`Total: ${results.length} | Healthy: ${healthyApis.length} | Failed: ${failedApis.length}`);
  
  // 如果有失败的 API，发送告警
  if (failedApis.length > 0) {
    sendAlert(failedApis);
    process.exit(1);
  }
  
  console.log('✅ All external APIs are healthy');
  process.exit(0);
}

// 运行检查
main().catch((error) => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});

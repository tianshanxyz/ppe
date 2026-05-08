#!/usr/bin/env node
/**
 * 尝试访问用户推荐的三个官方数据平台
 * 1. 国家药品监督管理局数据开放平台
 * 2. 医械数据云 (国家药监局南方医药经济研究所)
 * 3. 中国医疗器械行业协会
 */

const https = require('https');
const http = require('http');

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 10000, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function checkPlatform(name, url, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`平台: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`说明: ${description}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch(url);
    console.log(`状态码: ${response.status}`);
    console.log(`内容长度: ${response.data.length} bytes`);

    // 检查是否有反爬机制
    if (response.data.includes('验证码') || response.data.includes('captcha')) {
      console.log('⚠️ 发现验证码/反爬机制');
    }
    if (response.data.includes('登录') || response.data.includes('login')) {
      console.log('⚠️ 需要登录才能访问');
    }
    if (response.data.includes('注册') || response.data.includes('register')) {
      console.log('⚠️ 需要注册账号');
    }

    // 检查是否有数据下载链接
    if (response.data.includes('.csv') || response.data.includes('.xls') || response.data.includes('.zip')) {
      console.log('✅ 发现数据下载链接');
    }

    // 检查是否有API接口
    if (response.data.includes('/api/') || response.data.includes('json')) {
      console.log('✅ 发现API接口');
    }

    return { success: true, status: response.status, hasData: response.data.length > 1000 };
  } catch (error) {
    console.log(`❌ 访问失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('=== 访问NMPA官方数据平台 ===\n');

  const platforms = [
    {
      name: '国家药品监督管理局数据开放平台',
      url: 'https://open.nmpa.gov.cn/',
      description: '官方免费公开数据集，可申请下载全量医疗器械注册数据'
    },
    {
      name: '医械数据云',
      url: 'https://www.pharmcube.com/',
      description: '国家药监局南方医药经济研究所官方下属公益平台'
    },
    {
      name: '中国医疗器械行业协会',
      url: 'http://www.camdi.org/',
      description: '可下载《中国PPE行业年度白皮书》配套数据集'
    },
    {
      name: 'NMPA UDI数据库',
      url: 'https://udi.nmpa.gov.cn/',
      description: '医疗器械唯一标识数据库'
    },
    {
      name: 'NMPA 数据查询',
      url: 'https://www.nmpa.gov.cn/datasearch/home-index.html',
      description: 'NMPA官方数据查询平台'
    }
  ];

  const results = [];
  for (const platform of platforms) {
    const result = await checkPlatform(platform.name, platform.url, platform.description);
    results.push({ ...platform, ...result });
  }

  console.log('\n' + '='.repeat(60));
  console.log('=== 总结 ===');
  console.log('='.repeat(60));

  results.forEach(r => {
    const status = r.success ? (r.hasData ? '✅ 可访问且有数据' : '⚠️ 可访问但数据少') : '❌ 访问失败';
    console.log(`${status} | ${r.name}`);
  });

  console.log('\n=== 建议 ===');
  console.log('1. 对于需要登录/注册的平台，需要人工申请账号');
  console.log('2. 对于有反爬机制的平台，可能需要使用Selenium等浏览器自动化工具');
  console.log('3. 对于提供CSV/Excel下载的平台，可直接下载后解析');
}

main().catch(console.error);

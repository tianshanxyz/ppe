#!/usr/bin/env node
/**
 * 搜索API调试脚本
 */

const http = require('http');

async function debugAPI() {
  console.log('='.repeat(70));
  console.log('  搜索API调试');
  console.log('='.repeat(70));

  const tests = [
    { url: 'http://localhost:3000/api/search?q=test&type=all&limit=5', desc: '基本搜索' },
    { url: 'http://localhost:3000/api/search?q=&type=all&limit=5', desc: '空查询' },
    { url: 'http://localhost:3000/api/health', desc: '健康检查' },
  ];

  for (const t of tests) {
    console.log(`\n测试: ${t.desc}`);
    console.log(`URL: ${t.url}`);
    
    try {
      const res = await fetchUrl(t.url);
      console.log(`状态码: ${res.status}`);
      console.log(`响应: ${JSON.stringify(res.data, null, 2).substring(0, 500)}`);
    } catch (e) {
      console.log(`错误: ${e.message}`);
    }
  }
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    }).on('error', reject);
  });
}

debugAPI().catch(console.error);

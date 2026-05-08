#!/usr/bin/env node
/**
 * 分析WHO data.xlsx文件，提取PPE相关数据
 */

const xlsx = require('xlsx');
const fs = require('fs');

const FILE_PATH = '/Users/maxiaoha/Desktop/mdlooker/mdlooker/WHO data.xlsx';

async function main() {
  console.log('=== WHO数据文件分析 ===\n');

  // 检查文件是否存在
  if (!fs.existsSync(FILE_PATH)) {
    console.error('错误: 文件不存在:', FILE_PATH);
    return;
  }

  const stats = fs.statSync(FILE_PATH);
  console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

  // 读取Excel文件
  console.log('正在读取Excel文件...');
  const workbook = xlsx.readFile(FILE_PATH);

  console.log('\n=== 工作表列表 ===');
  workbook.SheetNames.forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}`);
  });

  // 分析每个工作表
  console.log('\n=== 工作表详细分析 ===');

  for (const sheetName of workbook.SheetNames) {
    console.log(`\n--- 工作表: "${sheetName}" ---`);

    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`  行数: ${data.length}`);

    if (data.length > 0) {
      // 显示表头
      const headers = data[0];
      console.log(`  列数: ${headers.length}`);
      console.log('  表头:');
      headers.forEach((h, i) => {
        console.log(`    ${i + 1}. ${h}`);
      });

      // 显示前3行数据示例
      if (data.length > 1) {
        console.log('  数据示例（前3行）:');
        for (let i = 1; i < Math.min(4, data.length); i++) {
          console.log(`    行${i}:`, data[i].slice(0, 5).join(' | '));
        }
      }
    }
  }

  // 查找PPE相关内容
  console.log('\n\n=== PPE相关内容搜索 ===');

  const ppeKeywords = ['PPE', 'mask', '口罩', 'respirator', 'glove', '手套', 'gown', '防护服', 'protection', '防护'];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) continue;

    const headers = data[0];
    const ppeColumns = [];

    // 查找包含PPE关键词的列
    headers.forEach((h, i) => {
      const headerStr = String(h).toLowerCase();
      if (ppeKeywords.some(kw => headerStr.includes(kw.toLowerCase()))) {
        ppeColumns.push({ index: i, header: h });
      }
    });

    if (ppeColumns.length > 0) {
      console.log(`\n工作表 "${sheetName}" 发现PPE相关列:`);
      ppeColumns.forEach(col => {
        console.log(`  - ${col.header}`);
      });
    }
  }

  console.log('\n\n分析完成!');
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * 访问医械数据云的医疗器械查询平台
 * URL: https://bydrug.pharmcube.com/devicego/deviceCNImported
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== 访问医械数据云 - 医疗器械查询平台 ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 访问医疗器械查询页面
    console.log('正在访问医疗器械查询平台...');
    await page.goto('https://bydrug.pharmcube.com/devicego/deviceCNImported', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await sleep(5000);

    // 截图查看页面状态
    await page.screenshot({ path: '/tmp/devicego_page.png', fullPage: true });
    console.log('页面截图已保存到 /tmp/devicego_page.png');

    // 获取页面内容
    const content = await page.content();
    const text = await page.evaluate(() => document.body.innerText);

    console.log('\n=== 页面内容分析 ===');
    console.log('页面文本长度:', text.length);

    // 检查是否有PPE相关内容
    if (text.includes('防护') || text.includes('PPE') || text.includes('口罩') || text.includes('手套')) {
      console.log('✅ 页面包含PPE相关内容');
    }

    // 检查是否有数据表格
    const hasTable = await page.$('table') !== null;
    if (hasTable) {
      console.log('✅ 发现数据表格');
    }

    // 检查是否有搜索框
    const searchInput = await page.$('input[type="text"]') ||
                        await page.$('input[placeholder*="搜索"]') ||
                        await page.$('input[placeholder*="请输入"]');
    if (searchInput) {
      console.log('✅ 发现搜索框');

      // 尝试搜索"防护口罩"
      console.log('\n尝试搜索"防护口罩"...');
      await searchInput.type('防护口罩');
      await sleep(1000);

      // 查找搜索按钮
      const searchBtn = await page.$('button[type="submit"]') ||
                        await page.$('button:has-text("搜索")') ||
                        await page.$('.search-btn') ||
                        await page.$('.el-button');

      if (searchBtn) {
        await searchBtn.click();
        await sleep(5000);

        await page.screenshot({ path: '/tmp/devicego_search.png', fullPage: true });
        console.log('搜索结果截图已保存到 /tmp/devicego_search.png');

        // 检查结果数量
        const resultText = await page.evaluate(() => document.body.innerText);
        const match = resultText.match(/(\d+)/);
        if (match) {
          console.log(`搜索结果数量: ${match[0]}`);
        }
      }
    }

    // 检查是否有分页
    const hasPagination = await page.$('.pagination') !== null ||
                          await page.$('.el-pagination') !== null;
    if (hasPagination) {
      console.log('✅ 发现分页控件');
    }

    // 检查是否需要登录
    if (content.includes('登录') || content.includes('注册') || text.includes('请先登录')) {
      console.log('⚠️ 需要登录才能访问完整数据');
    }

    console.log('\n=== 结论 ===');
    console.log('医械数据云的医疗器械查询平台需要进一步探索。');
    console.log('页面已截图保存，请查看 /tmp/devicego_page.png 了解页面结构。');

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

#!/usr/bin/env node
/**
 * 使用Puppeteer访问医械数据云，搜索PPE数据
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== 访问医械数据云 (pharmcube.com) ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // 访问首页
    console.log('正在访问医械数据云...');
    await page.goto('https://www.pharmcube.com/', { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(3000);

    // 截图查看页面状态
    await page.screenshot({ path: '/tmp/pharmcube_home.png', fullPage: true });
    console.log('首页截图已保存到 /tmp/pharmcube_home.png');

    // 获取页面内容
    const content = await page.content();

    // 检查是否需要登录
    if (content.includes('登录') || content.includes('注册') || content.includes('login')) {
      console.log('⚠️ 需要登录/注册才能访问数据');
      console.log('请手动访问 https://www.pharmcube.com/ 注册账号');
    }

    // 检查是否有搜索功能
    const hasSearch = await page.$('input[type="search"]') !== null ||
                      await page.$('input[placeholder*="搜索"]') !== null ||
                      content.includes('搜索');

    if (hasSearch) {
      console.log('✅ 发现搜索功能');
    }

    // 尝试查找PPE相关链接或数据
    const links = await page.$$eval('a', as => as.map(a => ({ text: a.textContent.trim(), href: a.href })));
    const ppeLinks = links.filter(l =>
      l.text.includes('防护') ||
      l.text.includes('PPE') ||
      l.text.includes('器械') ||
      l.text.includes('数据')
    );

    console.log('\n=== 相关链接 ===');
    ppeLinks.slice(0, 10).forEach(l => {
      console.log(`  ${l.text} -> ${l.href}`);
    });

    // 检查是否有数据下载链接
    const downloadLinks = links.filter(l =>
      l.href.includes('.csv') ||
      l.href.includes('.xls') ||
      l.href.includes('.zip') ||
      l.text.includes('下载')
    );

    if (downloadLinks.length > 0) {
      console.log('\n=== 下载链接 ===');
      downloadLinks.forEach(l => {
        console.log(`  ${l.text} -> ${l.href}`);
      });
    }

    console.log('\n=== 结论 ===');
    console.log('医械数据云需要注册登录才能访问完整数据。');
    console.log('建议：');
    console.log('1. 访问 https://www.pharmcube.com/ 注册账号');
    console.log('2. 搜索"个人防护装备"或"PPE"分类');
    console.log('3. 导出CSV数据文件');
    console.log('4. 将下载的文件提供给我进行数据导入');

  } catch (error) {
    console.error('错误:', error.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);

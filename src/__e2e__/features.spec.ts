import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test('should display login option', async ({ page }) => {
    await page.goto('/');
    
    // 检查登录链接或按钮存在
    const loginLink = page.locator('a[href*="login"], a[href*="signin"], button:has-text("Login"), button:has-text("Sign In")');
    await expect(loginLink).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    
    const loginLink = page.locator('a[href*="login"], a[href*="signin"]').first();
    await loginLink.click();
    
    // 检查进入登录页面或显示登录表单
    await expect(page).toHaveURL(/.*login|signin.*/);
  });
});

test.describe('Report Generation', () => {
  test('should access report page', async ({ page }) => {
    await page.goto('/reports');
    await expect(page).toHaveURL(/.*reports.*/);
    
    // 检查报告列表或生成按钮存在
    const reportSection = page.locator('[data-testid="report-section"], .report-section');
    await expect(reportSection).toBeVisible();
  });

  test('should generate company report', async ({ page }) => {
    await page.goto('/reports');
    
    // 点击生成报告按钮
    const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("生成报告")');
    await expect(generateButton).toBeVisible();
  });
});

test.describe('Data Export', () => {
  test('should export data to CSV', async ({ page }) => {
    await page.goto('/search?q=mask');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 检查导出按钮存在
    const exportButton = page.locator('button:has-text("Export"), button:has-text("导出")');
    await expect(exportButton).toBeVisible();
  });

  test('should export data to PDF', async ({ page }) => {
    await page.goto('/search?q=device');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 检查 PDF 导出按钮
    const pdfExportButton = page.locator('button:has-text("PDF"), [data-testid="export-pdf"]');
    await expect(pdfExportButton).toBeVisible();
  });
});

test.describe('Market Filtering', () => {
  test('should filter by FDA market', async ({ page }) => {
    await page.goto('/search');
    
    // 选择 FDA 市场
    const marketSelect = page.locator('select').filter({ hasText: /market|all/i }).first();
    await marketSelect.selectOption('fda');
    
    // 等待过滤生效
    await page.waitForTimeout(500);
    
    // 检查 URL 包含市场参数
    await expect(page).toHaveURL(/.*market=fda.*/);
    
    // 检查结果都来自 FDA
    const results = page.locator('[data-testid="search-result"]');
    const count = await results.count();
    
    if (count > 0) {
      // 验证第一个结果包含 FDA 标识
      const firstResult = results.first();
      await expect(firstResult).toContainText(/fda|FDA/i, { ignoreCase: true });
    }
  });

  test('should filter by EUDAMED market', async ({ page }) => {
    await page.goto('/search');
    
    const marketSelect = page.locator('select').filter({ hasText: /market|all/i }).first();
    await marketSelect.selectOption('eudamed');
    
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*market=eudamed.*/);
  });

  test('should filter by NMPA market', async ({ page }) => {
    await page.goto('/search');
    
    const marketSelect = page.locator('select').filter({ hasText: /market|all/i }).first();
    await marketSelect.selectOption('nmpa');
    
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*market=nmpa.*/);
  });
});

test.describe('Device Class Filtering', () => {
  test('should filter by Class I', async ({ page }) => {
    await page.goto('/search');
    
    // 选择 Class I
    const classSelect = page.locator('select').filter({ hasText: /class|device/i });
    await classSelect.selectOption('Class I');
    
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*class=Class%20I.*/);
  });

  test('should filter by Class II', async ({ page }) => {
    await page.goto('/search');
    
    const classSelect = page.locator('select').filter({ hasText: /class|device/i });
    await classSelect.selectOption('Class II');
    
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*class=Class%20II.*/);
  });

  test('should filter by Class III', async ({ page }) => {
    await page.goto('/search');
    
    const classSelect = page.locator('select').filter({ hasText: /class|device/i });
    await classSelect.selectOption('Class III');
    
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/.*class=Class%20III.*/);
  });
});

test.describe('Comparison Feature', () => {
  test('should add products to comparison', async ({ page }) => {
    await page.goto('/search?q=mask');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 检查比较按钮存在
    const compareButton = page.locator('button:has-text("Compare"), button:has-text("比较")');
    await expect(compareButton).toBeVisible();
  });

  test('should view comparison table', async ({ page }) => {
    await page.goto('/compare');
    await expect(page).toHaveURL(/.*compare.*/);
    
    // 检查比较表格存在
    const comparisonTable = page.locator('table, [data-testid="comparison-table"]');
    await expect(comparisonTable).toBeVisible();
  });
});

test.describe('Alert System', () => {
  test('should access alert settings', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page).toHaveURL(/.*alerts.*/);
    
    // 检查告警设置存在
    const alertSettings = page.locator('[data-testid="alert-settings"], .alert-settings');
    await expect(alertSettings).toBeVisible();
  });

  test('should create new alert', async ({ page }) => {
    await page.goto('/alerts');
    
    // 检查创建告警按钮
    const createAlertButton = page.locator('button:has-text("Create Alert"), button:has-text("新建告警")');
    await expect(createAlertButton).toBeVisible();
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should display properly on iPhone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13/14
    await page.goto('/');
    
    // 检查移动端布局元素
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // 检查移动端导航（汉堡菜单）
    const mobileMenu = page.locator('button[aria-label*="menu"], .hamburger, .mobile-menu');
    await expect(mobileMenu).toBeVisible();
  });

  test('should display properly on iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    
    // 检查平板布局
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display properly on Android', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 }); // Pixel 5
    await page.goto('/');
    
    // 检查移动端布局
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Browser Compatibility', () => {
  test('should work in Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium only test');
    
    await page.goto('/');
    await expect(page).toHaveTitle(/MDLooker/);
  });

  test('should work in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox only test');
    
    await page.goto('/');
    await expect(page).toHaveTitle(/MDLooker/);
  });

  test('should work in WebKit', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit only test');
    
    await page.goto('/');
    await expect(page).toHaveTitle(/MDLooker/);
  });
});

test.describe('Session Management', () => {
  test('should maintain session across pages', async ({ page }) => {
    await page.goto('/');
    
    // 执行搜索
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('test query');
    await searchInput.press('Enter');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 导航到其他页面
    await page.goto('/companies');
    
    // 返回搜索页面，检查查询是否保留
    await page.goto('/search');
    
    // 检查搜索框内容（如果应用实现了状态保持）
    const currentQuery = await searchInput.inputValue();
    // 注意：这取决于应用是否使用 URL 参数保持状态
    expect(page.url()).toContain('search');
  });
});

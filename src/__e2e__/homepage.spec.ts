import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // 检查页面标题
    await expect(page).toHaveTitle(/MDLooker/);
    
    // 检查主要导航元素
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display search functionality', async ({ page }) => {
    await page.goto('/');
    
    // 检查搜索框存在
    const searchInput = page.locator('input[type="text"], input[type="search"]');
    await expect(searchInput).toBeVisible();
    
    // 检查搜索按钮存在
    const searchButton = page.locator('button[type="submit"]').filter({ hasText: /search/i });
    await expect(searchButton).toBeVisible();
  });

  test('should display market switcher', async ({ page }) => {
    await page.goto('/');
    
    // 检查市场切换器存在
    const marketSwitcher = page.locator('[data-testid="market-switcher"], select').filter({ hasText: /market|region/i });
    await expect(marketSwitcher).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');
    
    // 点击搜索或导航到搜索页面
    await page.goto('/search');
    await expect(page).toHaveURL(/.*search/);
  });

  test('should display responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // 检查移动端布局
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('should perform search with valid query', async ({ page }) => {
    // 输入搜索查询
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('mask');
    
    // 提交搜索
    await searchInput.press('Enter');
    
    // 等待搜索结果
    await page.waitForTimeout(1000);
    
    // 检查搜索结果存在
    const results = page.locator('[data-testid="search-results"], .search-results');
    await expect(results).toBeVisible();
  });

  test('should filter by market', async ({ page }) => {
    // 选择市场过滤器
    const marketFilter = page.locator('select').filter({ hasText: /market|all/i }).first();
    await marketFilter.selectOption('fda');
    
    // 等待过滤生效
    await page.waitForTimeout(500);
    
    // 检查 URL 包含过滤参数
    await expect(page).toHaveURL(/.*market=fda.*/);
  });

  test('should display no results message for invalid query', async ({ page }) => {
    // 输入不存在的查询
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('xyznonexistent123');
    await searchInput.press('Enter');
    
    // 等待搜索完成
    await page.waitForTimeout(1000);
    
    // 检查无结果提示
    const noResults = page.locator('text=/no results|没有找到/i');
    await expect(noResults).toBeVisible();
  });

  test('should paginate through results', async ({ page }) => {
    // 执行搜索
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('device');
    await searchInput.press('Enter');
    
    // 等待结果加载
    await page.waitForTimeout(1000);
    
    // 检查分页控件存在
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    await expect(pagination).toBeVisible();
  });
});

test.describe('Company Page', () => {
  test('should load company page', async ({ page }) => {
    await page.goto('/companies');
    await expect(page).toHaveURL(/.*companies.*/);
    
    // 检查公司列表存在
    const companyList = page.locator('[data-testid="company-list"], .company-list');
    await expect(companyList).toBeVisible();
  });

  test('should view company details', async ({ page }) => {
    await page.goto('/companies');
    
    // 点击第一个公司
    const firstCompany = page.locator('[data-testid="company-item"]').first();
    await firstCompany.click();
    
    // 检查进入详情页
    await expect(page).toHaveURL(/.*companies\/.+/);
  });
});

test.describe('Product Page', () => {
  test('should load product page', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/.*products.*/);
    
    // 检查产品列表存在
    const productList = page.locator('[data-testid="product-list"], .product-list');
    await expect(productList).toBeVisible();
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/products');
    
    // 点击第一个产品
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    await firstProduct.click();
    
    // 检查进入详情页
    await expect(page).toHaveURL(/.*products\/.+/);
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 page', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-12345');
    expect(response?.status()).toBe(404);
    
    // 检查 404 页面内容
    await expect(page.locator('text=/404|not found/i')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.goto('/search');
    
    // 执行搜索（可能会触发 API 错误）
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    // 检查页面没有崩溃
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load homepage within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load search results within 5 seconds', async ({ page }) => {
    await page.goto('/search');
    
    const startTime = Date.now();
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('mask');
    await searchInput.press('Enter');
    
    // 等待结果加载
    await page.waitForSelector('[data-testid="search-results"], .search-results', { timeout: 5000 });
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(5000);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // 检查有且仅有一个 h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // 检查 h1 非空
    const h1Text = await page.locator('h1').textContent();
    expect(h1Text?.trim()).toBeTruthy();
  });

  test('should have alt text on images', async ({ page }) => {
    await page.goto('/');
    
    // 检查所有图片都有 alt 属性
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // alt 可以是空字符串表示装饰性图片，但不能没有 alt 属性
      expect(alt).not.toBeNull();
    }
  });

  test('should have proper link text', async ({ page }) => {
    await page.goto('/');
    
    // 检查链接有有意义的文本
    const links = page.locator('a[href]');
    const count = await links.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) { // 检查前 10 个链接
      const text = await links.nth(i).textContent();
      expect(text?.trim()).toBeTruthy();
    }
  });
});

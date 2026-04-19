/**
 * 使用 Playwright 从 EUDAMED Angular 应用采集欧洲 PPE 数据
 * 
 * EUDAMED 使用 Angular 框架，需要等待完全加载
 * https://ec.europa.eu/tools/eudamed/eudamed
 * 
 * 使用方法：
 * node scripts/extract-eudamed-angular-ppe.js
 */

const { chromium } = require('playwright')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// EUDAMED 网站配置
const EUDAMED_URL = 'https://ec.europa.eu/tools/eudamed/eudamed/#/search/devices'

// PPE 相关关键词（欧洲常用术语）
const PPE_KEYWORDS = [
  'glove',
  'mask',
  'respirator',
  'gown',
  'protective',
  'face shield',
  'goggle',
  'shoe cover',
  'head cover',
  'ppe'
]

// 统计信息
const stats = {
  totalFetched: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  startTime: new Date(),
}

/**
 * 检查是否为 PPE 产品
 */
function isPPEProduct(deviceName, deviceDescription, tradeName) {
  if (!deviceName && !deviceDescription && !tradeName) return false
  
  const text = `${deviceName || ''} ${deviceDescription || ''} ${tradeName || ''}`.toLowerCase()
  
  const ppeKeywords = [
    'glove', 'gloves', 'hand protection',
    'mask', 'masks', 'respirator', 'respirators',
    'ffp2', 'ffp3', 'n95', 'surgical mask',
    'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls',
    'goggle', 'goggles', 'face shield', 'face shields',
    'eye protection', 'protective eyewear',
    'shoe cover', 'shoe covers', 'boot cover', 'boot covers',
    'cap', 'caps', 'head cover', 'bouffant', 'head protection',
    'ppe', 'personal protective equipment',
    'examination glove', 'surgical glove',
    'isolation gown', 'surgical gown', 'protective gown',
    'safety glasses', 'protective suit',
    'medical glove', 'nitrile glove', 'latex glove',
    'disposable glove', 'reusable glove'
  ]
  
  return ppeKeywords.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(deviceName, deviceDescription, tradeName) {
  const text = `${deviceName || ''} ${deviceDescription || ''} ${tradeName || ''}`.toLowerCase()
  
  if (text.includes('glove') || text.includes('gloves')) return '手部防护装备'
  if (text.includes('mask') || text.includes('respirator') || text.includes('ffp') || text.includes('n95')) return '呼吸防护装备'
  if (text.includes('gown') || text.includes('coverall') || text.includes('clothing') || text.includes('suit')) return '身体防护装备'
  if (text.includes('goggle') || text.includes('face shield') || text.includes('eye') || text.includes('eyewear')) return '眼面部防护装备'
  if (text.includes('shoe') || text.includes('boot')) return '足部防护装备'
  if (text.includes('cap') || text.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * 清洗和转换 EUDAMED 数据
 */
function cleanEUDAMEDData(rawData) {
  const results = []
  
  for (const item of rawData) {
    try {
      // 检查是否为 PPE 产品
      if (!isPPEProduct(item.name, item.description, item.tradeName)) {
        continue
      }
      
      const product = {
        product_name: item.tradeName || item.name || 'Unknown',
        product_code: item.primaryDi || item.basicUdi || item.uuid || '',
        product_category: categorizeProduct(item.name, item.description, item.tradeName),
        sub_category: item.deviceType || '',
        ppe_category: 'II',
        description: item.description || '',
        specifications: JSON.stringify({
          basicUdi: item.basicUdi,
          primaryDi: item.primaryDi,
          uuid: item.uuid,
          deviceType: item.deviceType,
          riskClass: item.riskClass,
          sterile: item.sterile,
          measuring: item.measuring,
        }),
        features: JSON.stringify({
          notifiedBody: item.notifiedBody,
          manufacturerName: item.manufacturerName,
        }),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.manufacturerName || '',
        manufacturer_address: item.manufacturerAddress || '',
        manufacturer_country: item.manufacturerCountry || 'EU',
        brand_name: item.brandName || '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'CE (EUDAMED)',
          status: 'Active',
          notifiedBody: item.notifiedBody,
          riskClass: item.riskClass,
        }),
        ce_certificate_number: item.notifiedBody || '',
        ce_expiry_date: null,
        fda_k_number: '',
        fda_decision_date: null,
        nmpa_registration_number: '',
        nmpa_expiry_date: null,
        iso_certifications: [],
        other_certifications: JSON.stringify({}),
        
        // 市场信息
        target_markets: ['EU'],
        market_approvals: JSON.stringify({
          eu: {
            status: 'Active',
            date: item.lastUpdatedDate,
            notifiedBody: item.notifiedBody,
            riskClass: item.riskClass,
          }
        }),
        registration_status: 'active',
        
        // 法规符合性
        applicable_regulations: ['EU MDR 2017/745'],
        harmonized_standards: [],
        risk_classification: item.riskClass || 'Class II',
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({
          sterile: item.sterile,
          measuring: item.measuring,
        }),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.lastUpdatedDate || null,
        expiry_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
      }
      
      results.push(product)
    } catch (error) {
      console.error('Error processing record:', error.message)
      stats.totalErrors++
    }
  }
  
  return results
}

/**
 * 批量插入数据到 Supabase
 */
async function insertProducts(products) {
  if (products.length === 0) return
  
  try {
    const batchSize = 50
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      for (const product of batch) {
        if (!product.product_code) continue
        
        // 先查询是否已存在
        const { data: existing } = await supabase
          .from('ppe_products')
          .select('id')
          .eq('product_code', product.product_code)
          .single()
        
        if (existing) {
          // 更新现有记录
          const { error } = await supabase
            .from('ppe_products')
            .update({
              ...product,
              updated_at: new Date().toISOString(),
            })
            .eq('product_code', product.product_code)
          
          if (error) {
            console.error('Error updating product:', product.product_code, error.message)
            stats.totalErrors++
          } else {
            stats.totalUpdated++
          }
        } else {
          // 插入新记录
          const { error } = await supabase
            .from('ppe_products')
            .insert(product)
          
          if (error) {
            console.error('Error inserting product:', product.product_code, error.message)
            stats.totalErrors++
          } else {
            stats.totalInserted++
          }
        }
      }
      
      const progress = Math.min(i + batchSize, products.length)
      console.log(`  Inserted/Updated: ${progress}/${products.length}`)
    }
  } catch (error) {
    console.error('Error in batch insert:', error.message)
    stats.totalErrors += products.length
  }
}

/**
 * 使用 Playwright 爬取 EUDAMED Angular 应用
 */
async function scrapeEUDAMED(keyword, browser) {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  })
  
  const page = await context.newPage()
  
  try {
    // 访问 EUDAMED 搜索页面
    console.log(`Opening EUDAMED for keyword: ${keyword}`)
    
    // 拦截 API 请求以获取数据
    const apiResponses = []
    page.on('response', async (response) => {
      const url = response.url()
      if (url.includes('/api/') && url.includes('devices')) {
        try {
          const data = await response.json()
          apiResponses.push(data)
        } catch (e) {
          // 不是 JSON 响应
        }
      }
    })
    
    await page.goto(EUDAMED_URL, { 
      waitUntil: 'networkidle',
      timeout: 120000 
    })
    
    // 等待 Angular 应用完全加载
    await page.waitForTimeout(15000)
    
    // 尝试多种选择器查找搜索输入框
    const searchSelectors = [
      'input[type="text"]',
      'input[placeholder*="search" i]',
      'input[name*="search" i]',
      'input[id*="search" i]',
      'input[class*="search" i]',
      '[data-testid*="search"]',
      'input[formcontrolname]',
      'mat-form-field input',
      '.eui-form-field input',
      'input'
    ]
    
    let searchInput = null
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.$(selector)
        if (searchInput) {
          console.log(`Found search input with selector: ${selector}`)
          break
        }
      } catch (e) {
        // 继续尝试下一个选择器
      }
    }
    
    if (searchInput) {
      // 清除现有内容
      await searchInput.fill('')
      await searchInput.fill(keyword)
      
      // 尝试触发搜索
      await searchInput.press('Enter')
      await page.waitForTimeout(8000)
      
      // 尝试点击搜索按钮
      const searchButton = await page.$('button[type="submit"], button[class*="search"], button:has-text("Search"), button:has-text("Search")')
      if (searchButton) {
        await searchButton.click()
        await page.waitForTimeout(8000)
      }
      
      // 等待 API 响应
      await page.waitForTimeout(5000)
      
      // 从 API 响应中提取数据
      if (apiResponses.length > 0) {
        const devices = []
        for (const response of apiResponses) {
          if (response.content && Array.isArray(response.content)) {
            devices.push(...response.content)
          }
        }
        console.log(`Found ${devices.length} devices from API responses`)
        await context.close()
        return devices
      }
      
      // 如果 API 没有数据，尝试从页面提取
      const devices = await page.evaluate(() => {
        const results = []
        
        // 尝试多种选择器
        const selectors = [
          'table tbody tr',
          '.device-item',
          '.search-result',
          '[data-testid*="device"]',
          '[class*="device"]',
          '[class*="result"]',
          'mat-row',
          '.eui-table-row',
          'tr'
        ]
        
        for (const selector of selectors) {
          const rows = document.querySelectorAll(selector)
          if (rows.length > 0) {
            rows.forEach(row => {
              const cells = row.querySelectorAll('td, .cell, [class*="cell"], mat-cell')
              if (cells.length > 0) {
                results.push({
                  name: cells[0]?.textContent?.trim() || '',
                  tradeName: cells[1]?.textContent?.trim() || '',
                  manufacturerName: cells[2]?.textContent?.trim() || '',
                  description: cells[3]?.textContent?.trim() || '',
                })
              }
            })
            if (results.length > 0) break
          }
        }
        
        return results
      })
      
      console.log(`Found ${devices.length} devices on page`)
      
      await context.close()
      return devices
    } else {
      console.log('Search input not found')
      await context.close()
      return []
    }
    
  } catch (error) {
    console.error('Error scraping EUDAMED:', error.message)
    await context.close()
    return []
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== EUDAMED Angular PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting data extraction...\n')
  
  let browser
  
  try {
    // 启动浏览器
    browser = await chromium.launch({ headless: true })
    console.log('Browser launched\n')
    
    // 使用 PPE 关键词搜索
    for (const keyword of PPE_KEYWORDS) {
      console.log(`\n--- Searching for: ${keyword} ---`)
      
      const devices = await scrapeEUDAMED(keyword, browser)
      
      if (devices.length > 0) {
        console.log(`Found ${devices.length} devices for '${keyword}'`)
        
        // 清洗和筛选 PPE 产品
        const cleanedData = cleanEUDAMEDData(devices)
        console.log(`  PPE products: ${cleanedData.length}`)
        
        if (cleanedData.length > 0) {
          await insertProducts(cleanedData)
        }
        
        stats.totalFetched += devices.length
      } else {
        console.log(`No devices found for '${keyword}'`)
      }
      
      // 每个关键词之间等待 10 秒
      await new Promise(resolve => setTimeout(resolve, 10000))
    }
    
    // 关闭浏览器
    await browser.close()
    
    // 输出统计
    const endTime = new Date()
    const duration = (endTime - stats.startTime) / 1000
    
    console.log('\n=== Extraction Complete ===')
    console.log('End time:', endTime.toLocaleString())
    console.log('Duration:', Math.round(duration), 'seconds')
    console.log('Total fetched:', stats.totalFetched)
    console.log('Total inserted:', stats.totalInserted)
    console.log('Total updated:', stats.totalUpdated)
    console.log('Total errors:', stats.totalErrors)
    console.log('\n✅ EUDAMED Angular PPE data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    
    if (browser) {
      await browser.close()
    }
    
    process.exit(1)
  }
}

// 运行主函数
main()

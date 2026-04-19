/**
 * 从 all_products 表提取欧洲 PPE 产品数据
 * 
 * 由于 EUDAMED 官网无法直接采集，从现有的 all_products 表中
 * 筛选欧洲国家的 PPE 产品
 * 
 * 使用方法：
 * node scripts/extract-eu-from-all-products.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// 欧盟国家代码
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK', 'CH', 'NO', 'IS'
]

// PPE 相关关键词
const PPE_KEYWORDS = [
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

// 统计信息
const stats = {
  totalFetched: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  euProductsFound: 0,
  startTime: new Date(),
}

/**
 * 检查是否为欧洲产品
 */
function isEuropeanProduct(countryCode) {
  if (!countryCode) return false
  return EU_COUNTRIES.includes(countryCode.toUpperCase())
}

/**
 * 检查是否为 PPE 产品
 */
function isPPEProduct(productName, productDescription) {
  if (!productName && !productDescription) return false
  
  const text = `${productName || ''} ${productDescription || ''}`.toLowerCase()
  
  return PPE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(productName, productDescription) {
  const text = `${productName || ''} ${productDescription || ''}`.toLowerCase()
  
  if (text.includes('glove') || text.includes('gloves')) return '手部防护装备'
  if (text.includes('mask') || text.includes('respirator') || text.includes('ffp') || text.includes('n95')) return '呼吸防护装备'
  if (text.includes('gown') || text.includes('coverall') || text.includes('clothing') || text.includes('suit')) return '身体防护装备'
  if (text.includes('goggle') || text.includes('face shield') || text.includes('eye') || text.includes('eyewear')) return '眼面部防护装备'
  if (text.includes('shoe') || text.includes('boot')) return '足部防护装备'
  if (text.includes('cap') || text.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * 清洗和转换数据
 */
function cleanProductData(rawData) {
  const results = []
  
  for (const item of rawData) {
    try {
      // 检查是否为 PPE 产品
      if (!isPPEProduct(item.name, item.description)) {
        continue
      }
      
      // 检查是否为欧洲产品
      if (!isEuropeanProduct(item.country_code)) {
        continue
      }
      
      stats.euProductsFound++
      
      const product = {
        product_name: item.name || 'Unknown',
        product_code: item.registration_number || item.product_code || item.id || '',
        product_category: categorizeProduct(item.name, item.description),
        sub_category: item.device_classification || '',
        ppe_category: 'II',
        description: item.description || '',
        specifications: JSON.stringify({
          device_classification: item.device_classification,
          approval_type: item.approval_type,
        }),
        features: JSON.stringify({
          source: item.source,
          market: item.market,
        }),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.company_name || '',
        manufacturer_address: '',
        manufacturer_country: item.country_code || 'EU',
        brand_name: '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'CE (Europe)',
          status: 'Active',
          source: item.source,
        }),
        ce_certificate_number: 'CE Marked',
        ce_expiry_date: null,
        fda_k_number: '',
        fda_decision_date: null,
        nmpa_registration_number: '',
        nmpa_expiry_date: null,
        iso_certifications: [],
        other_certifications: JSON.stringify({}),
        
        // 市场信息
        target_markets: [item.market || item.country_code || 'EU'],
        market_approvals: JSON.stringify({
          [item.market || item.country_code || 'eu']: {
            status: 'Active',
            date: item.approval_date,
            registration_number: item.registration_number,
          }
        }),
        registration_status: 'active',
        
        // 法规符合性
        applicable_regulations: ['EU MDR 2017/745'],
        harmonized_standards: [],
        risk_classification: item.device_classification || 'Class II',
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({}),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.approval_date || null,
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
 * 主函数
 */
async function main() {
  console.log('=== Extract EU PPE from all_products ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('EU Countries:', EU_COUNTRIES.length)
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting extraction...\n')
  
  try {
    // 获取所有产品数据
    console.log('Fetching all products from database...')
    
    const { data: allProducts, error, count } = await supabase
      .from('all_products')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('Error fetching products:', error.message)
      return
    }
    
    console.log(`Total products in database: ${count || allProducts?.length || 0}`)
    
    if (!allProducts || allProducts.length === 0) {
      console.log('No products found in all_products table')
      return
    }
    
    // 筛选欧洲 PPE 产品
    console.log('\nFiltering EU PPE products...')
    const cleanedData = cleanProductData(allProducts)
    
    console.log(`\nFound ${stats.euProductsFound} EU PPE products`)
    
    if (cleanedData.length > 0) {
      console.log('\nInserting EU PPE products...')
      await insertProducts(cleanedData)
    }
    
    stats.totalFetched = allProducts.length
    
    // 输出统计
    const endTime = new Date()
    const duration = (endTime - stats.startTime) / 1000
    
    console.log('\n=== Extraction Complete ===')
    console.log('End time:', endTime.toLocaleString())
    console.log('Duration:', Math.round(duration), 'seconds')
    console.log('Total fetched:', stats.totalFetched)
    console.log('EU PPE products found:', stats.euProductsFound)
    console.log('Total inserted:', stats.totalInserted)
    console.log('Total updated:', stats.totalUpdated)
    console.log('Total errors:', stats.totalErrors)
    console.log('\n✅ EU PPE extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

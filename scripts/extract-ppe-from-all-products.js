/**
 * 从 all_products 表中提取 PPE 产品数据
 * 
 * 从 all_products 表中筛选 PPE 相关产品
 * 并导入到 ppe_products 表
 * 
 * 使用方法：
 * node scripts/extract-ppe-from-all-products.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// PPE 相关关键词
const PPE_KEYWORDS = [
  'glove', 'gloves',
  'mask', 'masks', 'respirator', 'respirators', 'n95', 'ffp2', 'ffp3',
  'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls',
  'goggle', 'goggles', 'face shield', 'face shields', 'eye protection',
  'shoe cover', 'shoe covers', 'boot cover', 'boot covers',
  'cap', 'caps', 'head cover', 'bouffant',
  'ppe', 'personal protective equipment',
  'surgical mask', 'medical mask',
  'examination glove', 'surgical glove',
  'isolation gown', 'surgical gown',
  'protective eyewear', 'safety glasses',
  'hand protection', 'breathing protection'
]

// 欧洲国家代码
const EU_COUNTRIES = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'GB', 'UK', 'IE', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'LU', 'MT', 'CY', 'GR', 'PT']

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
 * 检查是否为 PPE 产品
 */
function isPPEProduct(name, description) {
  if (!name && !description) return false
  
  const text = `${name || ''} ${description || ''}`.toLowerCase()
  
  return PPE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(name, description) {
  const text = `${name || ''} ${description || ''}`.toLowerCase()
  
  if (text.includes('glove') || text.includes('gloves')) return '手部防护装备'
  if (text.includes('mask') || text.includes('respirator') || text.includes('n95') || text.includes('ffp')) return '呼吸防护装备'
  if (text.includes('gown') || text.includes('coverall') || text.includes('clothing')) return '身体防护装备'
  if (text.includes('goggle') || text.includes('face shield') || text.includes('eye')) return '眼面部防护装备'
  if (text.includes('shoe') || text.includes('boot')) return '足部防护装备'
  if (text.includes('cap') || text.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * 检查是否为欧洲产品
 */
function isEuropeanProduct(countryCode) {
  if (!countryCode) return false
  return EU_COUNTRIES.includes(countryCode.toUpperCase())
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
      
      const isEU = isEuropeanProduct(item.country_code)
      if (isEU) {
        stats.euProductsFound++
      }
      
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
        manufacturer_country: item.country_code || 'Unknown',
        brand_name: '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: item.source === 'fda_510k' ? 'FDA 510(k)' : (isEU ? 'CE (Europe)' : 'Other'),
          status: 'Active',
          source: item.source,
        }),
        ce_certificate_number: isEU ? 'CE Marked' : '',
        ce_expiry_date: null,
        fda_k_number: item.source === 'fda_510k' ? item.registration_number : '',
        fda_decision_date: item.approval_date || null,
        nmpa_registration_number: '',
        nmpa_expiry_date: null,
        iso_certifications: [],
        other_certifications: JSON.stringify({}),
        
        // 市场信息
        target_markets: [item.market || item.country_code || 'US'],
        market_approvals: JSON.stringify({
          [item.market || item.country_code || 'us']: {
            status: 'Active',
            date: item.approval_date,
            registration_number: item.registration_number,
          }
        }),
        registration_status: 'active',
        
        // 法规符合性
        applicable_regulations: isEU ? ['EU MDR 2017/745'] : ['FDA 21 CFR'],
        harmonized_standards: [],
        risk_classification: 'Class II',
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
    const batchSize = 100
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
  console.log('=== All Products PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('EU Countries:', EU_COUNTRIES.length)
  console.log('\nStarting data extraction...\n')
  
  try {
    // 获取总记录数
    const { count: totalCount } = await supabase
      .from('all_products')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total all_products records: ${totalCount}`)
    
    // 分页处理
    const batchSize = 1000
    let offset = 0
    let hasMore = true
    
    while (hasMore) {
      console.log(`\nFetching batch (offset: ${offset})...`)
      
      const { data: records, error } = await supabase
        .from('all_products')
        .select('*')
        .range(offset, offset + batchSize - 1)
      
      if (error) {
        console.error('Error fetching records:', error.message)
        break
      }
      
      if (!records || records.length === 0) {
        console.log('No more records.')
        break
      }
      
      console.log(`Fetched ${records.length} records`)
      
      // 清洗和筛选 PPE 产品
      const cleanedData = cleanProductData(records)
      console.log(`Found ${cleanedData.length} PPE products (${stats.euProductsFound} EU products total)`)
      
      if (cleanedData.length > 0) {
        await insertProducts(cleanedData)
      }
      
      stats.totalFetched += records.length
      
      // 如果返回的记录少于批次大小，说明已经到最后一页
      if (records.length < batchSize) {
        hasMore = false
      }
      
      offset += batchSize
      
      // 显示进度
      const progress = ((offset / totalCount) * 100).toFixed(2)
      console.log(`Progress: ${progress}% (${offset}/${totalCount})`)
    }
    
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
    console.log('EU products found:', stats.euProductsFound)
    console.log('\n✅ All Products PPE data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

/**
 * 从 EUDAMED 表中提取 PPE 产品数据
 * 
 * 从 eudamed_registrations 表中筛选 PPE 相关产品
 * 并导入到 ppe_products 表
 * 
 * 使用方法：
 * node scripts/extract-ppe-from-eudamed.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// PPE 相关关键词
const PPE_KEYWORDS = [
  'glove', 'gloves', 'hand protection',
  'mask', 'masks', 'respirator', 'respirators', 'n95', 'ffp2', 'ffp3',
  'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls',
  'goggle', 'goggles', 'face shield', 'face shields', 'eye protection',
  'shoe cover', 'shoe covers', 'boot cover', 'boot covers',
  'cap', 'caps', 'head cover', 'bouffant',
  'ppe', 'personal protective equipment',
  'surgical mask', 'medical mask',
  'examination glove', 'surgical glove',
  'isolation gown', 'surgical gown',
  'protective eyewear', 'safety glasses'
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
function isPPEProduct(deviceName, deviceDescription) {
  if (!deviceName && !deviceDescription) return false
  
  const text = `${deviceName || ''} ${deviceDescription || ''}`.toLowerCase()
  
  return PPE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(deviceName, deviceDescription) {
  const text = `${deviceName || ''} ${deviceDescription || ''}`.toLowerCase()
  
  if (text.includes('glove') || text.includes('gloves')) return '手部防护装备'
  if (text.includes('mask') || text.includes('respirator') || text.includes('n95') || text.includes('ffp')) return '呼吸防护装备'
  if (text.includes('gown') || text.includes('coverall') || text.includes('clothing')) return '身体防护装备'
  if (text.includes('goggle') || text.includes('face shield') || text.includes('eye')) return '眼面部防护装备'
  if (text.includes('shoe') || text.includes('boot')) return '足部防护装备'
  if (text.includes('cap') || text.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * 风险等级分类
 */
function classifyRisk(deviceDescription) {
  const text = (deviceDescription || '').toLowerCase()
  
  // 高风险关键词
  if (text.includes('implantable') || text.includes('life-supporting') || text.includes('critical')) {
    return 'III'
  }
  
  // 中风险（大多数 PPE 属于此类）
  return 'II'
}

/**
 * 清洗和转换 EUDAMED 数据
 */
function cleanEUDAMEDData(rawData) {
  const results = []
  
  for (const item of rawData) {
    try {
      // 检查是否为 PPE 产品
      if (!isPPEProduct(item.device_name, item.device_description)) {
        continue
      }
      
      const product = {
        product_name: item.device_name || 'Unknown',
        product_code: item.udi_di || item.id || '',
        product_category: categorizeProduct(item.device_name, item.device_description),
        sub_category: '',
        ppe_category: classifyRisk(item.device_description),
        description: item.device_description || '',
        specifications: JSON.stringify({
          udi_di: item.udi_di,
          srn: item.srn,
          nca: item.nca,
        }),
        features: JSON.stringify({
          notified_body: item.notified_body,
        }),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.actor_name || item.actor_name_en || '',
        manufacturer_address: item.actor_address || '',
        manufacturer_country: item.country || 'Unknown',
        brand_name: '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'CE (EUDAMED)',
          status: item.registration_status || '',
          notified_body: item.notified_body,
        }),
        ce_certificate_number: item.certificate_number || '',
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
            status: item.registration_status,
            date: item.registration_date,
            srn: item.srn,
            nca: item.nca,
          }
        }),
        registration_status: (item.registration_status || 'active').toLowerCase(),
        
        // 法规符合性
        applicable_regulations: ['EU MDR 2017/745'],
        harmonized_standards: [],
        risk_classification: 'Class II',
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({}),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.registration_date || null,
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
  console.log('=== EUDAMED PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting data extraction...\n')
  
  try {
    // 获取总记录数
    const { count: totalCount } = await supabase
      .from('eudamed_registrations')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total EUDAMED records: ${totalCount}`)
    
    // 分页处理
    const batchSize = 1000
    let offset = 0
    let hasMore = true
    
    while (hasMore) {
      console.log(`\nFetching batch (offset: ${offset})...`)
      
      const { data: records, error } = await supabase
        .from('eudamed_registrations')
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
      const cleanedData = cleanEUDAMEDData(records)
      console.log(`Found ${cleanedData.length} PPE products`)
      
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
    console.log('\n✅ EUDAMED PPE data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

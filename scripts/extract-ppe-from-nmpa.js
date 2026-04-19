/**
 * 从 NMPA 表中提取 PPE 产品数据
 * 
 * 从 nmpa_registrations 表中筛选 PPE 相关产品
 * 并导入到 ppe_products 表
 * 
 * 使用方法：
 * node scripts/extract-ppe-from-nmpa.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// PPE 相关关键词（中英文）
const PPE_KEYWORDS = [
  '手套', 'glove', 'gloves', 'hand',
  '口罩', 'mask', 'masks', 'respirator', '呼吸',
  '防护服', 'gown', 'gowns', 'protective clothing', 'coverall',
  '护目镜', 'goggle', 'goggles', 'face shield', '眼罩',
  '鞋套', 'shoe cover', 'boot cover',
  '帽子', 'cap', 'head cover', '头套',
  '防护', 'ppe', 'protective',
  '医用', 'medical',
  '外科', 'surgical',
  '隔离', 'isolation'
]

// NMPA 分类代码映射（PPE 相关）
// 14- 注输、护理和防护器械
const PPE_CLASSIFICATION_CODES = [
  '14-01', // 注射、穿刺器械
  '14-02', // 血管内输液器械
  '14-03', // 非血管内输液器械
  '14-04', // 止血器具
  '14-05', // 非血管内导（插）管
  '14-06', // 与非血管内导管配套用体外器械
  '14-07', // 清洗、灌洗、吸引、给药器械
  '14-08', // 可吸收外科敷料（材料）
  '14-09', // 不可吸收外科敷料
  '14-10', // 创面敷料
  '14-11', // 包扎敷料
  '14-12', // 造口、疤痕护理用品
  '14-13', // 手术室感染控制用品
  '14-14', // 医护人员防护用品
  '14-15', // 病人护理防护用品
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
function isPPEProduct(productName, productDescription, classificationCode) {
  // 检查分类代码
  if (classificationCode) {
    const isPPECode = PPE_CLASSIFICATION_CODES.some(code => 
      classificationCode.startsWith(code)
    )
    if (isPPECode) return true
  }
  
  // 检查关键词
  if (!productName && !productDescription) return false
  
  const text = `${productName || ''} ${productDescription || ''}`.toLowerCase()
  
  return PPE_KEYWORDS.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(productName, productDescription) {
  const text = `${productName || ''} ${productDescription || ''}`.toLowerCase()
  
  if (text.includes('手套') || text.includes('glove')) return '手部防护装备'
  if (text.includes('口罩') || text.includes('mask') || text.includes('respirator') || text.includes('呼吸')) return '呼吸防护装备'
  if (text.includes('防护服') || text.includes('gown') || text.includes('coverall') || text.includes('clothing')) return '身体防护装备'
  if (text.includes('护目镜') || text.includes('goggle') || text.includes('face shield') || text.includes('眼罩')) return '眼面部防护装备'
  if (text.includes('鞋套') || text.includes('shoe') || text.includes('boot')) return '足部防护装备'
  if (text.includes('帽子') || text.includes('cap') || text.includes('头套')) return '头部防护装备'
  
  return '其他'
}

/**
 * 风险等级分类
 */
function classifyRisk(classificationCode) {
  // NMPA 分类代码格式：XX-XX-XX
  // 根据管理类别判断
  if (!classificationCode) return 'II'
  
  const parts = classificationCode.split('-')
  if (parts.length >= 3) {
    const managementClass = parts[2]
    // 03 通常表示第三类（高风险）
    if (managementClass === '03' || managementClass === '3') {
      return 'III'
    }
  }
  
  return 'II'
}

/**
 * 清洗和转换 NMPA 数据
 */
function cleanNMPAData(rawData) {
  const results = []
  
  for (const item of rawData) {
    try {
      // 检查是否为 PPE 产品
      if (!isPPEProduct(item.product_name, item.product_description, item.device_classification)) {
        continue
      }
      
      const product = {
        product_name: item.product_name_zh || item.product_name || 'Unknown',
        product_code: item.registration_number || item.id || '',
        product_category: categorizeProduct(item.product_name, item.product_description),
        sub_category: item.device_classification || '',
        ppe_category: classifyRisk(item.device_classification),
        description: item.product_description || item.scope_of_application || '',
        specifications: JSON.stringify({
          device_classification: item.device_classification,
          scope: item.scope_of_application,
        }),
        features: JSON.stringify({
          registration_holder: item.registration_holder_zh || item.registration_holder,
        }),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.manufacturer_zh || item.manufacturer || '',
        manufacturer_address: item.manufacturer_address || '',
        manufacturer_country: 'China',
        brand_name: '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'NMPA (中国)',
          status: 'Active',
          classification: item.device_classification,
        }),
        ce_certificate_number: '',
        ce_expiry_date: null,
        fda_k_number: '',
        fda_decision_date: null,
        nmpa_registration_number: item.registration_number || '',
        nmpa_expiry_date: item.expiration_date || null,
        iso_certifications: [],
        other_certifications: JSON.stringify({}),
        
        // 市场信息
        target_markets: ['CN'],
        market_approvals: JSON.stringify({
          cn: {
            status: 'Active',
            date: item.approval_date,
            registration_number: item.registration_number,
            holder: item.registration_holder_zh || item.registration_holder,
          }
        }),
        registration_status: 'active',
        
        // 法规符合性
        applicable_regulations: ['NMPA 医疗器械监督管理条例'],
        harmonized_standards: [],
        risk_classification: `Class ${classifyRisk(item.device_classification)}`,
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({}),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.approval_date || null,
        expiry_date: item.expiration_date || null,
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
  console.log('=== NMPA PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting data extraction...\n')
  
  try {
    // 获取总记录数
    const { count: totalCount } = await supabase
      .from('nmpa_registrations')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total NMPA records: ${totalCount}`)
    
    // 分页处理
    const batchSize = 1000
    let offset = 0
    let hasMore = true
    
    while (hasMore) {
      console.log(`\nFetching batch (offset: ${offset})...`)
      
      const { data: records, error } = await supabase
        .from('nmpa_registrations')
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
      const cleanedData = cleanNMPAData(records)
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
    console.log('\n✅ NMPA PPE data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

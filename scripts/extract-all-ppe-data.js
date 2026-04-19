/**
 * 从所有数据库表中提取PPE产品数据
 * 
 * 从以下表中提取PPE数据：
 * - fda_510k (11,000条)
 * - fda_pma (5,155条)
 * - nmpa_registrations (72,000条)
 * - eudamed_registrations (43,798条)
 * - all_products (130,953条)
 * 
 * 使用方法：
 * node scripts/extract-all-ppe-data.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// PPE 相关关键词（中英文）
const PPE_KEYWORDS = [
  // 手部防护
  'glove', 'gloves', 'hand protection', '手套',
  // 呼吸防护
  'mask', 'masks', 'respirator', 'respirators', 'n95', 'ffp2', 'ffp3', '口罩', '呼吸器',
  // 身体防护
  'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls', '防护服', '隔离衣',
  // 眼面部防护
  'goggle', 'goggles', 'face shield', 'face shields', 'eye protection', '护目镜', '面罩', '眼罩',
  // 足部防护
  'shoe cover', 'shoe covers', 'boot cover', 'boot covers', '鞋套', '靴套',
  // 头部防护
  'cap', 'caps', 'head cover', 'bouffant', '帽子', '头套', '头罩',
  // 其他
  'ppe', 'personal protective equipment', '防护', '医用', '外科', '隔离', '安全眼镜'
]

// 欧洲国家代码
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK', 'CH', 'NO', 'IS'
]

// 统计信息
const stats = {
  totalProcessed: 0,
  totalPPEFound: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  bySource: {},
  byCategory: {},
  startTime: new Date(),
}

/**
 * 检查是否为 PPE 产品
 */
function isPPEProduct(text) {
  if (!text) return false
  
  const lowerText = text.toLowerCase()
  
  return PPE_KEYWORDS.some(keyword => {
    const lowerKeyword = keyword.toLowerCase()
    return lowerText.includes(lowerKeyword)
  })
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(text) {
  if (!text) return '其他'
  
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('glove') || lowerText.includes('手套')) return '手部防护装备'
  if (lowerText.includes('mask') || lowerText.includes('respirator') || 
      lowerText.includes('n95') || lowerText.includes('ffp') || lowerText.includes('口罩')) return '呼吸防护装备'
  if (lowerText.includes('gown') || lowerText.includes('coverall') || 
      lowerText.includes('clothing') || lowerText.includes('suit') || 
      lowerText.includes('防护服') || lowerText.includes('隔离衣')) return '身体防护装备'
  if (lowerText.includes('goggle') || lowerText.includes('face shield') || 
      lowerText.includes('eye') || lowerText.includes('护目镜') || lowerText.includes('面罩')) return '眼面部防护装备'
  if (lowerText.includes('shoe') || lowerText.includes('boot')) return '足部防护装备'
  if (lowerText.includes('cap') || lowerText.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * 判断是否为欧洲产品
 */
function isEuropeanProduct(countryCode) {
  if (!countryCode) return false
  return EU_COUNTRIES.includes(countryCode.toUpperCase())
}

/**
 * 清洗和转换 FDA 510k 数据
 */
async function extractFromFDA510K() {
  console.log('\n=== 从 fda_510k 提取 PPE 数据 ===\n')
  
  try {
    // 获取所有 FDA 510k 数据
    const { data, error, count } = await supabase
      .from('fda_510k')
      .select('*')
    
    if (error) {
      console.error('Error fetching fda_510k:', error.message)
      return
    }
    
    console.log(`Total records in fda_510k: ${count}`)
    
    let ppeCount = 0
    let insertedCount = 0
    let updatedCount = 0
    
    for (const item of data) {
      try {
        const text = `${item.device_name || ''} ${item.summary || ''} ${item.product_code || ''}`
        
        if (!isPPEProduct(text)) continue
        
        ppeCount++
        
        const product = {
          product_name: item.device_name || 'Unknown',
          product_code: item.k_number || item.product_code || '',
          product_category: categorizeProduct(text),
          sub_category: item.product_code || '',
          ppe_category: item.device_class === 'I' ? 'I' : (item.device_class === 'III' ? 'III' : 'II'),
          description: item.summary || '',
          specifications: JSON.stringify({
            k_number: item.k_number,
            decision_code: item.decision_code,
            product_code: item.product_code,
            device_class: item.device_class,
          }),
          features: JSON.stringify({
            source: 'fda_510k',
            applicant: item.applicant,
          }),
          images: JSON.stringify([]),
          
          manufacturer_name: item.applicant || '',
          manufacturer_address: '',
          manufacturer_country: 'US',
          brand_name: '',
          
          certifications: JSON.stringify({
            type: 'FDA 510(k)',
            status: 'Active',
            k_number: item.k_number,
            device_class: item.device_class,
          }),
          ce_certificate_number: '',
          ce_expiry_date: null,
          fda_k_number: item.k_number || '',
          fda_decision_date: item.decision_date || null,
          nmpa_registration_number: '',
          nmpa_expiry_date: null,
          iso_certifications: [],
          other_certifications: JSON.stringify({}),
          
          target_markets: ['US'],
          market_approvals: JSON.stringify({
            us: {
              status: 'Active',
              date: item.decision_date,
              k_number: item.k_number,
            }
          }),
          registration_status: 'active',
          
          applicable_regulations: ['FDA 21 CFR 807', 'FDA 21 CFR 820'],
          harmonized_standards: [],
          risk_classification: item.device_class ? `Class ${item.device_class}` : 'Class II',
          essential_requirements: JSON.stringify({}),
          
          performance_metrics: JSON.stringify({}),
          test_reports: JSON.stringify({}),
          
          approval_date: item.decision_date || null,
          expiry_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        }
        
        await insertProduct(product)
        insertedCount++
        
      } catch (err) {
        stats.totalErrors++
        console.error('Error processing FDA 510k item:', err.message)
      }
    }
    
    console.log(`\nFDA 510k - PPE found: ${ppeCount}, Inserted: ${insertedCount}, Updated: ${updatedCount}`)
    
    stats.bySource.fda_510k = { total: ppeCount, inserted: insertedCount, updated: updatedCount }
    
  } catch (error) {
    console.error('Error in extractFromFDA510K:', error.message)
  }
}

/**
 * 清洗和转换 FDA PMA 数据
 */
async function extractFromFDAPMA() {
  console.log('\n=== 从 fda_pma 提取 PPE 数据 ===\n')
  
  try {
    const { data, error, count } = await supabase
      .from('fda_pma')
      .select('*')
    
    if (error) {
      console.error('Error fetching fda_pma:', error.message)
      return
    }
    
    console.log(`Total records in fda_pma: ${count}`)
    
    let ppeCount = 0
    let insertedCount = 0
    let updatedCount = 0
    
    for (const item of data) {
      try {
        const text = `${item.device_name || ''} ${item.summary || ''} ${item.product_code || ''}`
        
        if (!isPPEProduct(text)) continue
        
        ppeCount++
        
        const product = {
          product_name: item.device_name || 'Unknown',
          product_code: item.pma_number || item.product_code || '',
          product_category: categorizeProduct(text),
          sub_category: item.product_code || '',
          ppe_category: item.device_class === 'I' ? 'I' : (item.device_class === 'III' ? 'III' : 'II'),
          description: item.summary || '',
          specifications: JSON.stringify({
            pma_number: item.pma_number,
            approval_order_date: item.approval_order_date,
            product_code: item.product_code,
            device_class: item.device_class,
          }),
          features: JSON.stringify({
            source: 'fda_pma',
            applicant: item.applicant,
          }),
          images: JSON.stringify([]),
          
          manufacturer_name: item.applicant || '',
          manufacturer_address: '',
          manufacturer_country: 'US',
          brand_name: '',
          
          certifications: JSON.stringify({
            type: 'FDA PMA',
            status: 'Active',
            pma_number: item.pma_number,
            device_class: item.device_class,
          }),
          ce_certificate_number: '',
          ce_expiry_date: null,
          fda_k_number: '',
          fda_decision_date: item.approval_order_date || null,
          nmpa_registration_number: '',
          nmpa_expiry_date: null,
          iso_certifications: [],
          other_certifications: JSON.stringify({}),
          
          target_markets: ['US'],
          market_approvals: JSON.stringify({
            us: {
              status: 'Active',
              date: item.approval_order_date,
              pma_number: item.pma_number,
            }
          }),
          registration_status: 'active',
          
          applicable_regulations: ['FDA 21 CFR 814'],
          harmonized_standards: [],
          risk_classification: item.device_class ? `Class ${item.device_class}` : 'Class III',
          essential_requirements: JSON.stringify({}),
          
          performance_metrics: JSON.stringify({}),
          test_reports: JSON.stringify({}),
          
          approval_date: item.approval_order_date || null,
          expiry_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        }
        
        await insertProduct(product)
        insertedCount++
        
      } catch (err) {
        stats.totalErrors++
        console.error('Error processing FDA PMA item:', err.message)
      }
    }
    
    console.log(`\nFDA PMA - PPE found: ${ppeCount}, Inserted: ${insertedCount}, Updated: ${updatedCount}`)
    
    stats.bySource.fda_pma = { total: ppeCount, inserted: insertedCount, updated: updatedCount }
    
  } catch (error) {
    console.error('Error in extractFromFDAPMA:', error.message)
  }
}

/**
 * 清洗和转换 NMPA 数据
 */
async function extractFromNMPA() {
  console.log('\n=== 从 nmpa_registrations 提取 PPE 数据 ===\n')
  
  try {
    const { data, error, count } = await supabase
      .from('nmpa_registrations')
      .select('*')
    
    if (error) {
      console.error('Error fetching nmpa_registrations:', error.message)
      return
    }
    
    console.log(`Total records in nmpa_registrations: ${count}`)
    
    let ppeCount = 0
    let insertedCount = 0
    let updatedCount = 0
    
    for (const item of data) {
      try {
        const text = `${item.product_name || ''} ${item.product_name_zh || ''} ${item.product_description || ''} ${item.category || ''}`
        
        if (!isPPEProduct(text)) continue
        
        ppeCount++
        
        const product = {
          product_name: item.product_name || 'Unknown',
          product_code: item.registration_number || '',
          product_category: categorizeProduct(text),
          sub_category: item.category || '',
          ppe_category: 'II',
          description: item.product_description || '',
          specifications: JSON.stringify({
            registration_number: item.registration_number,
            category: item.category,
            approval_date: item.approval_date,
          }),
          features: JSON.stringify({
            source: 'nmpa_registrations',
            manufacturer: item.manufacturer,
          }),
          images: JSON.stringify([]),
          
          manufacturer_name: item.manufacturer || '',
          manufacturer_address: '',
          manufacturer_country: 'CN',
          brand_name: '',
          
          certifications: JSON.stringify({
            type: 'NMPA',
            status: 'Active',
            registration_number: item.registration_number,
          }),
          ce_certificate_number: '',
          ce_expiry_date: null,
          fda_k_number: '',
          fda_decision_date: null,
          nmpa_registration_number: item.registration_number || '',
          nmpa_expiry_date: null,
          iso_certifications: [],
          other_certifications: JSON.stringify({}),
          
          target_markets: ['CN'],
          market_approvals: JSON.stringify({
            cn: {
              status: 'Active',
              date: item.approval_date,
              registration_number: item.registration_number,
            }
          }),
          registration_status: 'active',
          
          applicable_regulations: ['NMPA Regulations'],
          harmonized_standards: [],
          risk_classification: 'Class II',
          essential_requirements: JSON.stringify({}),
          
          performance_metrics: JSON.stringify({}),
          test_reports: JSON.stringify({}),
          
          approval_date: item.approval_date || null,
          expiry_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        }
        
        await insertProduct(product)
        insertedCount++
        
      } catch (err) {
        stats.totalErrors++
        console.error('Error processing NMPA item:', err.message)
      }
    }
    
    console.log(`\nNMPA - PPE found: ${ppeCount}, Inserted: ${insertedCount}, Updated: ${updatedCount}`)
    
    stats.bySource.nmpa = { total: ppeCount, inserted: insertedCount, updated: updatedCount }
    
  } catch (error) {
    console.error('Error in extractFromNMPA:', error.message)
  }
}

/**
 * 清洗和转换 EUDAMED 数据
 */
async function extractFromEUDAMED() {
  console.log('\n=== 从 eudamed_registrations 提取 PPE 数据 ===\n')
  
  try {
    const { data, error, count } = await supabase
      .from('eudamed_registrations')
      .select('*')
    
    if (error) {
      console.error('Error fetching eudamed_registrations:', error.message)
      return
    }
    
    console.log(`Total records in eudamed_registrations: ${count}`)
    
    let ppeCount = 0
    let insertedCount = 0
    let updatedCount = 0
    
    for (const item of data) {
      try {
        const text = `${item.device_name || ''} ${item.device_description || ''} ${item.device_class || ''}`
        
        if (!isPPEProduct(text)) continue
        
        ppeCount++
        
        // 从 metadata 中提取国家信息
        const metadata = item.metadata || {}
        const manufacturerCountry = metadata.manufacturer_country || 'EU'
        
        const product = {
          product_name: item.device_name || 'Unknown',
          product_code: item.registration_number || '',
          product_category: categorizeProduct(text),
          sub_category: item.device_class || '',
          ppe_category: item.device_class?.includes('I') ? 'I' : (item.device_class?.includes('III') ? 'III' : 'II'),
          description: item.device_description || '',
          specifications: JSON.stringify({
            registration_number: item.registration_number,
            device_class: item.device_class,
            registration_date: item.registration_date,
            expiry_date: item.expiry_date,
          }),
          features: JSON.stringify({
            source: 'eudamed_registrations',
            manufacturer_name: item.manufacturer_name,
            metadata: item.metadata,
          }),
          images: JSON.stringify([]),
          
          manufacturer_name: item.manufacturer_name || '',
          manufacturer_address: '',
          manufacturer_country: manufacturerCountry,
          brand_name: '',
          
          certifications: JSON.stringify({
            type: 'CE (EUDAMED)',
            status: item.status || 'Active',
            registration_number: item.registration_number,
            device_class: item.device_class,
          }),
          ce_certificate_number: item.registration_number || '',
          ce_expiry_date: item.expiry_date || null,
          fda_k_number: '',
          fda_decision_date: null,
          nmpa_registration_number: '',
          nmpa_expiry_date: null,
          iso_certifications: [],
          other_certifications: JSON.stringify({}),
          
          target_markets: ['EU'],
          market_approvals: JSON.stringify({
            eu: {
              status: item.status || 'Active',
              date: item.registration_date,
              registration_number: item.registration_number,
            }
          }),
          registration_status: item.status || 'active',
          
          applicable_regulations: ['EU MDR 2017/745'],
          harmonized_standards: [],
          risk_classification: item.device_class || 'Class II',
          essential_requirements: JSON.stringify({}),
          
          performance_metrics: JSON.stringify({}),
          test_reports: JSON.stringify({}),
          
          approval_date: item.registration_date || null,
          expiry_date: item.expiry_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
        }
        
        await insertProduct(product)
        insertedCount++
        
      } catch (err) {
        stats.totalErrors++
        console.error('Error processing EUDAMED item:', err.message)
      }
    }
    
    console.log(`\nEUDAMED - PPE found: ${ppeCount}, Inserted: ${insertedCount}, Updated: ${updatedCount}`)
    
    stats.bySource.eudamed = { total: ppeCount, inserted: insertedCount, updated: updatedCount }
    
  } catch (error) {
    console.error('Error in extractFromEUDAMED:', error.message)
  }
}

/**
 * 插入或更新产品
 */
async function insertProduct(product) {
  stats.totalProcessed++
  
  if (!product.product_code) {
    stats.totalErrors++
    return
  }
  
  try {
    // 检查是否已存在
    const { data: existing } = await supabase
      .from('ppe_products')
      .select('id')
      .eq('product_code', product.product_code)
      .single()
    
    if (existing) {
      // 更新
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
      // 插入
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
    
    // 每 100 条显示一次进度
    if (stats.totalProcessed % 100 === 0) {
      console.log(`Processed: ${stats.totalProcessed}, PPE found: ${stats.totalPPEFound}, Inserted: ${stats.totalInserted}, Updated: ${stats.totalUpdated}`)
    }
    
  } catch (error) {
    console.error('Error in insertProduct:', error.message)
    stats.totalErrors++
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 全面提取 PPE 数据 ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting extraction...\n')
  
  try {
    // 从各个表提取数据
    await extractFromFDA510K()
    await extractFromFDAPMA()
    await extractFromNMPA()
    await extractFromEUDAMED()
    
    // 输出统计
    const endTime = new Date()
    const duration = (endTime - stats.startTime) / 1000
    
    console.log('\n=== Extraction Complete ===')
    console.log('End time:', endTime.toLocaleString())
    console.log('Duration:', Math.round(duration), 'seconds')
    console.log('\n=== Statistics ===')
    console.log('Total processed:', stats.totalProcessed)
    console.log('Total PPE found:', stats.totalPPEFound)
    console.log('Total inserted:', stats.totalInserted)
    console.log('Total updated:', stats.totalUpdated)
    console.log('Total errors:', stats.totalErrors)
    console.log('\n=== By Source ===')
    console.log(stats.bySource)
    console.log('\n✅ All PPE data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

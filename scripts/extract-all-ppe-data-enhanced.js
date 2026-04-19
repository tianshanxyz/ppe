/**
 * 全面提取 PPE 产品数据（增强版）
 * 
 * 从所有相关表中提取PPE数据：
 * - fda_510k (11,000条)
 * - fda_pma (5,155条)
 * - fda_enforcement (如果有)
 * - nmpa_registrations (72,000条)
 * - eudamed_registrations (43,798条)
 * - all_products (130,953条) - 关键数据源
 * 
 * 使用更全面的关键词和字段搜索
 * 
 * 使用方法：
 * node scripts/extract-all-ppe-data-enhanced.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// PPE 相关关键词（中英文）- 扩展版
const PPE_KEYWORDS = [
  // 手部防护
  'glove', 'gloves', 'hand protection', '手套', 'handguard', 'handguards',
  // 呼吸防护
  'mask', 'masks', 'respirator', 'respirators', 'n95', 'ffp2', 'ffp3', 'ffp1', '口罩', '呼吸器', ' respirator ',
  // 身体防护
  'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls', '防护服', '隔离衣', 'protective suit', 'protective suits',
  // 眼面部防护
  'goggle', 'goggles', 'face shield', 'face shields', 'eye protection', '护目镜', '面罩', '眼罩', 'safety glasses', 'safety glass',
  // 足部防护
  'shoe cover', 'shoe covers', 'boot cover', 'boot covers', '鞋套', '靴套', 'foot cover', 'foot covers',
  // 头部防护
  'cap', 'caps', 'head cover', 'bouffant', '帽子', '头套', '头罩', 'hair cap', 'hood',
  // 听力防护
  'earplug', 'earplugs', 'earmuff', 'earmuffs', 'hearing protection', '听力保护',
  // 其他
  'ppe', 'personal protective equipment', '防护', '医用', '外科', '隔离', '安全眼镜', 'safety goggles', 'safety mask',
  // 医疗相关
  'surgical', 'surgery', 'medical', 'hospital', 'clinical', 'patient', 'healthcare',
  // 材料相关
  'nitrile', 'latex', 'vinyl', 'polyethylene', 'polypropylene', 'sms', 'spunbond',
  // 其他常见术语
  'disposable', 'reusable', 'sterile', 'non-sterile', 'surgical mask', 'surgical gloves',
  // 产品类型
  'face mask', 'dental', 'ophthalmic', 'dermal', 'wound care', 'bandage', 'bandages',
  // 特殊防护
  'chemical', 'biohazard', 'radiation', 'heat', 'cold', 'impact', 'cut',
  // 通用词
  'equipment', 'supplies', 'products', 'items', 'tools'
]

// 欧洲国家代码
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK', 'CH', 'NO', 'IS'
]

// 美洲国家代码
const AMERICAN_COUNTRIES = ['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'UY', 'PY', 'BO', 'EC', 'CR', 'PA', 'DO', 'CU']

// 亚洲国家代码
const ASIAN_COUNTRIES = ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'MY', 'SG', 'PH', 'ID', 'HK', 'TW', 'MO', 'NZ']

// 统计信息
const stats = {
  totalProcessed: 0,
  totalPPEFound: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  bySource: {},
  byCategory: {},
  byCountry: {},
  startTime: new Date(),
}

/**
 * 检查是否为 PPE 产品 - 增强版
 */
function isPPEProduct(text) {
  if (!text) return false
  
  const lowerText = text.toLowerCase()
  
  // 关键词匹配
  const hasKeyword = PPE_KEYWORDS.some(keyword => {
    const lowerKeyword = keyword.toLowerCase()
    return lowerText.includes(lowerKeyword)
  })
  
  // 如果有关键词匹配，返回 true
  if (hasKeyword) return true
  
  // 检查是否包含多个相关词（提高准确率）
  const relatedWords = ['protect', 'safety', 'medical', 'disposable', 'surgical', 'equipment', 'supply']
  const wordCount = relatedWords.filter(word => lowerText.includes(word)).length
  
  return wordCount >= 2
}

/**
 * 分类 PPE 产品 - 增强版
 */
function categorizeProduct(text) {
  if (!text) return '其他'
  
  const lowerText = text.toLowerCase()
  
  // 手部防护
  if (lowerText.includes('glove') || lowerText.includes('手套') || 
      lowerText.includes('handguard') || lowerText.includes('nitrile') ||
      lowerText.includes('latex') || lowerText.includes('vinyl')) return '手部防护装备'
  
  // 呼吸防护
  if (lowerText.includes('mask') || lowerText.includes('respirator') || 
      lowerText.includes('n95') || lowerText.includes('ffp') || 
      lowerText.includes('口罩') || lowerText.includes(' respirator ')) return '呼吸防护装备'
  
  // 身体防护
  if (lowerText.includes('gown') || lowerText.includes('coverall') || 
      lowerText.includes('protective clothing') || lowerText.includes('防护服') || 
      lowerText.includes('隔离衣') || lowerText.includes('protective suit')) return '身体防护装备'
  
  // 眼面部防护
  if (lowerText.includes('goggle') || lowerText.includes('face shield') || 
      lowerText.includes('eye protection') || lowerText.includes('护目镜') || 
      lowerText.includes('面罩') || lowerText.includes('safety glasses') ||
      lowerText.includes('safety goggles')) return '眼面部防护装备'
  
  // 足部防护
  if (lowerText.includes('shoe') || lowerText.includes('boot') || 
      lowerText.includes('foot cover')) return '足部防护装备'
  
  // 头部防护
  if (lowerText.includes('cap') || lowerText.includes('head') || 
      lowerText.includes('bouffant') || lowerText.includes('hood')) return '头部防护装备'
  
  // 听力防护
  if (lowerText.includes('earplug') || lowerText.includes('earmuff') || 
      lowerText.includes('hearing protection')) return '听力防护装备'
  
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
 * 从所有字段中提取文本进行搜索
 */
function extractTextFromItem(item) {
  const fields = []
  
  for (const key in item) {
    const value = item[key]
    if (value && (typeof value === 'string' || typeof value === 'number')) {
      fields.push(String(value))
    }
  }
  
  return fields.join(' ')
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
    stats.totalErrors++
  }
}

/**
 * 通用数据提取函数
 */
async function extractFromTable(tableName, options = {}) {
  console.log(`\n=== 从 ${tableName} 提取 PPE 数据 ===\n`)
  
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*')
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error.message)
      return
    }
    
    console.log(`Total records in ${tableName}: ${count}`)
    
    let ppeCount = 0
    let insertedCount = 0
    let updatedCount = 0
    
    for (const item of data) {
      try {
        // 从所有字段提取文本
        const text = extractTextFromItem(item)
        
        if (!isPPEProduct(text)) continue
        
        ppeCount++
        stats.totalPPEFound++
        
        // 构建产品对象
        const product = buildProductFromItem(item, tableName, options)
        
        if (product) {
          await insertProduct(product)
          if (product.id) updatedCount++
          else insertedCount++
        }
        
      } catch (err) {
        stats.totalErrors++
        console.error(`Error processing ${tableName} item:`, err.message)
      }
    }
    
    console.log(`\n${tableName} - PPE found: ${ppeCount}, Inserted: ${insertedCount}, Updated: ${updatedCount}`)
    
    stats.bySource[tableName] = { total: ppeCount, inserted: insertedCount, updated: updatedCount }
    
  } catch (error) {
    console.error(`Error in extractFromTable(${tableName}):`, error.message)
  }
}

/**
 * 从项目构建产品对象
 */
function buildProductFromItem(item, tableName, options = {}) {
  const text = extractTextFromItem(item)
  
  // 基础信息
  const productName = item.product_name || item.device_name || item.name || item.brand_name || item.product_description || 'Unknown'
  const productCode = item.product_code || item.k_number || item.pma_number || item.registration_number || item.cat_num || item.model || String(Math.random())
  
  // 判断国家
  let manufacturerCountry = options.country || item.manufacturer_country || item.country || item.manufacturer_address || 'Unknown'
  
  // 从地址中提取国家
  if (typeof manufacturerCountry === 'string') {
    if (manufacturerCountry.includes('China') || manufacturerCountry.includes('CN') || manufacturerCountry.includes('中国')) manufacturerCountry = 'CN'
    else if (manufacturerCountry.includes('USA') || manufacturerCountry.includes('US') || manufacturerCountry.includes('United States')) manufacturerCountry = 'US'
    else if (manufacturerCountry.includes('Germany') || manufacturerCountry.includes('DE') || manufacturerCountry.includes('德国')) manufacturerCountry = 'DE'
    else if (manufacturerCountry.includes('France') || manufacturerCountry.includes('FR') || manufacturerCountry.includes('法国')) manufacturerCountry = 'FR'
    else if (manufacturerCountry.includes('UK') || manufacturerCountry.includes('United Kingdom') || manufacturerCountry.includes('英国')) manufacturerCountry = 'GB'
    else if (manufacturerCountry.includes('Italy') || manufacturerCountry.includes('IT') || manufacturerCountry.includes('意大利')) manufacturerCountry = 'IT'
    else if (manufacturerCountry.includes('Spain') || manufacturerCountry.includes('ES') || manufacturerCountry.includes('西班牙')) manufacturerCountry = 'ES'
    else if (manufacturerCountry.includes('Netherlands') || manufacturerCountry.includes('NL') || manufacturerCountry.includes('荷兰')) manufacturerCountry = 'NL'
    else if (manufacturerCountry.includes('Belgium') || manufacturerCountry.includes('BE') || manufacturerCountry.includes('比利时')) manufacturerCountry = 'BE'
    else if (manufacturerCountry.includes('Switzerland') || manufacturerCountry.includes('CH') || manufacturerCountry.includes('瑞士')) manufacturerCountry = 'CH'
    else if (manufacturerCountry.includes('Austria') || manufacturerCountry.includes('AT') || manufacturerCountry.includes('奥地利')) manufacturerCountry = 'AT'
    else if (manufacturerCountry.includes('Sweden') || manufacturerCountry.includes('SE') || manufacturerCountry.includes('瑞典')) manufacturerCountry = 'SE'
    else if (manufacturerCountry.includes('Norway') || manufacturerCountry.includes('NO') || manufacturerCountry.includes('挪威')) manufacturerCountry = 'NO'
    else if (manufacturerCountry.includes('Denmark') || manufacturerCountry.includes('DK') || manufacturerCountry.includes('丹麦')) manufacturerCountry = 'DK'
    else if (manufacturerCountry.includes('Finland') || manufacturerCountry.includes('FI') || manufacturerCountry.includes('芬兰')) manufacturerCountry = 'FI'
    else if (manufacturerCountry.includes('Canada') || manufacturerCountry.includes('CA') || manufacturerCountry.includes('加拿大')) manufacturerCountry = 'CA'
    else if (manufacturerCountry.includes('Australia') || manufacturerCountry.includes('AU') || manufacturerCountry.includes('澳大利亚')) manufacturerCountry = 'AU'
    else if (manufacturerCountry.includes('Japan') || manufacturerCountry.includes('JP') || manufacturerCountry.includes('日本')) manufacturerCountry = 'JP'
    else if (manufacturerCountry.includes('South Korea') || manufacturerCountry.includes('KR') || manufacturerCountry.includes('韩国')) manufacturerCountry = 'KR'
    else if (manufacturerCountry.includes('India') || manufacturerCountry.includes('IN') || manufacturerCountry.includes('印度')) manufacturerCountry = 'IN'
    else if (manufacturerCountry.includes('Thailand') || manufacturerCountry.includes('TH') || manufacturerCountry.includes('泰国')) manufacturerCountry = 'TH'
    else if (manufacturerCountry.includes('Vietnam') || manufacturerCountry.includes('VN') || manufacturerCountry.includes('越南')) manufacturerCountry = 'VN'
    else if (manufacturerCountry.includes('Malaysia') || manufacturerCountry.includes('MY') || manufacturerCountry.includes('马来西亚')) manufacturerCountry = 'MY'
    else if (manufacturerCountry.includes('Singapore') || manufacturerCountry.includes('SG') || manufacturerCountry.includes('新加坡')) manufacturerCountry = 'SG'
    else if (manufacturerCountry.includes('Philippines') || manufacturerCountry.includes('PH') || manufacturerCountry.includes('菲律宾')) manufacturerCountry = 'PH'
    else if (manufacturerCountry.includes('Indonesia') || manufacturerCountry.includes('ID') || manufacturerCountry.includes('印度尼西亚')) manufacturerCountry = 'ID'
    else if (manufacturerCountry.includes('Hong Kong') || manufacturerCountry.includes('HK')) manufacturerCountry = 'HK'
    else if (manufacturerCountry.includes('Taiwan') || manufacturerCountry.includes('TW')) manufacturerCountry = 'TW'
    else manufacturerCountry = 'Unknown'
  }
  
  // 判断PPE类别
  let ppeCategory = 'II'
  if (item.device_class) {
    const dc = String(item.device_class).toUpperCase()
    if (dc.includes('I') && !dc.includes('II')) ppeCategory = 'I'
    else if (dc.includes('III')) ppeCategory = 'III'
    else if (dc.includes('II')) ppeCategory = 'II'
  }
  
  // 判断风险分类
  let riskClassification = 'Class II'
  if (item.device_class) {
    riskClassification = `Class ${item.device_class}`
  } else if (ppeCategory === 'I') {
    riskClassification = 'Class I'
  } else if (ppeCategory === 'III') {
    riskClassification = 'Class III'
  }
  
  // 目标市场
  let targetMarkets = []
  if (isEuropeanProduct(manufacturerCountry)) targetMarkets.push('EU')
  if (manufacturerCountry === 'US') targetMarkets.push('US')
  if (manufacturerCountry === 'CA') targetMarkets.push('CA')
  if (manufacturerCountry === 'CN') targetMarkets.push('CN')
  if (targetMarkets.length === 0) targetMarkets = ['Global']
  
  // 构建市场批准信息
  const marketApprovals = {}
  if (manufacturerCountry === 'US' || targetMarkets.includes('US')) {
    marketApprovals.us = {
      status: item.status || 'Active',
      date: item.decision_date || item.approval_date || item.registration_date || null,
      number: item.k_number || item.pma_number || item.registration_number || null,
    }
  }
  if (isEuropeanProduct(manufacturerCountry) || targetMarkets.includes('EU')) {
    marketApprovals.eu = {
      status: item.status || 'Active',
      date: item.registration_date || item.approval_date || item.decision_date || null,
      number: item.registration_number || item.ce_certificate_number || null,
    }
  }
  if (manufacturerCountry === 'CN' || targetMarkets.includes('CN')) {
    marketApprovals.cn = {
      status: item.status || 'Active',
      date: item.approval_date || item.registration_date || null,
      number: item.registration_number || null,
    }
  }
  
  // 构建认证信息
  const certifications = {}
  if (targetMarkets.includes('US')) {
    certifications.fda = {
      type: item.k_number ? 'FDA 510(k)' : (item.pma_number ? 'FDA PMA' : 'FDA Establishment'),
      status: item.status || 'Active',
      number: item.k_number || item.pma_number || null,
    }
  }
  if (targetMarkets.includes('EU')) {
    certifications.ce = {
      type: 'CE Certificate',
      status: item.status || 'Active',
      number: item.ce_certificate_number || item.registration_number || null,
    }
  }
  if (targetMarkets.includes('CN')) {
    certifications.nmpa = {
      type: 'NMPA',
      status: item.status || 'Active',
      number: item.registration_number || null,
    }
  }
  
  // 构建规格信息
  const specifications = {
    product_code: productCode,
    device_class: item.device_class || ppeCategory,
    registration_number: item.registration_number || null,
    k_number: item.k_number || null,
    pma_number: item.pma_number || null,
    model: item.model || null,
    cat_num: item.cat_num || null,
    brand_name: item.brand_name || null,
  }
  
  // 构建功能信息
  const features = {
    source: tableName,
    manufacturer: item.manufacturer || item.manufacturer_name || null,
    brand: item.brand_name || null,
  }
  
  return {
    product_name: String(productName).substring(0, 500),
    product_code: String(productCode).substring(0, 200),
    product_category: categorizeProduct(text),
    sub_category: item.category || item.device_sub_category || '',
    ppe_category: ppeCategory,
    description: String(item.product_description || item.summary || item.device_description || '').substring(0, 2000),
    specifications: JSON.stringify(specifications),
    features: JSON.stringify(features),
    images: JSON.stringify([]),
    
    manufacturer_name: String(item.manufacturer || item.manufacturer_name || item.applicant || '').substring(0, 500),
    manufacturer_address: String(item.manufacturer_address || item.address || '').substring(0, 500),
    manufacturer_country: manufacturerCountry,
    brand_name: String(item.brand_name || '').substring(0, 200),
    
    certifications: JSON.stringify(certifications),
    ce_certificate_number: String(item.ce_certificate_number || item.registration_number || '').substring(0, 200),
    ce_expiry_date: item.ce_expiry_date || item.expiry_date || null,
    fda_k_number: String(item.k_number || '').substring(0, 200),
    fda_decision_date: item.decision_date || item.approval_date || null,
    nmpa_registration_number: String(item.registration_number || '').substring(0, 200),
    nmpa_expiry_date: null,
    iso_certifications: [],
    other_certifications: JSON.stringify({}),
    
    target_markets: targetMarkets,
    market_approvals: JSON.stringify(marketApprovals),
    registration_status: item.status || 'active',
    
    applicable_regulations: item.applicable_regulations || [],
    harmonized_standards: item.harmonized_standards || [],
    risk_classification: riskClassification,
    essential_requirements: JSON.stringify({}),
    
    performance_metrics: JSON.stringify({}),
    test_reports: JSON.stringify({}),
    
    approval_date: item.approval_date || item.decision_date || item.registration_date || null,
    expiry_date: item.expiry_date || item.ce_expiry_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 全面提取 PPE 数据（增强版）===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting extraction...\n')
  
  try {
    // 1. 从 FDA 510k 提取
    await extractFromTable('fda_510k', { country: 'US' })
    
    // 2. 从 FDA PMA 提取
    await extractFromTable('fda_pma', { country: 'US' })
    
    // 3. 从 NMPA 提取
    await extractFromTable('nmpa_registrations', { country: 'CN' })
    
    // 4. 从 EUDAMED 提取
    await extractFromTable('eudamed_registrations', { country: 'EU' })
    
    // 5. 从 all_products 提取（最关键的表）
    await extractFromTable('all_products')
    
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
    
    console.log('\nBy Source:')
    Object.entries(stats.bySource).forEach(([source, data]) => {
      console.log(`  ${source}: total=${data.total}, inserted=${data.inserted}, updated=${data.updated}`)
    })
    
  } catch (error) {
    console.error('Error in main:', error.message)
  }
}

main()

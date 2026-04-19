/**
 * 从 all_products 表中提取所有 PPE 数据（包括 EUDAMED）
 * 并进行去重和合并
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// PPE 相关关键词（中英文）
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

// 统计信息
const stats = {
  totalProcessed: 0,
  totalPPEFound: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  bySource: {},
  byCountry: {},
  startTime: new Date(),
}

// 存储已处理的产品代码，用于去重
const processedCodes = new Set()

/**
 * 检查是否为 PPE 产品
 */
function isPPEProduct(text) {
  if (!text) return false
  
  const lowerText = text.toLowerCase()
  
  const hasKeyword = PPE_KEYWORDS.some(keyword => {
    const lowerKeyword = keyword.toLowerCase()
    return lowerText.includes(lowerKeyword)
  })
  
  if (hasKeyword) return true
  
  const relatedWords = ['protect', 'safety', 'medical', 'disposable', 'surgical', 'equipment', 'supply']
  const wordCount = relatedWords.filter(word => lowerText.includes(word)).length
  
  return wordCount >= 2
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(text) {
  if (!text) return '其他'
  
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('glove') || lowerText.includes('手套') || 
      lowerText.includes('handguard') || lowerText.includes('nitrile') ||
      lowerText.includes('latex') || lowerText.includes('vinyl')) return '手部防护装备'
  
  if (lowerText.includes('mask') || lowerText.includes('respirator') || 
      lowerText.includes('n95') || lowerText.includes('ffp') || 
      lowerText.includes('口罩') || lowerText.includes(' respirator ')) return '呼吸防护装备'
  
  if (lowerText.includes('gown') || lowerText.includes('coverall') || 
      lowerText.includes('protective clothing') || lowerText.includes('防护服') || 
      lowerText.includes('隔离衣') || lowerText.includes('protective suit')) return '身体防护装备'
  
  if (lowerText.includes('goggle') || lowerText.includes('face shield') || 
      lowerText.includes('eye protection') || lowerText.includes('护目镜') || 
      lowerText.includes('面罩') || lowerText.includes('safety glasses') ||
      lowerText.includes('safety goggles')) return '眼面部防护装备'
  
  if (lowerText.includes('shoe') || lowerText.includes('boot') || 
      lowerText.includes('foot cover')) return '足部防护装备'
  
  if (lowerText.includes('cap') || lowerText.includes('head') || 
      lowerText.includes('bouffant') || lowerText.includes('hood')) return '头部防护装备'
  
  if (lowerText.includes('earplug') || lowerText.includes('earmuff') || 
      lowerText.includes('hearing protection')) return '听力防护装备'
  
  return '其他'
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
  
  // 检查是否已处理（去重）
  if (processedCodes.has(product.product_code)) {
    return
  }
  
  try {
    const { data: existing } = await supabase
      .from('ppe_products')
      .select('id')
      .eq('product_code', product.product_code)
      .single()
    
    if (existing) {
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
      const { error } = await supabase
        .from('ppe_products')
        .insert(product)
      
      if (error) {
        stats.totalErrors++
      } else {
        stats.totalInserted++
      }
    }
    
    processedCodes.add(product.product_code)
    
    if (stats.totalProcessed % 100 === 0) {
      console.log(`Processed: ${stats.totalProcessed}, PPE found: ${stats.totalPPEFound}, Inserted: ${stats.totalInserted}, Updated: ${stats.totalUpdated}`)
    }
    
  } catch (error) {
    stats.totalErrors++
  }
}

/**
 * 从项目构建产品对象
 */
function buildProductFromItem(item, tableName) {
  const text = extractTextFromItem(item)
  
  const productName = item.name || item.product_name || item.device_name || 'Unknown'
  const productCode = item.registration_number || item.product_code || item.k_number || item.pma_number || item.registration_number || item.cat_num || item.model || String(Math.random())
  
  let manufacturerCountry = item.country_code || 'Unknown'
  
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
  
  let ppeCategory = 'II'
  if (item.device_classification) {
    const dc = String(item.device_classification).toUpperCase()
    if (dc.includes('I') && !dc.includes('II')) ppeCategory = 'I'
    else if (dc.includes('III')) ppeCategory = 'III'
    else if (dc.includes('II')) ppeCategory = 'II'
  }
  
  let riskClassification = 'Class II'
  if (item.device_classification) {
    riskClassification = `Class ${item.device_classification}`
  } else if (ppeCategory === 'I') {
    riskClassification = 'Class I'
  } else if (ppeCategory === 'III') {
    riskClassification = 'Class III'
  }
  
  const market = item.market || ''
  const source = item.source || tableName
  
  let targetMarkets = []
  if (EU_COUNTRIES.includes(manufacturerCountry.toUpperCase()) || market.includes('EUDAMED')) targetMarkets.push('EU')
  if (item.country_code === 'US') targetMarkets.push('US')
  if (item.country_code === 'CA') targetMarkets.push('CA')
  if (item.country_code === 'CN') targetMarkets.push('CN')
  if (targetMarkets.length === 0) targetMarkets = ['Global']
  
  const marketApprovals = {}
  if (item.country_code === 'US' || targetMarkets.includes('US')) {
    marketApprovals.us = {
      status: 'Active',
      date: item.approval_date || null,
      number: item.registration_number || null,
    }
  }
  if (EU_COUNTRIES.includes(manufacturerCountry.toUpperCase()) || market.includes('EUDAMED')) {
    marketApprovals.eu = {
      status: 'Active',
      date: item.approval_date || null,
      number: item.registration_number || null,
    }
  }
  if (item.country_code === 'CN' || targetMarkets.includes('CN')) {
    marketApprovals.cn = {
      status: 'Active',
      date: item.approval_date || null,
      number: item.registration_number || null,
    }
  }
  
  const certifications = {}
  if (targetMarkets.includes('US')) {
    certifications.fda = {
      type: item.approval_type === '510(k)' ? 'FDA 510(k)' : (item.approval_type === 'PMA' ? 'FDA PMA' : 'FDA Establishment'),
      status: 'Active',
      number: item.registration_number || null,
    }
  }
  if (targetMarkets.includes('EU')) {
    certifications.ce = {
      type: 'CE Certificate',
      status: 'Active',
      number: item.registration_number || null,
    }
  }
  if (targetMarkets.includes('CN')) {
    certifications.nmpa = {
      type: 'NMPA',
      status: 'Active',
      number: item.registration_number || null,
    }
  }
  
  const specifications = {
    product_code: productCode,
    device_classification: item.device_classification || ppeCategory,
    registration_number: item.registration_number || null,
    k_number: item.k_number || null,
    pma_number: item.pma_number || null,
    model: item.model || null,
    cat_num: item.cat_num || null,
    brand_name: item.company_name || null,
  }
  
  const features = {
    source: source,
    manufacturer: item.company_name || null,
    brand: item.company_name || null,
  }
  
  return {
    product_name: String(productName).substring(0, 500),
    product_code: String(productCode).substring(0, 200),
    product_category: categorizeProduct(text),
    sub_category: item.device_classification || '',
    ppe_category: ppeCategory,
    description: String(item.description || item.name || '').substring(0, 2000),
    specifications: JSON.stringify(specifications),
    features: JSON.stringify(features),
    images: JSON.stringify([]),
    
    manufacturer_name: String(item.company_name || '').substring(0, 500),
    manufacturer_address: '',
    manufacturer_country: manufacturerCountry,
    brand_name: String(item.company_name || '').substring(0, 200),
    
    certifications: JSON.stringify(certifications),
    ce_certificate_number: String(item.registration_number || '').substring(0, 200),
    ce_expiry_date: null,
    fda_k_number: String(item.k_number || '').substring(0, 200),
    fda_decision_date: item.approval_date || null,
    nmpa_registration_number: String(item.registration_number || '').substring(0, 200),
    nmpa_expiry_date: null,
    iso_certifications: [],
    other_certifications: JSON.stringify({}),
    
    target_markets: targetMarkets,
    market_approvals: JSON.stringify(marketApprovals),
    registration_status: 'active',
    
    applicable_regulations: [],
    harmonized_standards: [],
    risk_classification: riskClassification,
    essential_requirements: JSON.stringify({}),
    
    performance_metrics: JSON.stringify({}),
    test_reports: JSON.stringify({}),
    
    approval_date: item.approval_date || null,
    expiry_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_sync_at: new Date().toISOString(),
  }
}

/**
 * 从表中提取 PPE 数据
 */
async function extractFromTable(tableName, filter = {}) {
  console.log(`\n=== 从 ${tableName} 提取 PPE 数据 ===\n`)
  
  try {
    let query = supabase.from(tableName).select('*')
    
    if (Object.keys(filter).length > 0) {
      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value)
      }
    }
    
    const { data: allData, error, count } = await query
    
    if (error) {
      console.error(`Error fetching ${tableName}:`, error.message)
      return
    }
    
    console.log(`Total records in ${tableName}: ${count || allData.length}`)
    
    let ppeCount = 0
    let insertedCount = 0
    let updatedCount = 0
    
    for (const item of allData) {
      try {
        const text = extractTextFromItem(item)
        
        if (!isPPEProduct(text)) continue
        
        ppeCount++
        stats.totalPPEFound++
        
        const product = buildProductFromItem(item, tableName)
        
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
 * 主函数
 */
async function main() {
  console.log('=== 全面提取 PPE 数据（去重版）===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting extraction...\n')
  
  try {
    // 1. 从 all_products 提取所有数据（包括 EUDAMED）
    await extractFromTable('all_products')
    
    // 2. 从 fda_510k 提取
    await extractFromTable('fda_510k')
    
    // 3. 从 fda_pma 提取
    await extractFromTable('fda_pma')
    
    // 4. 从 nmpa_registrations 提取
    await extractFromTable('nmpa_registrations')
    
    // 5. 从 eudamed_registrations 提取
    await extractFromTable('eudamed_registrations')
    
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
    console.log('Unique product codes:', processedCodes.size)
    
    console.log('\nBy Source:')
    Object.entries(stats.bySource).forEach(([source, data]) => {
      console.log(`  ${source}: total=${data.total}, inserted=${data.inserted}, updated=${data.updated}`)
    })
    
  } catch (error) {
    console.error('Error in main:', error.message)
  }
}

main()

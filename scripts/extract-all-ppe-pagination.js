/**
 * 分页提取所有 PPE 数据（处理大数据量）
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// PPE 相关关键词（中英文）
const PPE_KEYWORDS = [
  'glove', 'gloves', 'hand protection', '手套', 'handguard', 'handguards',
  'mask', 'masks', 'respirator', 'respirators', 'n95', 'ffp2', 'ffp3', 'ffp1', '口罩', '呼吸器', ' respirator ',
  'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls', '防护服', '隔离衣', 'protective suit', 'protective suits',
  'goggle', 'goggles', 'face shield', 'face shields', 'eye protection', '护目镜', '面罩', '眼罩', 'safety glasses', 'safety glass',
  'shoe cover', 'shoe covers', 'boot cover', 'boot covers', '鞋套', '靴套', 'foot cover', 'foot covers',
  'cap', 'caps', 'head cover', 'bouffant', '帽子', '头套', '头罩', 'hair cap', 'hood',
  'earplug', 'earplugs', 'earmuff', 'earmuffs', 'hearing protection', '听力保护',
  'ppe', 'personal protective equipment', '防护', '医用', '外科', '隔离', '安全眼镜', 'safety goggles', 'safety mask',
  'surgical', 'surgery', 'medical', 'hospital', 'clinical', 'patient', 'healthcare',
  'nitrile', 'latex', 'vinyl', 'polyethylene', 'polypropylene', 'sms', 'spunbond',
  'disposable', 'reusable', 'sterile', 'non-sterile', 'surgical mask', 'surgical gloves',
  'face mask', 'dental', 'ophthalmic', 'dermal', 'wound care', 'bandage', 'bandages',
  'chemical', 'biohazard', 'radiation', 'heat', 'cold', 'impact', 'cut',
  'equipment', 'supplies', 'products', 'items', 'tools'
]

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'UK', 'CH', 'NO', 'IS'
]

const stats = {
  totalProcessed: 0,
  totalPPEFound: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  bySource: {},
  startTime: new Date(),
}

const processedCodes = new Set()

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

function categorizeProduct(text) {
  if (!text) return '其他'
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('glove') || lowerText.includes('手套') || lowerText.includes('nitrile')) return '手部防护装备'
  if (lowerText.includes('mask') || lowerText.includes('respirator') || lowerText.includes('n95') || lowerText.includes('ffp') || lowerText.includes('口罩')) return '呼吸防护装备'
  if (lowerText.includes('gown') || lowerText.includes('coverall') || lowerText.includes('防护服') || lowerText.includes('隔离衣')) return '身体防护装备'
  if (lowerText.includes('goggle') || lowerText.includes('face shield') || lowerText.includes('护目镜') || lowerText.includes('面罩')) return '眼面部防护装备'
  if (lowerText.includes('shoe') || lowerText.includes('boot')) return '足部防护装备'
  if (lowerText.includes('cap') || lowerText.includes('head')) return '头部防护装备'
  if (lowerText.includes('earplug') || lowerText.includes('earmuff')) return '听力防护装备'
  
  return '其他'
}

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

async function insertProduct(product) {
  stats.totalProcessed++
  
  if (!product.product_code) {
    stats.totalErrors++
    return
  }
  
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
        .update({ ...product, updated_at: new Date().toISOString() })
        .eq('product_code', product.product_code)
      
      if (error) stats.totalErrors++
      else stats.totalUpdated++
    } else {
      const { error } = await supabase.from('ppe_products').insert(product)
      if (error) stats.totalErrors++
      else stats.totalInserted++
    }
    
    processedCodes.add(product.product_code)
    
    if (stats.totalProcessed % 500 === 0) {
      console.log(`Processed: ${stats.totalProcessed}, PPE: ${stats.totalPPEFound}, Inserted: ${stats.totalInserted}, Updated: ${stats.totalUpdated}`)
    }
    
  } catch (error) {
    stats.totalErrors++
  }
}

function buildProductFromItem(item, tableName) {
  const text = extractTextFromItem(item)
  
  const productName = item.name || item.product_name || item.device_name || 'Unknown'
  const productCode = item.registration_number || item.product_code || item.k_number || item.pma_number || item.cat_num || item.model || String(Math.random())
  
  let manufacturerCountry = item.country_code || item.manufacturer_country || 'Unknown'
  if (typeof manufacturerCountry === 'string') {
    if (manufacturerCountry.includes('China') || manufacturerCountry.includes('CN')) manufacturerCountry = 'CN'
    else if (manufacturerCountry.includes('USA') || manufacturerCountry.includes('US')) manufacturerCountry = 'US'
    else if (manufacturerCountry.includes('Germany') || manufacturerCountry.includes('DE')) manufacturerCountry = 'DE'
    else if (manufacturerCountry.includes('France') || manufacturerCountry.includes('FR')) manufacturerCountry = 'FR'
    else if (manufacturerCountry.includes('UK') || manufacturerCountry.includes('United Kingdom')) manufacturerCountry = 'GB'
    else if (manufacturerCountry.includes('Italy') || manufacturerCountry.includes('IT')) manufacturerCountry = 'IT'
    else if (manufacturerCountry.includes('Spain') || manufacturerCountry.includes('ES')) manufacturerCountry = 'ES'
    else if (manufacturerCountry.includes('Netherlands') || manufacturerCountry.includes('NL')) manufacturerCountry = 'NL'
    else if (manufacturerCountry.includes('Belgium') || manufacturerCountry.includes('BE')) manufacturerCountry = 'BE'
    else if (manufacturerCountry.includes('Switzerland') || manufacturerCountry.includes('CH')) manufacturerCountry = 'CH'
    else if (manufacturerCountry.includes('Austria') || manufacturerCountry.includes('AT')) manufacturerCountry = 'AT'
    else if (manufacturerCountry.includes('Sweden') || manufacturerCountry.includes('SE')) manufacturerCountry = 'SE'
    else if (manufacturerCountry.includes('Norway') || manufacturerCountry.includes('NO')) manufacturerCountry = 'NO'
    else if (manufacturerCountry.includes('Denmark') || manufacturerCountry.includes('DK')) manufacturerCountry = 'DK'
    else if (manufacturerCountry.includes('Finland') || manufacturerCountry.includes('FI')) manufacturerCountry = 'FI'
    else if (manufacturerCountry.includes('Canada') || manufacturerCountry.includes('CA')) manufacturerCountry = 'CA'
    else if (manufacturerCountry.includes('Australia') || manufacturerCountry.includes('AU')) manufacturerCountry = 'AU'
    else if (manufacturerCountry.includes('Japan') || manufacturerCountry.includes('JP')) manufacturerCountry = 'JP'
    else if (manufacturerCountry.includes('South Korea') || manufacturerCountry.includes('KR')) manufacturerCountry = 'KR'
    else if (manufacturerCountry.includes('India') || manufacturerCountry.includes('IN')) manufacturerCountry = 'IN'
    else if (manufacturerCountry.includes('Thailand') || manufacturerCountry.includes('TH')) manufacturerCountry = 'TH'
    else if (manufacturerCountry.includes('Vietnam') || manufacturerCountry.includes('VN')) manufacturerCountry = 'VN'
    else if (manufacturerCountry.includes('Malaysia') || manufacturerCountry.includes('MY')) manufacturerCountry = 'MY'
    else if (manufacturerCountry.includes('Singapore') || manufacturerCountry.includes('SG')) manufacturerCountry = 'SG'
    else if (manufacturerCountry.includes('Philippines') || manufacturerCountry.includes('PH')) manufacturerCountry = 'PH'
    else if (manufacturerCountry.includes('Indonesia') || manufacturerCountry.includes('ID')) manufacturerCountry = 'ID'
    else if (manufacturerCountry.includes('Hong Kong') || manufacturerCountry.includes('HK')) manufacturerCountry = 'HK'
    else if (manufacturerCountry.includes('Taiwan') || manufacturerCountry.includes('TW')) manufacturerCountry = 'TW'
    else manufacturerCountry = 'Unknown'
  }
  
  let ppeCategory = 'II'
  if (item.device_classification || item.device_class) {
    const dc = String(item.device_classification || item.device_class).toUpperCase()
    if (dc.includes('I') && !dc.includes('II')) ppeCategory = 'I'
    else if (dc.includes('III')) ppeCategory = 'III'
    else if (dc.includes('II')) ppeCategory = 'II'
  }
  
  let riskClassification = 'Class II'
  if (item.device_classification || item.device_class) {
    riskClassification = `Class ${item.device_classification || item.device_class}`
  } else if (ppeCategory === 'I') {
    riskClassification = 'Class I'
  } else if (ppeCategory === 'III') {
    riskClassification = 'Class III'
  }
  
  const market = item.market || ''
  const source = item.source || tableName
  
  let targetMarkets = []
  if (EU_COUNTRIES.includes(manufacturerCountry.toUpperCase()) || market.includes('EUDAMED')) targetMarkets.push('EU')
  if (item.country_code === 'US' || item.manufacturer_country === 'US') targetMarkets.push('US')
  if (item.country_code === 'CA' || item.manufacturer_country === 'CA') targetMarkets.push('CA')
  if (item.country_code === 'CN' || item.manufacturer_country === 'CN') targetMarkets.push('CN')
  if (targetMarkets.length === 0) targetMarkets = ['Global']
  
  const marketApprovals = {}
  if (targetMarkets.includes('US')) {
    marketApprovals.us = { status: 'Active', date: item.approval_date || null, number: item.registration_number || null }
  }
  if (targetMarkets.includes('EU')) {
    marketApprovals.eu = { status: 'Active', date: item.approval_date || null, number: item.registration_number || null }
  }
  if (targetMarkets.includes('CN')) {
    marketApprovals.cn = { status: 'Active', date: item.approval_date || null, number: item.registration_number || null }
  }
  
  const certifications = {}
  if (targetMarkets.includes('US')) {
    certifications.fda = { type: item.approval_type === '510(k)' ? 'FDA 510(k)' : 'FDA Establishment', status: 'Active', number: item.registration_number || null }
  }
  if (targetMarkets.includes('EU')) {
    certifications.ce = { type: 'CE Certificate', status: 'Active', number: item.registration_number || null }
  }
  if (targetMarkets.includes('CN')) {
    certifications.nmpa = { type: 'NMPA', status: 'Active', number: item.registration_number || null }
  }
  
  return {
    product_name: String(productName).substring(0, 500),
    product_code: String(productCode).substring(0, 200),
    product_category: categorizeProduct(text),
    sub_category: item.device_classification || item.device_class || '',
    ppe_category: ppeCategory,
    description: String(item.description || item.name || item.summary || '').substring(0, 2000),
    specifications: JSON.stringify({
      product_code: productCode,
      device_classification: item.device_classification || item.device_class || ppeCategory,
      registration_number: item.registration_number || null,
    }),
    features: JSON.stringify({ source: source, manufacturer: item.company_name || item.manufacturer_name || null }),
    images: JSON.stringify([]),
    manufacturer_name: String(item.company_name || item.manufacturer_name || '').substring(0, 500),
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

async function extractFromTableWithPagination(tableName, filter = {}) {
  console.log(`\n=== 从 ${tableName} 提取 PPE 数据（分页）===\n`)
  
  let allData = []
  let from = 0
  const batchSize = 1000
  let totalPages = 0
  
  // 获取总数
  const { count: totalCount } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
  
  totalPages = Math.ceil(totalCount / batchSize)
  console.log(`Total records: ${totalCount}, Pages: ${totalPages}`)
  
  for (let page = 0; page < totalPages; page++) {
    try {
      let query = supabase.from(tableName).select('*').range(from, from + batchSize - 1)
      
      if (Object.keys(filter).length > 0) {
        for (const [key, value] of Object.entries(filter)) {
          query = query.eq(key, value)
        }
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error(`Error fetching page ${page}:`, error.message)
        continue
      }
      
      if (data && data.length > 0) {
        allData = allData.concat(data)
        console.log(`Fetched page ${page + 1}/${totalPages}: ${data.length} records (Total: ${allData.length})`)
      }
      
      from += batchSize
    } catch (error) {
      console.error(`Error in page ${page}:`, error.message)
    }
  }
  
  console.log(`\nTotal fetched: ${allData.length} records\n`)
  
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
      console.error(`Error processing item:`, err.message)
    }
  }
  
  console.log(`\n${tableName} - PPE found: ${ppeCount}, Inserted: ${insertedCount}, Updated: ${updatedCount}`)
  stats.bySource[tableName] = { total: ppeCount, inserted: insertedCount, updated: updatedCount }
}

async function main() {
  console.log('=== 全面提取 PPE 数据（分页版）===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting extraction...\n')
  
  try {
    // 1. 从 all_products 提取（130,953条）
    await extractFromTableWithPagination('all_products')
    
    // 2. 从 fda_510k 提取（11,000条）
    await extractFromTableWithPagination('fda_510k')
    
    // 3. 从 fda_pma 提取（5,155条）
    await extractFromTableWithPagination('fda_pma')
    
    // 4. 从 nmpa_registrations 提取（72,000条）
    await extractFromTableWithPagination('nmpa_registrations')
    
    // 5. 从 eudamed_registrations 提取（43,798条）
    await extractFromTableWithPagination('eudamed_registrations')
    
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

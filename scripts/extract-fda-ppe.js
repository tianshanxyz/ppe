/**
 * FDA PPE 数据采集脚本
 * 
 * 从 FDA 510(k) API 采集 PPE 相关产品数据
 * API 文档：https://api.fda.gov/device/510k.html
 * 
 * 使用方法：
 * node scripts/extract-fda-ppe.js
 */

const https = require('https')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 配置
const FDA_API_BASE = 'https://api.fda.gov/device/510k.json'
const BATCH_SIZE = 1000  // FDA API 每次最多返回 1000 条
const MAX_RECORDS = 50000  // 最大采集数量（避免过度采集）

// PPE 相关关键词
const PPE_KEYWORDS = [
  'personal protective equipment',
  'ppe',
  'protective clothing',
  'protective glove',
  'protective mask',
  'surgical mask',
  'face mask',
  'respirator',
  'n95',
  'kn95',
  'protective eyewear',
  'face shield',
  'goggles',
  'protective gown',
  'isolation gown',
  'surgical gown',
  'medical glove',
  'examination glove',
  'sterile glove',
  'protective footwear',
  'boot cover',
  'shoe cover',
  'head cover',
  'bouffant cap',
  'surgical cap',
]

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// 统计信息
const stats = {
  totalFetched: 0,
  totalInserted: 0,
  totalUpdated: 0,
  totalErrors: 0,
  startTime: new Date(),
}

/**
 * 构建 FDA API 查询
 */
function buildSearchQuery(skip = 0) {
  // 构建 PPE 关键词的搜索条件
  const searchTerms = PPE_KEYWORDS.map(keyword => 
    `indication:"${keyword}" OR device_name:"${keyword}" OR product_code:"${keyword}"`
  ).join(' OR ')
  
  const params = new URLSearchParams({
    search: `(${searchTerms})`,
    limit: BATCH_SIZE.toString(),
    skip: skip.toString(),
  })
  
  return `${FDA_API_BASE}?${params.toString()}`
}

/**
 * 调用 FDA API
 */
function fetchFromFDA(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
        return
      }
      
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve(jsonData)
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`))
        }
      })
    }).on('error', reject)
  })
}

/**
 * 清洗和标准化 FDA 数据
 */
function cleanFDAData(rawData) {
  const results = []
  
  if (!rawData || !rawData.results) {
    return results
  }
  
  for (const item of rawData.results) {
    try {
      // 提取产品信息
      const product = {
        product_name: item.device_name || item.product_name || 'Unknown',
        product_code: item.product_code || '',
        product_category: categorizeProduct(item.indication || item.device_name),
        sub_category: item.device_class || '',
        ppe_category: classifyPPERisk(item.device_class),
        description: item.indication || '',
        specifications: JSON.stringify(item.device_category || {}),
        features: JSON.stringify(item.review_panel || {}),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.applicant_name || item.manufacturer_name || '',
        manufacturer_address: [
          item.applicant_address_1,
          item.applicant_address_2,
          item.applicant_city,
          item.applicant_state,
          item.applicant_country,
        ].filter(Boolean).join(', '),
        manufacturer_country: item.applicant_country || getCountryFromState(item.applicant_state),
        brand_name: item.brand_name || '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'FDA 510(k)',
          status: item.k_status || '',
        }),
        ce_certificate_number: '',
        ce_expiry_date: null,
        fda_k_number: item.k_number || '',
        fda_decision_date: item.decision_date || null,
        nmpa_registration_number: '',
        nmpa_expiry_date: null,
        iso_certifications: [],
        other_certifications: JSON.stringify({}),
        
        // 市场信息
        target_markets: ['US'],
        market_approvals: JSON.stringify({
          us: {
            status: item.k_status,
            date: item.decision_date,
          }
        }),
        registration_status: mapRegistrationStatus(item.k_status),
        
        // 法规符合性
        applicable_regulations: ['FDA 21 CFR Part 800'],
        harmonized_standards: [],
        risk_classification: item.device_class || 'Class II',
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({}),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.decision_date || null,
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
 * 根据产品描述分类
 */
function categorizeProduct(description) {
  if (!description) return 'Other'
  
  const desc = description.toLowerCase()
  
  if (desc.includes('glove')) return '手部防护装备'
  if (desc.includes('mask') || desc.includes('respirator')) return '呼吸防护装备'
  if (desc.includes('gown') || desc.includes('clothing')) return '身体防护装备'
  if (desc.includes('goggle') || desc.includes('eyewear') || desc.includes('face shield')) return '眼面部防护装备'
  if (desc.includes('footwear') || desc.includes('boot') || desc.includes('shoe')) return '足部防护装备'
  if (desc.includes('cap') || desc.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * PPE 风险等级分类
 */
function classifyPPERisk(deviceClass) {
  // FDA device class: 1, 2, 3 -> PPE Category: I, II, III
  if (deviceClass === '1' || deviceClass === 'Class I') return 'I'
  if (deviceClass === '3' || deviceClass === 'Class III') return 'III'
  return 'II'  // 默认 Class II
}

/**
 * 从州名推断国家（主要是美国）
 */
function getCountryFromState(state) {
  if (state) return 'United States'
  return 'Unknown'
}

/**
 * 映射注册状态
 */
function mapRegistrationStatus(fdaStatus) {
  const statusMap = {
    'K': 'active',
    'Approved': 'active',
    'Denied': 'cancelled',
    'Withdrawn': 'cancelled',
  }
  return statusMap[fdaStatus] || 'active'
}

/**
 * 批量插入数据到 Supabase
 */
async function insertProducts(products) {
  if (products.length === 0) return
  
  try {
    // 分批插入，每批 100 条
    const batchSize = 100
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      // 检查是否已存在（通过 product_code）
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
      
      // 显示进度
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
  console.log('=== FDA PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('Batch size:', BATCH_SIZE)
  console.log('Max records:', MAX_RECORDS)
  console.log('\nStarting data collection...\n')
  
  let skip = 0
  let totalRecords = 0
  
  try {
    while (totalRecords < MAX_RECORDS) {
      const url = buildSearchQuery(skip)
      console.log(`Fetching batch ${Math.floor(skip / BATCH_SIZE) + 1} (skip: ${skip})...`)
      
      const data = await fetchFromFDA(url)
      
      if (!data.results || data.results.length === 0) {
        console.log('No more results found. Stopping.')
        break
      }
      
      const cleanedData = cleanFDAData(data)
      console.log(`Fetched ${data.results.length} records, cleaned ${cleanedData.length} records`)
      
      if (cleanedData.length > 0) {
        await insertProducts(cleanedData)
      }
      
      stats.totalFetched += data.results.length
      totalRecords += data.results.length
      
      console.log(`Total fetched: ${stats.totalFetched}\n`)
      
      // 如果返回的记录少于批次大小，说明已经到最后一页
      if (data.results.length < BATCH_SIZE) {
        console.log('Reached end of data.')
        break
      }
      
      skip += BATCH_SIZE
      
      // 避免请求过快，等待 1 秒
      await new Promise(resolve => setTimeout(resolve, 1000))
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
    console.log('\n✅ FDA data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

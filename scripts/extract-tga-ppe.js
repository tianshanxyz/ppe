/**
 * TGA (Therapeutic Goods Administration) PPE 数据采集脚本
 * 
 * 从澳大利亚 ARTG (Australian Register of Therapeutic Goods) 采集 PPE 数据
 * API 文档：https://www.tga.gov.au/resources/australian-register-therapeutic-goods-artg
 * 
 * 使用方法：
 * node scripts/extract-tga-ppe.js
 */

const https = require('https')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 配置
const TGA_API_BASE = 'https://www.tga.gov.au/api/artg/search'
const BATCH_SIZE = 50
const MAX_RECORDS = 10000
const REQUEST_TIMEOUT = 60000  // 60 秒超时

// PPE 相关关键词
const PPE_KEYWORDS = [
  'personal protective equipment',
  'ppe',
  'protective clothing',
  'protective glove',
  'surgical mask',
  'face mask',
  'respirator',
  'n95',
  'p2 respirator',
  'protective eyewear',
  'face shield',
  'goggles',
  'protective gown',
  'isolation gown',
  'surgical gown',
  'medical glove',
  'examination glove',
  'sterile glove',
  'boot cover',
  'shoe cover',
  'surgical cap',
  'bouffant cap',
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
 * 构建 TGA API 查询
 */
function buildSearchQuery(keyword, page = 1) {
  const params = new URLSearchParams({
    q: keyword,
    type: 'medical',
    page: page.toString(),
    per_page: BATCH_SIZE.toString(),
  })
  
  return `${TGA_API_BASE}?${params.toString()}`
}

/**
 * 调用 TGA API
 */
function fetchFromTGA(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.tga.gov.au',
      path: url.replace('https://www.tga.gov.au', ''),
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MDLooker-PPE-DataCollector/1.0',
      },
    }
    
    const req = https.request(options, (res) => {
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
    })
    
    req.on('error', reject)
    req.setTimeout(REQUEST_TIMEOUT, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.end()
  })
}

/**
 * 清洗和标准化 TGA 数据
 */
function cleanTGAData(rawData) {
  const results = []
  
  if (!rawData || !rawData.results) {
    return results
  }
  
  for (const item of rawData.results) {
    try {
      const product = {
        product_name: item.product_name || item.name || 'Unknown',
        product_code: item.artg_id || '',
        product_category: categorizeProduct(item.name || item.product_name),
        sub_category: item.device_category || '',
        ppe_category: 'II',  // TGA 默认 Class II
        description: item.description || '',
        specifications: JSON.stringify(item.details || {}),
        features: JSON.stringify({}),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.manufacturer_name || item.sponsor || '',
        manufacturer_address: [
          item.manufacturer_address,
          item.manufacturer_city,
          item.manufacturer_state,
          item.manufacturer_country,
        ].filter(Boolean).join(', '),
        manufacturer_country: item.manufacturer_country || 'Australia',
        brand_name: item.brand_name || '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'TGA ARTG',
          status: item.status || '',
        }),
        ce_certificate_number: '',
        ce_expiry_date: null,
        fda_k_number: '',
        fda_decision_date: null,
        nmpa_registration_number: '',
        nmpa_expiry_date: null,
        iso_certifications: [],
        other_certifications: JSON.stringify({}),
        
        // 市场信息
        target_markets: ['AU'],
        market_approvals: JSON.stringify({
          au: {
            status: item.status,
            date: item.date_of_listing,
            artg_id: item.artg_id,
          }
        }),
        registration_status: mapRegistrationStatus(item.status),
        
        // 法规符合性
        applicable_regulations: ['Therapeutic Goods Act 1989'],
        harmonized_standards: [],
        risk_classification: 'Class II',
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({}),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.date_of_listing || null,
        expiry_date: item.expiry_date || null,
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
 * 映射注册状态
 */
function mapRegistrationStatus(tgaStatus) {
  const statusMap = {
    'Registered': 'active',
    'Listed': 'active',
    'Included': 'active',
    'Cancelled': 'cancelled',
    'Suspended': 'suspended',
  }
  return statusMap[tgaStatus] || 'active'
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
            console.error('Error updating product:', product.product_code, error.message)
            stats.totalErrors++
          } else {
            stats.totalUpdated++
          }
        } else {
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
  console.log('=== TGA PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('Keywords:', PPE_KEYWORDS.length)
  console.log('Max records:', MAX_RECORDS)
  console.log('\nStarting data collection...\n')
  
  let totalRecords = 0
  
  try {
    for (const keyword of PPE_KEYWORDS) {
      if (totalRecords >= MAX_RECORDS) {
        console.log('\nReached max records limit. Stopping.')
        break
      }
      
      console.log(`Searching for: "${keyword}"`)
      
      let page = 1
      let hasMore = true
      
      while (hasMore && totalRecords < MAX_RECORDS) {
        const url = buildSearchQuery(keyword, page)
        console.log(`  Page ${page}...`)
        
        const data = await fetchFromTGA(url)
        
        if (!data.results || data.results.length === 0) {
          console.log('  No more results.')
          hasMore = false
          break
        }
        
        const cleanedData = cleanTGAData(data)
        console.log(`  Fetched ${data.results.length}, cleaned ${cleanedData.length}`)
        
        if (cleanedData.length > 0) {
          await insertProducts(cleanedData)
        }
        
        stats.totalFetched += data.results.length
        totalRecords += cleanedData.length
        
        // 如果返回的记录少于批次大小，说明已经到最后一页
        if (data.results.length < BATCH_SIZE) {
          hasMore = false
        }
        
        page++
        
        // 避免请求过快，等待 500ms
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log(`Total so far: ${totalRecords}\n`)
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
    console.log('\n✅ TGA data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

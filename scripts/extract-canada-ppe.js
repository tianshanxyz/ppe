/**
 * Health Canada Medical Devices Data Extraction Script
 * 
 * 从加拿大卫生部医疗器械活性许可证列表 (MDALL) 采集 PPE 数据
 * API 文档：https://health-products.canada.ca/api/medical-devices/
 * 
 * 使用方法：
 * node scripts/extract-canada-ppe.js
 */

const https = require('https')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 配置
const HEALTH_CANADA_API_BASE = 'https://health-products.canada.ca/api/medical-devices/v1/devices'
const BATCH_SIZE = 100
const MAX_RECORDS = 20000

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
 * 构建 Health Canada API 查询
 */
function buildSearchQuery(keyword, offset = 0) {
  const params = new URLSearchParams({
    search: keyword,
    limit: BATCH_SIZE.toString(),
    offset: offset.toString(),
  })
  
  return `${HEALTH_CANADA_API_BASE}?${params.toString()}`
}

/**
 * 调用 Health Canada API
 */
function fetchFromHealthCanada(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'health-products.canada.ca',
      path: url.replace('https://health-products.canada.ca', ''),
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
    req.setTimeout(30000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.end()
  })
}

/**
 * 清洗和标准化 Health Canada 数据
 */
function cleanHealthCanadaData(rawData) {
  const results = []
  
  if (!rawData || !rawData.devices) {
    return results
  }
  
  for (const item of rawData.devices) {
    try {
      const product = {
        product_name: item.device_name || item.name || 'Unknown',
        product_code: item.licence_number || '',
        product_category: categorizeProduct(item.device_category || item.name),
        sub_category: item.device_category || '',
        ppe_category: classifyPPERisk(item.class),
        description: item.description || '',
        specifications: JSON.stringify(item.device_technology || {}),
        features: JSON.stringify({}),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.manufacturer_name || item.sponsor_name || '',
        manufacturer_address: [
          item.manufacturer_address,
          item.manufacturer_city,
          item.manufacturer_province,
          item.manufacturer_country,
        ].filter(Boolean).join(', '),
        manufacturer_country: item.manufacturer_country || 'Canada',
        brand_name: item.brand_name || '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'Health Canada MDALL',
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
        target_markets: ['CA'],
        market_approvals: JSON.stringify({
          ca: {
            status: item.status,
            date: item.date_of_decision,
            licence_number: item.licence_number,
          }
        }),
        registration_status: mapRegistrationStatus(item.status),
        
        // 法规符合性
        applicable_regulations: ['Food and Drugs Act', 'Medical Devices Regulations'],
        harmonized_standards: [],
        risk_classification: `Class ${item.class || 'II'}`,
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({}),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.date_of_decision || null,
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
  // Health Canada class: I, II, III, IV -> PPE Category: I, II, III
  if (deviceClass === 'I' || deviceClass === '1') return 'I'
  if (deviceClass === 'III' || deviceClass === '3' || deviceClass === 'IV' || deviceClass === '4') return 'III'
  return 'II'
}

/**
 * 映射注册状态
 */
function mapRegistrationStatus(hcStatus) {
  const statusMap = {
    'Licensed': 'active',
    'Active': 'active',
    'Approved': 'active',
    'Cancelled': 'cancelled',
    'Suspended': 'suspended',
    'Expired': 'expired',
  }
  return statusMap[hcStatus] || 'active'
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
  console.log('=== Health Canada PPE Data Extraction ===\n')
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
      
      let offset = 0
      let hasMore = true
      
      while (hasMore && totalRecords < MAX_RECORDS) {
        const url = buildSearchQuery(keyword, offset)
        console.log(`  Offset ${offset}...`)
        
        const data = await fetchFromHealthCanada(url)
        
        if (!data.devices || data.devices.length === 0) {
          console.log('  No more results.')
          hasMore = false
          break
        }
        
        const cleanedData = cleanHealthCanadaData(data)
        console.log(`  Fetched ${data.devices.length}, cleaned ${cleanedData.length}`)
        
        if (cleanedData.length > 0) {
          await insertProducts(cleanedData)
        }
        
        stats.totalFetched += data.devices.length
        totalRecords += cleanedData.length
        
        // 如果返回的记录少于批次大小，说明已经到最后一页
        if (data.devices.length < BATCH_SIZE) {
          hasMore = false
        }
        
        offset += BATCH_SIZE
        
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
    console.log('\n✅ Health Canada data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

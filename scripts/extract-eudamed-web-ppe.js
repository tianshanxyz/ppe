/**
 * 从 EUDAMED 公开网站采集欧洲 PPE 数据
 * 
 * 使用网页爬取方式从 EUDAMED 公开搜索界面获取数据
 * https://ec.europa.eu/tools/eudamed/eudamed
 * 
 * 使用方法：
 * node scripts/extract-eudamed-web-ppe.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// EUDAMED 网站配置
const EUDAMED_SEARCH_URL = 'https://ec.europa.eu/tools/eudamed/eudamed/#/search/devices'

// PPE 相关关键词（欧洲常用术语）
const PPE_KEYWORDS = [
  'glove',
  'mask',
  'respirator',
  'gown',
  'protective clothing',
  'face shield',
  'goggle',
  'shoe cover',
  'head cover',
  'ppe'
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
 * 从 EUDAMED 网页 API 获取数据
 * 使用公开搜索端点
 */
async function fetchFromEUDAMEDWeb(keyword, page = 0) {
  try {
    // EUDAMED 使用的内部 API 端点
    const url = `https://ec.europa.eu/tools/eudamed/api/devices/searches?page=${page}&size=25&sort=lastUpdatedDate,desc`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://ec.europa.eu',
        'Referer': 'https://ec.europa.eu/tools/eudamed/eudamed/',
      },
      body: JSON.stringify({
        search: keyword,
        deviceTypeCode: null,
        riskClassCode: null,
        implantable: null,
        sterile: null,
        measuring: null,
        reprocessable: null,
        containingLatex: null,
        containingPhthalates: null,
        containingBpa: null,
        containingMethylisothiazolinone: null,
        containingTitaniumDioxide: null,
        containingZincOxide: null,
        containingSilver: null,
        containingGold: null,
        containingCopper: null,
        containingPlatinum: null,
        containingPalladium: null,
        containingIridium: null,
        containingOsmium: null,
        containingRuthenium: null,
        containingRhodium: null,
        containingRhenium: null,
        containingTantalum: null,
        containingNiobium: null,
        containingZirconium: null,
        containingTantalumAlloy: null,
        containingNiobiumAlloy: null,
        containingZirconiumAlloy: null,
        containingTitaniumAlloy: null,
        containingStainlessSteel: null,
        containingCobaltChromium: null,
        containingNitinol: null,
        containingPlatinumIridium: null,
        containingGoldPlatinum: null,
        containingSilverPalladium: null,
        containingCopperZinc: null,
        containingCopperTin: null,
        containingCopperNickel: null,
        containingCopperAluminum: null,
        containingCopperBeryllium: null,
        containingCopperChromium: null,
        containingCopperIron: null,
        containingCopperManganese: null,
        containingCopperSilicon: null,
        containingCopperTitanium: null,
        containingCopperZirconium: null,
        containingCopperTantalum: null,
        containingCopperNiobium: null,
        containingCopperPlatinum: null,
        containingCopperPalladium: null,
        containingCopperIridium: null,
        containingCopperOsmium: null,
        containingCopperRuthenium: null,
        containingCopperRhodium: null,
        containingCopperRhenium: null,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching from EUDAMED:', error.message)
    return null
  }
}

/**
 * 检查是否为 PPE 产品
 */
function isPPEProduct(deviceName, deviceDescription, tradeName) {
  if (!deviceName && !deviceDescription && !tradeName) return false
  
  const text = `${deviceName || ''} ${deviceDescription || ''} ${tradeName || ''}`.toLowerCase()
  
  const ppeKeywords = [
    'glove', 'gloves', 'hand protection',
    'mask', 'masks', 'respirator', 'respirators',
    'ffp2', 'ffp3', 'n95', 'surgical mask',
    'gown', 'gowns', 'protective clothing', 'coverall', 'coveralls',
    'goggle', 'goggles', 'face shield', 'face shields',
    'eye protection', 'protective eyewear',
    'shoe cover', 'shoe covers', 'boot cover', 'boot covers',
    'cap', 'caps', 'head cover', 'bouffant', 'head protection',
    'ppe', 'personal protective equipment',
    'examination glove', 'surgical glove',
    'isolation gown', 'surgical gown', 'protective gown',
    'safety glasses', 'protective suit',
    'medical glove', 'nitrile glove', 'latex glove',
    'disposable glove', 'reusable glove'
  ]
  
  return ppeKeywords.some(keyword => text.includes(keyword.toLowerCase()))
}

/**
 * 分类 PPE 产品
 */
function categorizeProduct(deviceName, deviceDescription, tradeName) {
  const text = `${deviceName || ''} ${deviceDescription || ''} ${tradeName || ''}`.toLowerCase()
  
  if (text.includes('glove') || text.includes('gloves')) return '手部防护装备'
  if (text.includes('mask') || text.includes('respirator') || text.includes('ffp') || text.includes('n95')) return '呼吸防护装备'
  if (text.includes('gown') || text.includes('coverall') || text.includes('clothing') || text.includes('suit')) return '身体防护装备'
  if (text.includes('goggle') || text.includes('face shield') || text.includes('eye') || text.includes('eyewear')) return '眼面部防护装备'
  if (text.includes('shoe') || text.includes('boot')) return '足部防护装备'
  if (text.includes('cap') || text.includes('head')) return '头部防护装备'
  
  return '其他'
}

/**
 * 清洗和转换 EUDAMED 数据
 */
function cleanEUDAMEDData(rawData) {
  const results = []
  
  for (const item of rawData) {
    try {
      // 检查是否为 PPE 产品
      if (!isPPEProduct(item.name, item.description, item.tradeName)) {
        continue
      }
      
      const product = {
        product_name: item.tradeName || item.name || 'Unknown',
        product_code: item.primaryDi || item.basicUdi || item.uuid || '',
        product_category: categorizeProduct(item.name, item.description, item.tradeName),
        sub_category: item.deviceType || '',
        ppe_category: 'II',
        description: item.description || '',
        specifications: JSON.stringify({
          basicUdi: item.basicUdi,
          primaryDi: item.primaryDi,
          uuid: item.uuid,
          deviceType: item.deviceType,
          riskClass: item.riskClass,
          sterile: item.sterile,
          measuring: item.measuring,
        }),
        features: JSON.stringify({
          notifiedBody: item.notifiedBody,
          manufacturerName: item.manufacturerName,
        }),
        images: JSON.stringify([]),
        
        // 企业信息
        manufacturer_name: item.manufacturerName || '',
        manufacturer_address: item.manufacturerAddress || '',
        manufacturer_country: item.manufacturerCountry || 'EU',
        brand_name: item.brandName || '',
        
        // 认证信息
        certifications: JSON.stringify({
          type: 'CE (EUDAMED)',
          status: 'Active',
          notifiedBody: item.notifiedBody,
          riskClass: item.riskClass,
        }),
        ce_certificate_number: item.notifiedBody || '',
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
            status: 'Active',
            date: item.lastUpdatedDate,
            notifiedBody: item.notifiedBody,
            riskClass: item.riskClass,
          }
        }),
        registration_status: 'active',
        
        // 法规符合性
        applicable_regulations: ['EU MDR 2017/745'],
        harmonized_standards: [],
        risk_classification: item.riskClass || 'Class II',
        essential_requirements: JSON.stringify({}),
        
        // 性能指标
        performance_metrics: JSON.stringify({
          sterile: item.sterile,
          measuring: item.measuring,
        }),
        test_reports: JSON.stringify({}),
        
        // 时间信息
        approval_date: item.lastUpdatedDate || null,
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
    const batchSize = 50
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
  console.log('=== EUDAMED Web PPE Data Extraction ===\n')
  console.log('Start time:', stats.startTime.toLocaleString())
  console.log('PPE Keywords:', PPE_KEYWORDS.length)
  console.log('\nStarting data extraction...\n')
  
  try {
    // 使用 PPE 关键词搜索
    for (const keyword of PPE_KEYWORDS) {
      console.log(`\n--- Searching for: ${keyword} ---`)
      
      let page = 0
      let hasMore = true
      let keywordTotal = 0
      
      while (hasMore && page < 5) { // 限制每个关键词最多 5 页
        try {
          const data = await fetchFromEUDAMEDWeb(keyword, page)
          
          if (!data || !data.content || data.content.length === 0) {
            console.log('No more results for this keyword.')
            break
          }
          
          console.log(`Page ${page + 1}: Found ${data.content.length} devices`)
          
          // 清洗和筛选 PPE 产品
          const cleanedData = cleanEUDAMEDData(data.content)
          console.log(`  PPE products: ${cleanedData.length}`)
          
          if (cleanedData.length > 0) {
            await insertProducts(cleanedData)
            keywordTotal += cleanedData.length
          }
          
          stats.totalFetched += data.content.length
          
          // 检查是否还有下一页
          if (data.last || !data.totalPages || page >= data.totalPages - 1) {
            hasMore = false
          }
          
          page++
          
          // 避免请求过快，等待 2 秒
          await new Promise(resolve => setTimeout(resolve, 2000))
          
        } catch (error) {
          console.error(`Error on page ${page + 1}:`, error.message)
          break
        }
      }
      
      console.log(`Total for '${keyword}': ${keywordTotal} PPE products`)
      
      // 每个关键词之间等待 3 秒
      await new Promise(resolve => setTimeout(resolve, 3000))
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
    console.log('\n✅ EUDAMED Web PPE data extraction completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// 运行主函数
main()

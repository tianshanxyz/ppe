/**
 * FDA 510(k) 数据增量同步脚本
 * 
 * 任务D-004: FDA数据增量同步
 * 创建时间: 2026-04-20
 * 
 * 功能:
 * - 从FDA Open API获取最新510(k)数据
 * - 增量更新到Supabase数据库
 * - 支持全量同步和增量同步
 * - 数据质量检查和修复
 */

import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import { config } from 'dotenv'

// 加载环境变量
config({ path: '.env.local' })

// ============================================
// 配置
// ============================================

const FDA_API_BASE = 'https://api.fda.gov/device/510k.json'
const BATCH_SIZE = 100  // FDA API每页最大100条
const RATE_LIMIT_DELAY = 1000  // FDA API限制: 240请求/分钟

// PPE产品代码列表（FDA Product Code）
const PPE_PRODUCT_CODES = [
  'LYY',  // 手套
  'FXX',  // 口罩
  'LZA',  // 防护服
  'LYU',  // 护目镜
  'LRC',  // 面罩
  'FXZ',  // 呼吸器
  'KHA',  // 耳塞
  'LQU',  // 安全帽
  'JTY',  // 安全带
  'FMK',  // 采血针
  'DQD',  // 听诊器保护套
  'FCG',  // 同轴针
  'DXY',  // 绝缘靴
  'FMI',  // 安全针头
]

// ============================================
// 类型定义
// ============================================

interface FDA510kRecord {
  k_number: string
  device_name: string
  applicant: string
  decision: string
  decision_date: string
  product_code: string
  device_class: string
  statement_or_summary: string
  clearance_type: string
  openfda?: {
    device_name?: string[]
    medical_specialty_description?: string[]
    regulation_number?: string[]
  }
}

interface FDAAPIResponse {
  meta: {
    disclaimer: string
    terms: string
    license: string
    last_updated: string
    results: {
      skip: number
      limit: number
      total: number
    }
  }
  results: FDA510kRecord[]
}

interface SyncResult {
  totalFetched: number
  newRecords: number
  updatedRecords: number
  failedRecords: number
  errors: string[]
}

// ============================================
// FDA API 客户端
// ============================================

class FDAAPIClient {
  private apiKey: string | undefined
  private requestCount = 0
  private lastRequestTime = 0

  constructor() {
    this.apiKey = process.env.FDA_API_KEY
  }

  /**
   * 速率限制处理
   */
  private async rateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      await this.sleep(RATE_LIMIT_DELAY - timeSinceLastRequest)
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 搜索510(k)记录
   */
  async search510k(
    productCode: string,
    skip: number = 0,
    limit: number = BATCH_SIZE,
    fromDate?: string
  ): Promise<FDAAPIResponse> {
    await this.rateLimit()

    const params: Record<string, string | number> = {
      search: `product_code:"${productCode}"`,
      skip,
      limit,
    }

    // 如果指定了日期，添加日期筛选
    if (fromDate) {
      params.search += `+AND+decision_date:[${fromDate}+TO+${new Date().toISOString().split('T')[0]}]`
    }

    if (this.apiKey) {
      params.api_key = this.apiKey
    }

    try {
      const response = await axios.get(FDA_API_BASE, { params })
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404) {
        // 没有数据返回空结果
        return {
          meta: {
            disclaimer: '',
            terms: '',
            license: '',
            last_updated: new Date().toISOString(),
            results: { skip, limit, total: 0 }
          },
          results: []
        }
      }
      throw error
    }
  }

  /**
   * 获取所有PPE产品的510(k)记录
   */
  async fetchAllPPERecords(fromDate?: string): Promise<FDA510kRecord[]> {
    const allRecords: FDA510kRecord[] = []

    for (const productCode of PPE_PRODUCT_CODES) {
      console.log(`[FDA] 正在获取产品代码 ${productCode} 的数据...`)
      
      let skip = 0
      let total = 0
      let hasMore = true

      while (hasMore) {
        try {
          const response = await this.search510k(productCode, skip, BATCH_SIZE, fromDate)
          
          total = response.meta.results.total
          const records = response.results

          if (records.length === 0) {
            hasMore = false
            break
          }

          allRecords.push(...records)
          skip += records.length

          console.log(`[FDA] ${productCode}: 已获取 ${skip}/${total} 条记录`)

          // 检查是否还有更多数据
          hasMore = skip < total && skip < 5000  // 限制每个产品代码最多5000条
        } catch (error: any) {
          console.error(`[FDA] 获取 ${productCode} 数据失败:`, error.message)
          break
        }
      }
    }

    // 去重（基于K号）
    const uniqueRecords = new Map<string, FDA510kRecord>()
    for (const record of allRecords) {
      uniqueRecords.set(record.k_number, record)
    }

    console.log(`[FDA] 总共获取 ${uniqueRecords.size} 条唯一记录`)
    return Array.from(uniqueRecords.values())
  }
}

// ============================================
// 数据转换器
// ============================================

class FDADataTransformer {
  /**
   * 将FDA记录转换为增强版产品格式
   */
  static transformToProduct(record: FDA510kRecord): any {
    const decisionDate = record.decision_date ? new Date(record.decision_date) : null
    
    return {
      // 基础信息
      product_name: record.device_name,
      product_code: record.product_code,
      product_category: this.mapProductCategory(record.product_code),
      sub_category: this.mapSubCategory(record.product_code),
      ppe_category: this.mapPPECategory(record.device_class),
      
      // 描述
      description: record.device_name,
      intended_use: this.extractIntendedUse(record),
      target_users: ['healthcare_professionals', 'industrial_workers', 'general_public'],
      
      // 技术规格（初始为空，后续补充）
      specifications: {},
      
      // 产品特性
      features: {
        key_features: [],
        advantages: [],
        certifications_highlight: ['FDA 510(k)'],
      },
      
      // 图片
      images: {
        main_image: '',
        gallery: [],
        certification_documents: [],
        test_reports: [],
      },
      
      // 制造商信息（从applicant解析）
      manufacturer_name: record.applicant,
      manufacturer_country: '',  // 需要后续补充
      brand_name: record.applicant.split(',')[0],  // 简单解析
      
      // 认证详情
      certifications: {
        fda_510k: {
          k_number: record.k_number,
          device_name: record.device_name,
          applicant: record.applicant,
          decision: record.decision,
          decision_date: record.decision_date,
          product_code: record.product_code,
          device_class: record.device_class,
          status: record.decision.toLowerCase().includes('substantially equivalent') ? 'active' : 'inactive',
        },
      },
      
      // 目标市场
      target_markets: ['US'],
      market_approvals: [
        {
          market_code: 'US',
          approval_status: 'approved',
          approval_date: record.decision_date,
        },
      ],
      
      // 注册状态
      registration_status: this.mapRegistrationStatus(record.decision),
      
      // 适用法规
      applicable_regulations: ['FDA 21 CFR'],
      harmonized_standards: [],
      
      // 风险分类
      risk_classification: `Class ${record.device_class}`,
      
      // 时间戳
      approval_date: record.decision_date,
      expiry_date: null,  // 510(k)通常没有固定过期日期
      last_sync_at: new Date().toISOString(),
      
      // 数据质量
      data_quality_score: 60,  // 基础分数，需要后续补充
      data_completeness: {
        basic_info: 80,
        specifications: 20,
        certifications: 90,
        test_reports: 0,
      },
    }
  }

  /**
   * 映射产品类别
   */
  private static mapProductCategory(productCode: string): string {
    const categoryMap: Record<string, string> = {
      'LYY': 'hand_protection',
      'FXX': 'respiratory_protection',
      'LZA': 'body_protection',
      'LYU': 'eye_protection',
      'LRC': 'face_protection',
      'FXZ': 'respiratory_protection',
      'KHA': 'hearing_protection',
      'LQU': 'head_protection',
      'JTY': 'fall_protection',
      'FMK': 'medical_accessories',
      'DQD': 'medical_accessories',
      'FCG': 'medical_accessories',
      'DXY': 'foot_protection',
      'FMI': 'medical_accessories',
    }
    return categoryMap[productCode] || 'other'
  }

  /**
   * 映射子类别
   */
  private static mapSubCategory(productCode: string): string {
    const subCategoryMap: Record<string, string> = {
      'LYY': 'gloves',
      'FXX': 'surgical_mask',
      'LZA': 'protective_clothing',
      'LYU': 'safety_goggles',
      'LRC': 'face_shield',
      'FXZ': 'respirator',
      'KHA': 'ear_plugs',
      'LQU': 'safety_helmet',
      'JTY': 'safety_harness',
      'FMK': 'lancet',
      'DQD': 'stethoscope_cover',
      'FCG': 'coaxial_needle',
      'DXY': 'insulating_boot',
      'FMI': 'safety_needle',
    }
    return subCategoryMap[productCode] || 'other'
  }

  /**
   * 映射PPE类别
   */
  private static mapPPECategory(deviceClass: string): 'I' | 'II' | 'III' {
    switch (deviceClass) {
      case '1':
      case 'I':
        return 'I'
      case '2':
      case 'II':
        return 'II'
      case '3':
      case 'III':
        return 'III'
      default:
        return 'II'  // 默认II类
    }
  }

  /**
   * 映射注册状态
   */
  private static mapRegistrationStatus(decision: string): string {
    const decision_lower = decision.toLowerCase()
    if (decision_lower.includes('substantially equivalent')) {
      return 'active'
    } else if (decision_lower.includes('withdrawn')) {
      return 'cancelled'
    } else if (decision_lower.includes('pending')) {
      return 'pending'
    }
    return 'active'
  }

  /**
   * 提取预期用途
   */
  private static extractIntendedUse(record: FDA510kRecord): string[] {
    const uses: string[] = []
    
    // 基于产品代码推断用途
    const productCode = record.product_code
    if (productCode === 'FXX' || productCode === 'FXZ') {
      uses.push('respiratory_protection', 'infection_control')
    } else if (productCode === 'LYY') {
      uses.push('hand_protection', 'infection_control')
    } else if (productCode === 'LZA') {
      uses.push('body_protection', 'chemical_protection')
    } else if (productCode === 'LYU' || productCode === 'LRC') {
      uses.push('eye_protection', 'face_protection', 'splash_protection')
    }
    
    return uses.length > 0 ? uses : ['general_protection']
  }
}

// ============================================
// 数据同步器
// ============================================

class FDADataSync {
  private supabase
  private fdaClient: FDAAPIClient

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.fdaClient = new FDAAPIClient()
  }

  /**
   * 执行增量同步
   */
  async syncIncremental(daysBack: number = 7): Promise<SyncResult> {
    console.log(`[Sync] 开始增量同步，获取过去 ${daysBack} 天的数据...`)
    
    const result: SyncResult = {
      totalFetched: 0,
      newRecords: 0,
      updatedRecords: 0,
      failedRecords: 0,
      errors: [],
    }

    // 计算起始日期
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - daysBack)
    const fromDateStr = fromDate.toISOString().split('T')[0]

    try {
      // 1. 获取FDA数据
      const records = await this.fdaClient.fetchAllPPERecords(fromDateStr)
      result.totalFetched = records.length

      // 2. 处理每条记录
      for (const record of records) {
        try {
          const syncResult = await this.syncRecord(record)
          if (syncResult === 'new') {
            result.newRecords++
          } else if (syncResult === 'updated') {
            result.updatedRecords++
          }
        } catch (error: any) {
          result.failedRecords++
          result.errors.push(`K号 ${record.k_number}: ${error.message}`)
          console.error(`[Sync] 同步记录 ${record.k_number} 失败:`, error.message)
        }
      }

      // 3. 更新同步状态
      await this.updateSyncStatus('success', result)

    } catch (error: any) {
      console.error('[Sync] 同步失败:', error)
      await this.updateSyncStatus('failed', result, error.message)
      result.errors.push(error.message)
    }

    return result
  }

  /**
   * 执行全量同步
   */
  async syncFull(): Promise<SyncResult> {
    console.log('[Sync] 开始全量同步...')
    return this.syncIncremental(365 * 10)  // 获取10年的数据
  }

  /**
   * 同步单条记录
   */
  private async syncRecord(record: FDA510kRecord): Promise<'new' | 'updated' | 'skipped'> {
    const product = FDADataTransformer.transformToProduct(record)

    // 检查是否已存在
    const { data: existing } = await this.supabase
      .from('ppe_products_enhanced')
      .select('id, certifications')
      .filter('certifications', 'cs', `{ "fda_510k": { "k_number": "${record.k_number}" } }`)
      .single()

    if (existing) {
      // 更新现有记录
      const { error } = await this.supabase
        .from('ppe_products_enhanced')
        .update({
          ...product,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) throw error
      console.log(`[Sync] 更新记录: ${record.k_number}`)
      return 'updated'
    } else {
      // 插入新记录
      const { error } = await this.supabase
        .from('ppe_products_enhanced')
        .insert(product)

      if (error) throw error
      console.log(`[Sync] 新增记录: ${record.k_number}`)
      return 'new'
    }
  }

  /**
   * 更新同步状态
   */
  private async updateSyncStatus(
    status: 'success' | 'failed',
    result: SyncResult,
    errorMessage?: string
  ) {
    const { error } = await this.supabase
      .from('data_sync_status')
      .upsert({
        data_source: 'fda',
        source_name: 'FDA 510(k) Database',
        last_sync_at: new Date().toISOString(),
        last_sync_status: status,
        last_sync_records_count: result.totalFetched,
        stats: {
          new_records: result.newRecords,
          updated_records: result.updatedRecords,
          failed_records: result.failedRecords,
        },
        last_error: errorMessage ? {
          message: errorMessage,
          timestamp: new Date().toISOString(),
        } : null,
        health_status: status === 'success' ? 'healthy' : 'unhealthy',
      }, {
        onConflict: 'data_source',
      })

    if (error) {
      console.error('[Sync] 更新同步状态失败:', error)
    }
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  const args = process.argv.slice(2)
  const isFullSync = args.includes('--full')
  const daysBack = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1] || '7')

  console.log('========================================')
  console.log('FDA 510(k) 数据同步工具')
  console.log('========================================')
  console.log(`模式: ${isFullSync ? '全量同步' : '增量同步'}`)
  if (!isFullSync) {
    console.log(`时间范围: 过去 ${daysBack} 天`)
  }
  console.log('')

  const sync = new FDADataSync()

  try {
    const result = isFullSync 
      ? await sync.syncFull()
      : await sync.syncIncremental(daysBack)

    console.log('')
    console.log('========================================')
    console.log('同步结果')
    console.log('========================================')
    console.log(`获取记录: ${result.totalFetched}`)
    console.log(`新增记录: ${result.newRecords}`)
    console.log(`更新记录: ${result.updatedRecords}`)
    console.log(`失败记录: ${result.failedRecords}`)
    
    if (result.errors.length > 0) {
      console.log('')
      console.log('错误详情:')
      result.errors.forEach(err => console.log(`  - ${err}`))
    }

    process.exit(result.failedRecords > result.totalFetched * 0.1 ? 1 : 0)
  } catch (error: any) {
    console.error('同步失败:', error.message)
    process.exit(1)
  }
}

// 执行主函数
main()

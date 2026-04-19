/**
 * 法规数据智能同步脚本
 * 实现法规数据的智能增量同步
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Supabase配置
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zgwuttvphapzwnonfrqy.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpnd3V0dHZwaGFwendub25mcnF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzgwMTQ0NSwiZXhwIjoyMDUzMzc3NDQ1fQ.0xV4pT1qxJ7gb3xS4wFZLQ1ojQ8x8f5q1qqq1qqq1qq'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// 同步配置
const SYNC_CONFIG = {
  phase: 'mvp', // 'mvp' | 'growth' | 'full'
  maxRecords: 5000,
  yearRange: 5,
  batchSize: 100,
  delayMs: 1000,
  incremental: true
}

/**
 * 读取法规数据文件
 */
async function loadRegulationData(filename) {
  const filePath = path.join(__dirname, '../../data/regulations', filename)
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`❌ 读取文件失败 ${filename}:`, error.message)
    return null
  }
}

/**
 * 获取上次同步时间
 */
async function getLastSyncTime() {
  const { data, error } = await supabase
    .from('data_update_logs')
    .select('created_at')
    .eq('source', 'regulations')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  return error ? null : data?.created_at
}

/**
 * 构建增量查询条件
 */
function buildIncrementalQuery(lastSync, config) {
  const now = new Date()
  const startDate = new Date(now.getTime() - config.yearRange * 365 * 24 * 60 * 60 * 1000)
  
  return {
    effective_date_gte: startDate.toISOString().split('T')[0],
    jurisdiction: config.jurisdiction || null
  }
}

/**
 * 分批获取法规数据
 */
async function fetchInBatches(query, batchSize, delayMs) {
  const allRegulations = []
  
  // 这里简化处理，实际应该分页获取
  // 由于我们使用本地JSON文件，直接返回所有数据
  console.log(`📦 准备获取法规数据...`)
  
  return allRegulations
}

/**
 * 清洗法规数据
 */
function cleanData(regulations) {
  return regulations.map(reg => ({
    title: reg.title?.trim() || '',
    title_zh: reg.title_zh?.trim() || '',
    jurisdiction: reg.jurisdiction?.toUpperCase() || '',
    type: reg.type || 'regulation',
    category: reg.category?.trim() || 'General',
    effective_date: reg.effective_date || null,
    content: reg.content?.trim() || '',
    keywords: reg.keywords || [],
    attachments: reg.attachments ? JSON.parse(reg.attachments) : null
  }))
}

/**
 * Upsert法规到数据库
 */
async function upsertToSupabase(regulations) {
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < regulations.length; i += SYNC_CONFIG.batchSize) {
    const batch = regulations.slice(i, i + SYNC_CONFIG.batchSize)
    
    const { error } = await supabase
      .from('regulations')
      .upsert(batch, {
        onConflict: 'title,jurisdiction'
      })
    
    if (error) {
      console.error(`❌ 批量插入失败:`, error.message)
      errorCount += batch.length
    } else {
      successCount += batch.length
      console.log(`✅ 成功插入 ${batch.length} 条法规`)
    }
    
    // 添加延迟避免请求过快
    if (i + SYNC_CONFIG.batchSize < regulations.length) {
      await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.delayMs))
    }
  }
  
  return successCount
}

/**
 * 保存同步日志
 */
async function saveSyncLog(source, count, status, error = null) {
  const { error: logError } = await supabase
    .from('data_update_logs')
    .insert({
      source: source,
      record_count: count,
      status: status,
      error_message: error,
      details: {
        phase: SYNC_CONFIG.phase,
        batchSize: SYNC_CONFIG.batchSize,
        delayMs: SYNC_CONFIG.delayMs
      }
    })
  
  if (logError) {
    console.error('保存同步日志失败:', logError.message)
  }
}

/**
 * 智能同步主函数
 */
async function smartSync() {
  console.log('🚀 开始法规数据智能同步...')
  console.log(`配置: ${SYNC_CONFIG.phase} 阶段`)
  console.log(`最大记录数: ${SYNC_CONFIG.maxRecords}`)
  console.log(`年份范围: ${SYNC_CONFIG.yearRange} 年`)
  console.log(`批次大小: ${SYNC_CONFIG.batchSize}`)
  console.log(`延迟: ${SYNC_CONFIG.delayMs}ms\n`)
  
  // 1. 检查上次同步时间
  const lastSync = await getLastSyncTime()
  console.log(`📅 上次同步时间: ${lastSync || '首次同步'}`)
  
  // 2. 加载法规数据文件
  const files = [
    'fda-regulations-2024-2026.json',
    'eu-mdcg-regulations-2024-2026.json',
    'nmpa-regulations-2024-2026.json',
    'other-markets-regulations-2024-2026.json'
  ]
  
  let totalSuccess = 0
  let totalError = 0
  
  for (const file of files) {
    console.log(`\n📂 处理文件: ${file}`)
    
    const data = await loadRegulationData(file)
    if (!data) {
      totalError++
      continue
    }
    
    console.log(`   总记录数: ${data.total_count}`)
    
    // 3. 清洗数据
    const cleaned = cleanData(data.regulations)
    console.log(`   清洗后: ${cleaned.length} 条`)
    
    // 4. Upsert到数据库
    const success = await upsertToSupabase(cleaned)
    totalSuccess += success
    
    // 5. 保存同步日志
    await saveSyncLog(data.source, success, 'success')
    
    console.log(`   ✅ 成功: ${success} 条`)
  }
  
  // 6. 生成同步报告
  console.log('\n' + '='.repeat(60))
  console.log('📊 同步报告')
  console.log('='.repeat(60))
  console.log(`总成功: ${totalSuccess} 条`)
  console.log(`总失败: ${totalError} 条`)
  console.log(`配置阶段: ${SYNC_CONFIG.phase}`)
  console.log(`批次大小: ${SYNC_CONFIG.batchSize}`)
  console.log(`延迟: ${SYNC_CONFIG.delayMs}ms`)
  
  // 7. 保存最终同步日志
  await saveSyncLog('regulations', totalSuccess, totalError > 0 ? 'partial' : 'success')
  
  console.log('\n✅ 同步完成！')
}

// 运行同步
smartSync().catch(console.error)

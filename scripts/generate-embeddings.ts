/**
 * Embedding Generation Script - 向量生成脚本
 * 
 * 功能：
 * 1. 为现有数据生成embedding向量（使用火山方舟大模型）
 * 2. 批量处理优化性能
 * 3. 支持断点续传
 * 4. 进度报告和错误处理
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(process.cwd(), '.env') })

// 火山方舟配置
const ARK_API_KEY = process.env.VOLCENGINE_ARK_API_KEY
const ARK_EMBEDDING_URL = 'https://ark.cn-beijing.volces.com/api/v3/embeddings'
const EMBEDDING_MODEL = 'doubao-embedding'
const EMBEDDING_DIMENSION = 1024

// 批处理配置
const BATCH_SIZE = 50
const MAX_RETRIES = 3
const RETRY_DELAY = 2000

// Supabase配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('错误：缺少Supabase环境变量')
  process.exit(1)
}

if (!ARK_API_KEY) {
  console.error('错误：缺少VOLCENGINE_ARK_API_KEY环境变量')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface EntityToProcess {
  entity_id: string
  content: string
  entity_type: 'product' | 'company' | 'regulation'
}

interface EmbeddingResult {
  embedding: number[]
  tokenUsage: number
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('MDLooker 向量生成脚本 (火山方舟)')
  console.log('========================================')
  console.log(`模型: ${EMBEDDING_MODEL}`)
  console.log(`维度: ${EMBEDDING_DIMENSION}`)
  console.log(`批次大小: ${BATCH_SIZE}`)
  console.log('========================================\n')

  const args = process.argv.slice(2)
  const entityType = args[0] as 'product' | 'company' | 'regulation' | 'all'
  const limit = parseInt(args[1]) || 1000

  if (!entityType || !['product', 'company', 'regulation', 'all'].includes(entityType)) {
    console.log('用法: npx ts-node scripts/generate-embeddings.ts <entityType> [limit]')
    console.log('  entityType: product | company | regulation | all')
    console.log('  limit: 最大处理数量 (默认: 1000)')
    console.log('\n示例:')
    console.log('  npx ts-node scripts/generate-embeddings.ts product 500')
    console.log('  npx ts-node scripts/generate-embeddings.ts all 2000')
    process.exit(1)
  }

  const typesToProcess = entityType === 'all' 
    ? ['product', 'company', 'regulation'] as const
    : [entityType]

  let totalProcessed = 0
  let totalTokens = 0
  const startTime = Date.now()

  for (const type of typesToProcess) {
    console.log(`\n📦 处理 ${type} 类型数据...`)
    const { processed, tokens } = await processEntityType(type, limit)
    totalProcessed += processed
    totalTokens += tokens
  }

  const duration = (Date.now() - startTime) / 1000
  console.log('\n========================================')
  console.log('✅ 处理完成!')
  console.log('========================================')
  console.log(`总处理数量: ${totalProcessed}`)
  console.log(`总Token用量: ${totalTokens.toLocaleString()}`)
  console.log(`耗时: ${duration.toFixed(2)}秒`)
  console.log(`平均速度: ${(totalProcessed / duration).toFixed(2)} 条/秒`)
  console.log('========================================')
}

/**
 * 处理特定类型的实体
 */
async function processEntityType(
  entityType: 'product' | 'company' | 'regulation',
  limit: number
): Promise<{ processed: number; tokens: number }> {
  let processed = 0
  let totalTokens = 0
  let batchNumber = 0

  while (processed < limit) {
    batchNumber++
    const batchSize = Math.min(BATCH_SIZE, limit - processed)
    
    // 获取待处理的实体
    const { data: entities, error } = await supabase
      .rpc('get_entities_without_vectors', {
        p_entity_type: entityType,
        p_limit: batchSize,
      })

    if (error) {
      console.error(`❌ 获取${entityType}数据失败:`, error.message)
      break
    }

    if (!entities || entities.length === 0) {
      console.log(`✅ 没有更多${entityType}数据需要处理`)
      break
    }

    console.log(`\n  批次 ${batchNumber}: 处理 ${entities.length} 条 ${entityType} 数据...`)

    // 生成embeddings
    const texts = entities.map((e: EntityToProcess) => e.content)
    const { embeddings, tokenUsage, failedIndices } = await generateBatchEmbeddings(texts)
    totalTokens += tokenUsage

    // 存储向量
    const records = entities
      .map((entity: EntityToProcess, index: number) => {
        if (failedIndices.includes(index)) {
          console.warn(`  ⚠️ 跳过失败项: ${entity.entity_id}`)
          return null
        }
        return {
          id: `${entityType}_${entity.entity_id}`,
          entity_type: entityType,
          entity_id: entity.entity_id,
          content: entity.content,
          embedding: embeddings[index],
          metadata: {},
        }
      })
      .filter(Boolean)

    if (records.length > 0) {
      const { error: insertError } = await supabase
        .from('vector_embeddings')
        .upsert(records, { onConflict: 'id' })

      if (insertError) {
        console.error(`  ❌ 存储向量失败:`, insertError.message)
      } else {
        console.log(`  ✅ 成功存储 ${records.length} 个向量`)
        processed += records.length
      }
    }

    // 显示进度
    const progress = Math.min((processed / limit) * 100, 100)
    console.log(`  📊 进度: ${processed}/${limit} (${progress.toFixed(1)}%)`)

    // 避免API限流
    if (entities.length === batchSize) {
      await delay(1000)
    }
  }

  return { processed, tokens: totalTokens }
}

/**
 * 批量生成embeddings
 */
async function generateBatchEmbeddings(
  texts: string[],
  retryCount = 0
): Promise<{ embeddings: number[][]; tokenUsage: number; failedIndices: number[] }> {
  const processedTexts = texts.map(preprocessText).filter(t => t && t.length >= 3)

  if (processedTexts.length === 0) {
    return { embeddings: [], tokenUsage: 0, failedIndices: texts.map((_, i) => i) }
  }

  try {
    const response = await fetch(ARK_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: processedTexts,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Ark API error: ${error.error?.message || response.statusText}`)
    }

    const result = await response.json()

    return {
      embeddings: result.data.map((d: { embedding: number[] }) => d.embedding),
      tokenUsage: result.usage?.total_tokens || 0,
      failedIndices: [],
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`  ⚠️ API调用失败，${RETRY_DELAY / 1000}秒后重试...`)
      await delay(RETRY_DELAY * (retryCount + 1))
      return generateBatchEmbeddings(texts, retryCount + 1)
    }

    console.error('  ❌ 批量生成失败，尝试逐个处理...')
    return processEmbeddingsIndividually(texts)
  }
}

/**
 * 逐个处理embeddings（降级策略）
 */
async function processEmbeddingsIndividually(
  texts: string[]
): Promise<{ embeddings: number[][]; tokenUsage: number; failedIndices: number[] }> {
  const embeddings: number[][] = []
  const failedIndices: number[] = []
  let totalTokens = 0

  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await generateSingleEmbedding(texts[i])
      embeddings.push(result.embedding)
      totalTokens += result.tokenUsage
    } catch (error) {
      console.error(`  ❌ 处理第${i}项失败:`, error)
      failedIndices.push(i)
      embeddings.push(new Array(EMBEDDING_DIMENSION).fill(0))
    }

    // 避免API限流
    await delay(200)
  }

  return { embeddings, tokenUsage: totalTokens, failedIndices }
}

/**
 * 生成单个embedding
 */
async function generateSingleEmbedding(
  text: string,
  retryCount = 0
): Promise<EmbeddingResult> {
  const processedText = preprocessText(text)

  try {
    const response = await fetch(ARK_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ARK_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: processedText,
        encoding_format: 'float',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Ark API error: ${error.error?.message || response.statusText}`)
    }

    const result = await response.json()

    return {
      embedding: result.data[0].embedding,
      tokenUsage: result.usage?.total_tokens || 0,
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1))
      return generateSingleEmbedding(text, retryCount + 1)
    }
    throw error
  }
}

/**
 * 文本预处理
 */
function preprocessText(text: string): string {
  if (!text) return ''

  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')
    .trim()
    .slice(0, 8000)
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 运行主函数
main().catch(error => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})

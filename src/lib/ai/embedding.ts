/**
 * Embedding Service - 文本向量生成服务
 * 
 * 功能：
 * 1. 生成文本embedding向量（使用火山方舟大模型）
 * 2. 批量处理优化
 * 3. 缓存机制减少API调用
 * 4. 错误处理和降级策略
 */

import { createClient } from '@/lib/supabase/client'

// 火山方舟 Embedding 配置
const ARK_API_KEY = process.env.VOLCENGINE_ARK_API_KEY
const ARK_EMBEDDING_URL = 'https://ark.cn-beijing.volces.com/api/v3/embeddings'
// 火山方舟支持的embedding模型
const EMBEDDING_MODEL = 'doubao-embedding'  // 或 'doubao-embedding-large'
const EMBEDDING_DIMENSION = 1024  // 火山方舟embedding维度

// 批量处理配置
const BATCH_SIZE = 100
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

export interface EmbeddingResult {
  embedding: number[]
  tokenUsage: number
  model: string
}

export interface BatchEmbeddingResult {
  embeddings: number[][]
  tokenUsage: number
  model: string
  failedIndices: number[]
}

/**
 * 生成单条文本的embedding
 */
export async function generateEmbedding(
  text: string,
  retryCount = 0
): Promise<EmbeddingResult> {
  if (!ARK_API_KEY) {
    throw new Error('VOLCENGINE_ARK_API_KEY not configured')
  }

  // 文本预处理
  const processedText = preprocessText(text)
  
  if (!processedText || processedText.length < 3) {
    throw new Error('Text too short for embedding generation')
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
      model: EMBEDDING_MODEL,
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1))
      return generateEmbedding(text, retryCount + 1)
    }
    throw error
  }
}

/**
 * 批量生成embedding（带错误处理）
 */
export async function generateBatchEmbeddings(
  texts: string[],
  retryCount = 0
): Promise<BatchEmbeddingResult> {
  if (!ARK_API_KEY) {
    throw new Error('VOLCENGINE_ARK_API_KEY not configured')
  }

  // 预处理所有文本
  const processedTexts = texts.map(preprocessText).filter(t => t && t.length >= 3)
  
  if (processedTexts.length === 0) {
    return {
      embeddings: [],
      tokenUsage: 0,
      model: EMBEDDING_MODEL,
      failedIndices: texts.map((_, i) => i),
    }
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
      model: EMBEDDING_MODEL,
      failedIndices: [],
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await delay(RETRY_DELAY * (retryCount + 1))
      return generateBatchEmbeddings(texts, retryCount + 1)
    }
    
    // 批量失败时，尝试逐个处理
    console.warn('Batch embedding failed, falling back to individual processing')
    return processEmbeddingsIndividually(texts)
  }
}

/**
 * 逐个处理embedding（降级策略）
 */
async function processEmbeddingsIndividually(
  texts: string[]
): Promise<BatchEmbeddingResult> {
  const embeddings: number[][] = []
  const failedIndices: number[] = []
  let totalTokens = 0

  for (let i = 0; i < texts.length; i++) {
    try {
      const result = await generateEmbedding(texts[i])
      embeddings.push(result.embedding)
      totalTokens += result.tokenUsage
    } catch (error) {
      console.error(`Failed to generate embedding for text ${i}:`, error)
      failedIndices.push(i)
      embeddings.push(new Array(EMBEDDING_DIMENSION).fill(0))
    }
  }

  return {
    embeddings,
    tokenUsage: totalTokens,
    model: EMBEDDING_MODEL,
    failedIndices,
  }
}

/**
 * 文本预处理
 */
function preprocessText(text: string): string {
  if (!text) return ''
  
  return text
    .replace(/\s+/g, ' ')           // 合并多个空格
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // 保留中英文和数字
    .trim()
    .slice(0, 8000)                 // API限制
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 计算余弦相似度
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same dimensions')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) return 0

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * 获取embedding维度
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION
}

/**
 * 估算token使用量
 */
export function estimateTokens(text: string): number {
  // 粗略估算：英文约1token/字，中文约2tokens/字
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars * 2 + otherChars * 0.25)
}

import crypto from 'crypto'

interface BaiduTranslateResult {
  error_code?: string
  error_msg?: string
  trans_result?: Array<{
    src: string
    dst: string
  }>
}

interface BaiduTranslateResponse {
  error_code?: string
  error_msg?: string
  trans_result?: Array<{
    src: string
    dst: string
  }>
}

export interface TranslateOptions {
  from?: string
  to?: string
}

/**
 * 百度翻译 API 客户端
 * 文档：https://fanyi-api.baidu.com/
 */
export async function baiduTranslate(
  query: string,
  options: TranslateOptions = {}
): Promise<string> {
  const appId = process.env.BAIDU_TRANSLATE_APP_ID
  const secretKey = process.env.BAIDU_TRANSLATE_SECRET_KEY
  const from = options.from || 'en'
  const to = options.to || 'zh'

  if (!appId || !secretKey) {
    throw new Error('百度翻译 API 密钥未配置')
  }

  const salt = Date.now().toString()
  const sign = crypto
    .createHash('md5')
    .update(`${appId}${query}${salt}${secretKey}`)
    .digest('hex')

  try {
    const params = new URLSearchParams({
      q: query,
      from,
      to,
      appid: appId,
      salt,
      sign,
    })

    const response = await fetch(
      'https://fanyi-api.baidu.com/api/translate/v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    )

    if (!response.ok) {
      throw new Error(`百度翻译 API 请求失败：${response.status}`)
    }

    const data: BaiduTranslateResponse = await response.json()

    if (data.error_code) {
      throw new Error(`百度翻译错误：${data.error_msg || data.error_code}`)
    }

    return data.trans_result?.map((item) => item.dst).join('\n') || ''
  } catch (error) {
    console.error('百度翻译失败:', error)
    throw error
  }
}

/**
 * 批量翻译
 */
export async function batchTranslate(
  texts: string[],
  options: TranslateOptions = {}
): Promise<string[]> {
  const results: string[] = []
  
  // 百度翻译限制每次最多翻译 50 条
  const batchSize = 50
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const query = batch.join('\n')
    
    try {
      const result = await baiduTranslate(query, options)
      const translations = result.split('\n')
      results.push(...translations)
    } catch (error) {
      console.error('批量翻译失败:', error)
      // 失败时返回原文
      results.push(...batch)
    }

    // 避免触发 QPS 限制
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
}

/**
 * 翻译缓存 (内存级别)
 */
const translationCache = new Map<string, string>()

export async function cachedTranslate(
  query: string,
  options: TranslateOptions = {}
): Promise<string> {
  const cacheKey = `${options.from || 'en'}:${options.to || 'zh'}:${query}`
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  const result = await baiduTranslate(query, options)
  translationCache.set(cacheKey, result)
  
  return result
}

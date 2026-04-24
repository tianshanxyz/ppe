import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { SafeExcelParser, ExcelRow } from '@/lib/excel-safe'
import { escapeIlikeSearch } from '@/lib/security/sanitize'

export interface BatchQueryRequest {
  type: 'company' | 'product'
  queries: string[]
}

export interface BatchQueryResultItem {
  query: string
  result: Record<string, string | number | boolean | null | undefined> | Array<Record<string, unknown>> | null
  row: number
  error?: string
}

export interface BatchQueryResult {
  jobId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total: number
  processed: number
  success: number
  failed: number
  results?: BatchQueryResultItem[]
  errorFile?: string
  errorMessage?: string
  createdAt: number
}

const jobStore: Record<string, BatchQueryResult> = {}

const JOB_EXPIRY_MS = 24 * 60 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const jobId in jobStore) {
    if (now - jobStore[jobId].createdAt > JOB_EXPIRY_MS) {
      delete jobStore[jobId]
    }
  }
}, 60 * 60 * 1000)

export async function POST(request: Request) {
  try {
    
      const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as 'company' | 'product'

    if (!file || !type) {
      return NextResponse.json(
        { error: 'Missing required parameters: file and type' },
        { status: 400 }
      )
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const result: BatchQueryResult = {
      jobId,
      status: 'pending',
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      createdAt: Date.now(),
    }

    jobStore[jobId] = result

    // 异步处理
    processBatchQuery(jobId, file, type).catch((error) => {
      console.error('Batch query processing error:', error)
      jobStore[jobId].status = 'failed'
      jobStore[jobId].errorMessage = error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({ data: { jobId } })
  } catch (error) {
    console.error('Batch query error:', error)
    return NextResponse.json(
      { error: 'Batch query failed' },
      { status: 500 }
    )
  }
}

const BATCH_SIZE = 10

async function processSingleQuery(
  query: string,
  type: 'company' | 'product',
  supabaseClient: Awaited<ReturnType<typeof createClient>>,
  index: number
): Promise<{ query: string; result: Record<string, string | number | boolean | null | undefined> | any[] | null; row: number; error?: string }> {
  try {
    let queryResult: Record<string, string | number | boolean | null | undefined> | any[] | null = null

    if (type === 'company') {
      const { data: company, error } = await supabaseClient
        .from('companies')
        .select('*')
        .ilike('name', `%${escapeIlikeSearch(query)}%`)
        .limit(1)
        .single()

      if (error || !company) {
        const { data: companies, error: searchError } = await supabaseClient
          .from('companies')
          .select('*')
          .ilike('name', `%${escapeIlikeSearch(query)}%`)
          .limit(5)

        if (!searchError && companies && companies.length > 0) {
          queryResult = companies
        }
      } else {
        queryResult = company
      }
    } else {
      const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .ilike('name', `%${escapeIlikeSearch(query)}%`)
        .limit(1)
        .single()

      if (error || !product) {
        const { data: products, error: searchError } = await supabaseClient
          .from('products')
          .select('*')
          .ilike('name', `%${escapeIlikeSearch(query)}%`)
          .limit(5)

        if (!searchError && products && products.length > 0) {
          queryResult = products
        }
      } else {
        queryResult = product
      }
    }

    if (queryResult) {
      return {
        query,
        result: queryResult,
        row: index + 2,
      }
    } else {
      return { query, result: null, row: index + 2, error: 'Not found' }
    }
  } catch (error) {
    return {
      query,
      result: null,
      row: index + 2,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function processBatchQuery(jobId: string, file: File, type: 'company' | 'product') {
  try {
    // 使用安全的 Excel 解析器替代有漏洞的 xlsx 库
    const { rows: data, headers } = await SafeExcelParser.parseExcel(file)

    if (!data || data.length === 0) {
      jobStore[jobId].status = 'failed'
      jobStore[jobId].errorMessage = '文件为空或未找到数据'
      return
    }

    jobStore[jobId].status = 'processing'
    jobStore[jobId].total = data.length

    const cookieStore2 = cookies()
    const supabaseClient = await createClient()
    const results: BatchQueryResultItem[] = []
    const errors: Array<{ query: string; error: string; row: number }> = []

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
      const batch = data.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map((item, batchIndex) => {
        const query = ((item as ExcelRow).name || 
                     (item as ExcelRow).company_name || 
                     (item as ExcelRow).k_number || 
                     (item as ExcelRow).product_name) as string
        
        if (!query) {
          return Promise.resolve({ query: '', result: null, row: i + batchIndex + 2, error: 'Missing query field' })
        }
        
        return processSingleQuery(query, type, supabaseClient, i + batchIndex)
      })

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        if (result.error) {
          errors.push({ query: result.query, row: result.row, error: result.error })
        } else if (result.result) {
          results.push(result)
          jobStore[jobId].success++
        } else {
          errors.push({ query: result.query, row: result.row, error: 'Not found' })
        }
      })

      jobStore[jobId].processed = Math.min(i + BATCH_SIZE, data.length)
    }

    if (errors.length > 0) {
      // 生成 CSV 格式的错误文件（替代 xlsx）
      const errorCsv = SafeExcelParser.generateCSV(errors, ['query', 'row', 'error'])
      
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('batch-query-results')
        .upload(`${jobId}_errors.csv`, errorCsv)
      
      if (!uploadError) {
        jobStore[jobId].errorFile = uploadData?.path
      }
    }

    jobStore[jobId].status = 'completed'
    jobStore[jobId].results = results
  } catch (error) {
    jobStore[jobId].status = 'failed'
    jobStore[jobId].errorMessage = error instanceof Error ? error.message : 'Unknown error'
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    
      const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { jobId } = await params

    const result = jobStore[jobId]

    if (!result) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Get job status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DOWNLOAD(
  request: NextRequest,
  { params }: { params: Promise<any> }
) {
  try {
    
      const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { jobId } = await params

    const result = jobStore[jobId]

    if (!result) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!result.results || result.results.length === 0) {
      return NextResponse.json(
        { error: 'No results to download' },
        { status: 400 }
      )
    }

    // 生成 CSV 格式的结果文件（替代 xlsx）
    const resultsData = result.results.map(r => ({
      query: r.query,
      ...(r.result as Record<string, any> || {})
    })) as any[]
    
    const resultCsv = SafeExcelParser.generateCSV(resultsData, ['query', ...Object.keys(resultsData[0] || {}).filter(k => k !== 'query')])
    
    const headers = new Headers()
    headers.set('Content-Type', 'text/csv')
    headers.set('Content-Disposition', `attachment; filename="batch_query_${jobId}.csv"`)

    return new Response(resultCsv, { headers })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateSearchQuery, validatePagination, validateEnum, validateArrayParam } from '@/lib/security/sanitize'
import { withRateLimit } from '@/lib/middleware/rateLimit'
import { searchMedplumDevices, searchMedplumOrganizations } from '@/lib/medplum'
import { isMedplumEnabled } from '@/lib/medplum/client'

interface SearchHistoryInput {
  query: string
  filters?: any
  resultsCount?: number
}

export interface SearchFilters {
  market?: string[]
  deviceClass?: string
  productCode?: string
  status?: string
}

export interface CompanySearchResult {
  id: string
  name: string
  legal_name?: string
  registration_number?: string
  country?: string
  created_at: string
  updated_at: string
  data_source?: string
  [key: string]: string | number | boolean | null | undefined
}

export interface SearchResult {
  id: string
  name: string
  company_name: string
  market: string
  device_class: string
  product_code: string
  status: string
  registration_number: string
  created_at: string
  updated_at: string
  data_source?: string
}

/**
 * GET /api/search
 * 搜索产品和公司
 * 
 * Query Parameters:
 * - q: 搜索关键词 (产品名称、公司名称)
 * - type: 搜索类型 'product' | 'company' | 'all' (默认：all)
 * - market: 市场筛选 (可多个，逗号分隔)
 * - deviceClass: 器械类别筛选
 * - limit: 返回数量限制 (默认：20, 最大：100)
 */
export async function GET(request: NextRequest) {
  return withRateLimit(async (request: NextRequest) => {
    try {
      const searchParams = request.nextUrl.searchParams
      const queryParam = searchParams.get('q') || ''
      const typeParam = searchParams.get('type')
      const marketFilter = searchParams.get('market')
      const deviceClass = searchParams.get('deviceClass')
      const limitParam = searchParams.get('limit')

      // 验证搜索查询
      const queryValidation = validateSearchQuery(queryParam)
      if (!queryValidation.valid) {
        return NextResponse.json(
          { error: queryValidation.error },
          { status: 400 }
        )
      }

      // 验证搜索类型
      const typeValidation = validateEnum(typeParam, ['all', 'product', 'company'], 'all')
      if (!typeValidation.valid) {
        return NextResponse.json(
          { error: typeValidation.error },
          { status: 400 }
        )
      }

      // 验证分页参数
      const paginationValidation = validatePagination(undefined, limitParam ?? undefined)
      if (!paginationValidation.valid) {
        return NextResponse.json(
          { error: paginationValidation.error },
          { status: 400 }
        )
      }

      const type = typeValidation.value
      const limit = Math.min(paginationValidation.limit, 100)
      const markets = validateArrayParam(marketFilter ?? undefined)
      const query = queryValidation.sanitized

      const supabase = await createClient()

      const results: {
        products?: SearchResult[]
        companies?: CompanySearchResult[]
      } = {}

      // 搜索产品
      if (type === 'all' || type === 'product') {
        let productQuery = supabase
          .from('all_products')
          .select('*')
          .ilike('product_name', `%${query}%`)
          .limit(limit)

        // 应用市场筛选
        if (markets.length > 0) {
          productQuery = productQuery.in('market', markets)
        }

        // 应用器械类别筛选
        if (deviceClass) {
          productQuery = productQuery.eq('device_class', deviceClass)
        }

        const { data: products, error: productsError } = await productQuery

        if (productsError) {
          console.error('Product search error:', productsError)
          results.products = []
        } else {
          results.products = (products || []).map(p => ({
            id: p.id,
            name: p.product_name,
            company_name: p.company_name,
            market: p.market,
            device_class: p.device_class,
            product_code: p.product_code || '',
            status: p.status || 'active',
            registration_number: p.registration_number || '',
            created_at: p.created_at,
            updated_at: p.last_updated || p.updated_at,
            data_source: 'local'
          }))
        }
      }

      // 搜索公司
      if (type === 'all' || type === 'company') {
        let companyQuery = supabase
          .from('companies')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(limit)

        const { data: companies, error: companiesError } = await companyQuery

        if (companiesError) {
          console.error('Company search error:', companiesError)
          results.companies = []
        } else {
          results.companies = (companies || []).map(c => ({
            id: c.id,
            name: c.name,
            legal_name: c.legal_name,
            registration_number: c.registration_number,
            country: c.country,
            created_at: c.created_at,
            updated_at: c.updated_at,
            data_source: 'local'
          }))
        }
      }

      // 集成 Medplum 数据
      if (isMedplumEnabled()) {
        try {
          // 搜索 Medplum 设备
          if (type === 'all' || type === 'product') {
            const medplumDevices = await searchMedplumDevices({
              query,
              limit: limit / 2,
              market: markets.length > 0 ? markets[0] : undefined
            });
            
            const medplumProductResults = medplumDevices.map(device => ({
              id: `medplum-device-${device.id}`,
              name: device.deviceName?.[0]?.name || device.id,
              company_name: device.manufacturer?.display || 'Unknown Manufacturer',
              market: 'Global',
              device_class: device.type?.[0]?.coding?.[0]?.code || 'Unknown',
              product_code: device.modelNumber || '',
              status: 'active',
              registration_number: device.identifier?.[0]?.value || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              data_source: 'medplum'
            }));
            
            results.products = [...(results.products || []), ...medplumProductResults].slice(0, limit);
          }
          
          // 搜索 Medplum 组织
          if (type === 'all' || type === 'company') {
            const medplumOrganizations = await searchMedplumOrganizations({
              query,
              limit: limit / 2
            });
            
            const medplumCompanyResults = medplumOrganizations.map(org => ({
              id: `medplum-org-${org.id}`,
              name: org.name || org.id,
              legal_name: org.alias?.[0] || '',
              registration_number: org.identifier?.[0]?.value || '',
              country: org.address?.[0]?.country || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              data_source: 'medplum'
            }));
            
            results.companies = [...(results.companies || []), ...medplumCompanyResults].slice(0, limit);
          }
        } catch (error) {
          console.error('Medplum search error:', error);
          // 继续使用本地数据，不影响整体搜索
        }
      }

      // 保存搜索历史记录
      const totalResults = (results.products?.length || 0) + (results.companies?.length || 0)
      await saveSearchHistory(supabase, query, {
        type,
        markets: markets,
        deviceClass,
      }, totalResults)

      return NextResponse.json({
        data: results,
        meta: {
          query,
          type,
          filters: {
            markets: markets,
            deviceClass,
          },
          limit,
          medplumEnabled: isMedplumEnabled()
        },
      })
    } catch (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }
  }, {
    maxRequests: 100,
    windowInSeconds: 60,
    enableAuthBoost: true,
    authBoostMultiplier: 2,
  })(request)
}

/**
 * 保存搜索历史记录
 */
async function saveSearchHistory(
  supabase: any,
  query: string,
  filters: any,
  resultsCount: number
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from('search_queries')
        .insert({
          user_id: user.id,
          query,
          filters,
          results_count: resultsCount,
        })

      if (error) {
        console.error('Save search history error:', error)
      }
    }
  } catch (error) {
    console.error('Save search history exception:', error)
  }
}

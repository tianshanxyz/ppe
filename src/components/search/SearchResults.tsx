'use client'

import { useMemo } from 'react'
import { Card, CardContent, Badge, Button } from '@/components/ui'
import { DataSourceBadge } from '@/components/medplum/DataSourceBadge'
import { LastUpdateTime } from '@/components/data/LastUpdateTime'
import { Building2, Package, Scale, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from './EmptyState'
import { ProductFamilyCard } from './ProductFamilyCard'
import { groupProductsByFamily } from '@/lib/product-family'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface SearchResultItem {
  id: string
  name: string
  company_name?: string
  manufacturer_name?: string
  market?: string
  market_code?: string
  device_class?: string
  product_code?: string
  status?: string
  registration_number?: string
  regulation_number?: string
  country?: string
  country_of_origin?: string
  website?: string
  title?: string
  title_zh?: string
  summary?: string
  summary_zh?: string
  issuing_authority?: string
  document_type?: string
  effective_date?: string
  category_id?: string
  category?: string
  data_source?: string
  created_at?: string
  updated_at?: string
  last_updated_at?: string
  _resultType?: 'product' | 'company' | 'regulation'
  [key: string]: string | number | boolean | null | undefined
}

interface SearchResultsProps {
  results: SearchResultItem[]
  type?: 'all' | 'product' | 'company' | 'regulation'
}

function getResultType(result: SearchResultItem, propType?: string): 'product' | 'company' | 'regulation' {
  if (result._resultType) return result._resultType
  if (propType === 'regulation') return 'regulation'
  if (propType === 'company') return 'company'
  if (propType === 'product') return 'product'
  if (result.regulation_number || result.issuing_authority || result.document_type) return 'regulation'
  if (result.company_name || result.manufacturer_name) return 'product'
  return 'company'
}

function getDetailLink(result: SearchResultItem, resultType: 'product' | 'company' | 'regulation'): string {
  switch (resultType) {
    case 'product':
      return `/products/${result.id}`
    case 'company':
      return `/company/${result.id}`
    case 'regulation':
      return `/regulations/${result.id}`
  }
}

function getTypeIcon(resultType: 'product' | 'company' | 'regulation') {
  switch (resultType) {
    case 'product':
      return Package
    case 'company':
      return Building2
    case 'regulation':
      return Scale
  }
}

function getTypeLabel(resultType: 'product' | 'company' | 'regulation'): string {
  switch (resultType) {
    case 'product':
      return 'Product'
    case 'company':
      return 'Company'
    case 'regulation':
      return 'Regulation'
  }
}

export function SearchResults({ results, type = 'all' }: SearchResultsProps) {
  const locale = useLocale()
  // 分离产品、公司和法规
  const { products, companies, regulations, productFamilies } = useMemo(() => {
    const products: SearchResultItem[] = []
    const companies: SearchResultItem[] = []
    const regulations: SearchResultItem[] = []

    results.forEach(result => {
      const resultType = getResultType(result, type)
      if (resultType === 'product') {
        products.push(result)
      } else if (resultType === 'company') {
        companies.push(result)
      } else {
        regulations.push(result)
      }
    })

    // 将产品聚合成产品家族
    const productFamilies = groupProductsByFamily(products)

    return { products, companies, regulations, productFamilies }
  }, [results, type])

  if (results.length === 0) {
    return (
      <EmptyState 
        type="no-results" 
        message="No results found. Try adjusting your search or filters."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Products section */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">
              Products ({products.length})
            </h3>
          </div>
          <div className="space-y-4">
            {products.map((result) => {
              const resultType = 'product'
              const Icon = getTypeIcon(resultType)
              const detailLink = getDetailLink(result, resultType)
              const typeLabel = getTypeLabel(resultType)

              return (
                <Card key={`product-${result.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <Link 
                            href={detailLink}
                            className="text-xl font-semibold hover:text-primary transition-colors truncate"
                          >
                            {result.name || 'Unknown Product'}
                          </Link>
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex-shrink-0 text-xs">
                            {typeLabel}
                          </Badge>
                        </div>
                        
                        {result.company_name && (
                          <p className="text-sm text-muted-foreground">
                            {locale === 'zh' ? '制造商' : 'Manufacturer'}: {result.company_name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                          {result.market && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {result.market}
                            </Badge>
                          )}
                          {result.device_class && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {result.device_class}
                            </Badge>
                          )}
                          {result.registration_number && (
                            <span className="font-mono text-xs">{result.registration_number}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          {typeof result.data_source === 'string' && result.data_source && (
                            <DataSourceBadge source={result.data_source as any} />
                          )}
                          {result.updated_at && typeof result.updated_at === 'string' && (
                            <LastUpdateTime 
                              timestamp={result.updated_at}
                              showNextUpdate={false}
                            />
                          )}
                        </div>
                      </div>
                      
                      <Link href={detailLink} className="flex-shrink-0 ml-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          More
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Product Family grouping (for products with multiple registrations) */}
      {productFamilies.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">
              Product Families ({productFamilies.length} groups)
            </h3>
            {productFamilies.some(f => f.registrations.length > 1) && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Multi-country registrations grouped
              </Badge>
            )}
          </div>
          <div className="space-y-4">
            {productFamilies.map(family => (
              <ProductFamilyCard key={family.familyId} family={family} />
            ))}
          </div>
        </div>
      )}

      {/* 公司列表 */}
      {companies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500">
            Companies ({companies.length})
          </h3>
          <div className="space-y-4">
            {companies.map((result) => {
              const resultType = 'company'
              const Icon = getTypeIcon(resultType)
              const detailLink = getDetailLink(result, resultType)
              const typeLabel = getTypeLabel(resultType)

              return (
                <Card key={`${resultType}-${result.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <Link 
                            href={detailLink}
                            className="text-xl font-semibold hover:text-primary transition-colors truncate"
                          >
                            {result.name || result.company_name || 'Unknown'}
                          </Link>
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex-shrink-0 text-xs">
                            {typeLabel}
                          </Badge>
                        </div>
                        
                        {result.country && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {result.country}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 pt-2">
                          {typeof result.data_source === 'string' && result.data_source && (
                            <DataSourceBadge source={result.data_source as any} />
                          )}
                          {result.last_updated_at && typeof result.last_updated_at === 'string' && (
                            <LastUpdateTime 
                              timestamp={result.last_updated_at}
                              showNextUpdate={false}
                            />
                          )}
                        </div>
                      </div>
                      
                      <Link href={detailLink} className="flex-shrink-0 ml-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          More
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 法规列表 */}
      {regulations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500">
            Regulations ({regulations.length})
          </h3>
          <div className="space-y-4">
            {regulations.map((result) => {
              const resultType = 'regulation'
              const Icon = getTypeIcon(resultType)
              const detailLink = getDetailLink(result, resultType)
              const typeLabel = getTypeLabel(resultType)

              return (
                <Card key={`${resultType}-${result.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          <Link 
                            href={detailLink}
                            className="text-xl font-semibold hover:text-primary transition-colors truncate"
                          >
                            {result.title || result.name || result.regulation_number || 'Unknown Regulation'}
                          </Link>
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex-shrink-0 text-xs">
                            {typeLabel}
                          </Badge>
                        </div>
                        
                        {result.title_zh && (
                          <p className="text-sm text-muted-foreground">
                            {result.title_zh}
                          </p>
                        )}
                        {result.issuing_authority && (
                          <p className="text-sm text-muted-foreground">
                            Authority: {result.issuing_authority}
                          </p>
                        )}
                        {result.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {result.summary}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {result.regulation_number && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {result.regulation_number}
                            </Badge>
                          )}
                          {result.market_code && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {result.market_code}
                            </Badge>
                          )}
                          {result.document_type && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {result.document_type}
                            </Badge>
                          )}
                          {result.status && (
                            <span>Status: {result.status}</span>
                          )}
                          {result.effective_date && (
                            <span>Effective: {result.effective_date}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          {typeof result.data_source === 'string' && result.data_source && (
                            <DataSourceBadge source={result.data_source as any} />
                          )}
                        </div>
                      </div>
                      
                      <Link href={detailLink} className="flex-shrink-0 ml-4">
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          More
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

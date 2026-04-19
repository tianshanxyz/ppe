'use client'

import { Card, CardContent, CardHeader, Badge, Button, Skeleton } from '@/components/ui'
import { DataSourceBadge } from '@/components/medplum/DataSourceBadge'
import { LastUpdateTime } from '@/components/data/LastUpdateTime'
import { Building2, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from './EmptyState'

interface SearchResultItem {
  id: string
  name: string
  company_name?: string
  market?: string
  device_class?: string
  product_code?: string
  status?: string
  registration_number?: string
  country?: string
  website?: string
  created_at?: string
  updated_at?: string
  [key: string]: string | number | boolean | null | undefined
}

interface SearchResultsProps {
  results: SearchResultItem[]
  type?: 'all' | 'product' | 'company'
}

export function SearchResults({ results, type = 'all' }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <EmptyState 
        type="no-results" 
        message="No results found. Try adjusting your search or filters."
      />
    )
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const isCompany = type === 'company' || !result.company_name
        const linkHref = isCompany ? `/companies/${result.id}` : `/company/${result.id}`
        
        return (
          <Card key={result.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                    <Link 
                      href={linkHref}
                      className="text-xl font-semibold hover:text-primary transition-colors"
                    >
                      {result.name || result.company_name || 'Unknown'}
                    </Link>
                  </div>
                  
                  {result.company_name && !isCompany && (
                    <p className="text-sm text-muted-foreground">
                      Manufacturer: {result.company_name}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                    {result.status && (
                      <span className="flex items-center gap-1">
                        Status: {result.status}
                      </span>
                    )}
                    {result.country && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {result.country}
                      </span>
                    )}
                  </div>
                  
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
                
                <Link href={linkHref}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

'use client'

import { Card, CardContent, Badge, Button } from '@/components/ui'
import { Package, Building2, ArrowRight, Layers } from 'lucide-react'
import Link from 'next/link'
import { MultiCountryRegistrations } from '@/components/product/MultiCountryRegistrations'
import { ProductFamily } from '@/lib/product-family'
import { DataSourceBadge } from '@/components/medplum/DataSourceBadge'

interface ProductFamilyCardProps {
  family: ProductFamily
}

export function ProductFamilyCard({ family }: ProductFamilyCardProps) {
  const hasMultipleRegistrations = family.registrations.length > 1
  const primaryProductId = family.registrations[0]?.id

  // Skip rendering if no valid product ID
  if (!primaryProductId || primaryProductId === 'undefined') {
    return null
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-[#339999]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <Package className="w-5 h-5 text-[#339999] flex-shrink-0" />
              <Link 
                href={`/products/${primaryProductId}`}
                className="text-lg font-semibold hover:text-[#339999] transition-colors truncate"
              >
                {family.name}
              </Link>
              {hasMultipleRegistrations && (
                <Badge 
                  variant="outline" 
                  className="bg-blue-50 text-blue-700 border-blue-200 text-xs flex items-center gap-1"
                >
                  <Layers className="w-3 h-3" />
                  {family.registrations.length} variants
                </Badge>
              )}
            </div>

            {/* Manufacturer */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{family.manufacturer}</span>
            </div>

            {/* Category */}
            {family.category && (
              <Badge variant="outline" className="bg-gray-50">
                {family.category}
              </Badge>
            )}

            {/* Multi-country Registrations */}
            <MultiCountryRegistrations 
              registrations={family.registrations}
              compact={false}
            />

            {/* Data Sources */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {family.authorities.map(authority => (
                <DataSourceBadge 
                  key={authority} 
                  source={authority as any}
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Link 
            href={`/products/${primaryProductId}`}
            className="flex-shrink-0"
          >
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              View
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

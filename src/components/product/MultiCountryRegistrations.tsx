'use client'

import { Badge } from '@/components/ui'
import { Globe, CheckCircle2 } from 'lucide-react'
import { getCountryFlag } from '@/lib/product-family'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/Tooltip"

interface Registration {
  country: string
  authority: string
  registrationNumber: string
  status?: string
}

interface MultiCountryRegistrationsProps {
  registrations: Registration[]
  compact?: boolean
}

export function MultiCountryRegistrations({ 
  registrations, 
  compact = false 
}: MultiCountryRegistrationsProps) {
  if (!registrations || registrations.length === 0) {
    return null
  }

  // 去重并按国家分组
  const byCountry = new Map<string, Registration[]>()
  registrations.forEach(reg => {
    const existing = byCountry.get(reg.country) || []
    existing.push(reg)
    byCountry.set(reg.country, existing)
  })

  const countries = Array.from(byCountry.keys())
  const hasMultipleCountries = countries.length > 1

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {countries.length} {countries.length === 1 ? 'country' : 'countries'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium text-xs">Registered in:</p>
              {countries.map(country => (
                <div key={country} className="flex items-center gap-2 text-xs">
                  <span>{getCountryFlag(country)}</span>
                  <span className="font-medium">{country}</span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-[#339999]" />
        <span className="text-sm font-medium text-gray-700">
          Global Registrations ({countries.length} {countries.length === 1 ? 'country' : 'countries'})
        </span>
        {hasMultipleCountries && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Multi-market
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {countries.map(country => {
          const regs = byCountry.get(country) || []
          return (
            <TooltipProvider key={country}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="mr-1">{getCountryFlag(country)}</span>
                    <span className="text-xs">{country}</span>
                    {regs.length > 1 && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({regs.length})
                      </span>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <div className="space-y-1.5">
                    <p className="font-medium text-xs border-b pb-1">
                      {getCountryFlag(country)} {country} Registrations
                    </p>
                    {regs.map((reg, idx) => (
                      <div key={idx} className="text-xs space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Authority:</span>
                          <span className="font-medium">{reg.authority}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Number:</span>
                          <span className="font-mono">{reg.registrationNumber}</span>
                        </div>
                        {reg.status && (
                          <div className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge 
                              variant={reg.status === 'Active' ? 'success' : 'secondary'}
                              className="text-[10px] h-4"
                            >
                              {reg.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </div>
  )
}

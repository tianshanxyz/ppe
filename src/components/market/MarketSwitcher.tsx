'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Market {
  id: string
  name: string
  region: string
  flag: string
  regulator: string
  data_source: string
  record_count: number
  is_active: boolean
}

const markets: Market[] = [
  {
    id: 'us',
    name: 'United States',
    region: 'North America',
    flag: '🇺🇸',
    regulator: 'FDA',
    data_source: 'fda',
    record_count: 0,
    is_active: true
  },
  {
    id: 'eu',
    name: 'European Union',
    region: 'Europe',
    flag: '🇪🇺',
    regulator: 'EUDAMED',
    data_source: 'eudamed',
    record_count: 43798,
    is_active: true
  },
  {
    id: 'cn',
    name: 'China',
    region: 'Asia',
    flag: '🇨🇳',
    regulator: 'NMPA',
    data_source: 'nmpa',
    record_count: 0,
    is_active: false
  },
  {
    id: 'jp',
    name: 'Japan',
    region: 'Asia',
    flag: '🇯🇵',
    regulator: 'PMDA',
    data_source: 'pmda',
    record_count: 0,
    is_active: false
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    region: 'Europe',
    flag: '🇬🇧',
    regulator: 'MHRA',
    data_source: 'mhra',
    record_count: 0,
    is_active: false
  },
  {
    id: 'au',
    name: 'Australia',
    region: 'Oceania',
    flag: '🇦🇺',
    regulator: 'TGA',
    data_source: 'tga',
    record_count: 0,
    is_active: false
  }
]

interface MarketContextType {
  currentMarket: Market
  setMarket: (market: Market) => void
  markets: Market[]
}

const MarketContext = createContext<MarketContextType>({
  currentMarket: markets[0],
  setMarket: () => {},
  markets
})

export function useMarket() {
  return useContext(MarketContext)
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [currentMarket, setCurrentMarket] = useState<Market>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mdlooker_market')
      if (saved) {
        const parsed = JSON.parse(saved)
        return markets.find(m => m.id === parsed.id) || markets[0]
      }
    }
    return markets[0]
  })

  const setMarket = (market: Market) => {
    setCurrentMarket(market)
    if (typeof window !== 'undefined') {
      localStorage.setItem('mdlooker_market', JSON.stringify(market))
    }
  }

  return (
    <MarketContext.Provider value={{ currentMarket, setMarket, markets }}>
      {children}
    </MarketContext.Provider>
  )
}

export function MarketSwitcher() {
  const { currentMarket, setMarket, markets: allMarkets } = useMarket()
  const [isOpen, setIsOpen] = useState(false)

  const activeMarkets = allMarkets.filter(m => m.is_active)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Globe className="w-4 h-4 text-gray-500" />
        <span className="text-lg">{currentMarket.flag}</span>
        <span className="text-sm font-medium text-gray-700">{currentMarket.regulator}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Select Market</h3>
                <p className="text-xs text-gray-500 mt-0.5">Switch regulatory database</p>
              </div>

              <div className="py-1">
                {allMarkets.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => {
                      if (market.is_active) {
                        setMarket(market)
                        setIsOpen(false)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      market.is_active ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                    } ${currentMarket.id === market.id ? 'bg-primary-50' : ''}`}
                    disabled={!market.is_active}
                  >
                    <span className="text-xl">{market.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{market.name}</span>
                        <span className="text-xs text-gray-500">({market.regulator})</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {market.is_active ? (
                          <span className="text-xs text-gray-500">
                            {market.record_count.toLocaleString()} records
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600">Coming soon</span>
                        )}
                      </div>
                    </div>
                    {currentMarket.id === market.id && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  More markets coming soon. Data coverage may vary by region.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

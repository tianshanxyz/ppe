'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, ChevronDown, Info, AlertCircle, CheckCircle, LucideIcon } from 'lucide-react'

interface ClassificationResult {
  code: string
  name: string
  regulation: string
  class: string
  panel: string
  definition: string
  predicateDevices: string[]
}

const fdaProductCodes: ClassificationResult[] = [
  {
    code: 'DXN',
    name: 'Device, Blood Glucose Test',
    regulation: '862.1345',
    class: 'Class II',
    panel: 'Clinical Chemistry',
    definition: 'A device used to measure glucose in blood.',
    predicateDevices: ['K123456', 'K789012']
  },
  {
    code: 'FRN',
    name: 'Stent, Coronary',
    regulation: '870.3470',
    class: 'Class III',
    panel: 'Cardiovascular',
    definition: 'A device used to maintain vessel patency.',
    predicateDevices: ['P123456', 'P789012']
  },
  {
    code: 'KRA',
    name: 'System, Imaging, X-ray',
    regulation: '892.1680',
    class: 'Class II',
    panel: 'Radiology',
    definition: 'A diagnostic imaging device using X-rays.',
    predicateDevices: ['K234567']
  }
]

export default function ClassificationPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClassificationResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMarket, setSelectedMarket] = useState<'fda' | 'eu' | 'all'>('all')

  const handleSearch = () => {
    setIsSearching(true)
    // Simulate search
    setTimeout(() => {
      const filtered = fdaProductCodes.filter(
        item => 
          item.code.toLowerCase().includes(query.toLowerCase()) ||
          item.name.toLowerCase().includes(query.toLowerCase())
      )
      setResults(filtered)
      setIsSearching(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Device Classification Lookup</h1>
          <p className="mt-2 text-gray-600">Search FDA product codes and EU device classifications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Code or Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter product code (e.g., DXN) or device name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Markets</option>
                <option value="fda">FDA (US)</option>
                <option value="eu">EU (EUDAMED)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-900">Results ({results.length})</h2>
            {results.map((result) => (
              <div key={result.code} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 font-mono font-medium rounded">
                        {result.code}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">{result.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                      <span>Regulation: {result.regulation}</span>
                      <span>Panel: {result.panel}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.class === 'Class III' 
                      ? 'bg-red-100 text-red-700' 
                      : result.class === 'Class II'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {result.class}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Definition</h4>
                  <p className="text-gray-600 text-sm">{result.definition}</p>
                </div>

                {result.predicateDevices.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Predicate Devices</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.predicateDevices.map((device) => (
                        <span key={device} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {device}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Info Cards */}
        {results.length === 0 && !isSearching && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard
              icon={Info}
              title="FDA Product Codes"
              description="Search by 3-letter product codes or device names to find classification information."
            />
            <InfoCard
              icon={CheckCircle}
              title="Device Classes"
              description="Understand Class I, II, III requirements and regulatory pathways for each device type."
            />
            <InfoCard
              icon={AlertCircle}
              title="Predicate Devices"
              description="Find suitable predicate devices for 510(k) submissions and compare specifications."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-primary-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

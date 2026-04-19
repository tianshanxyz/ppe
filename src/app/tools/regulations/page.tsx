'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, ExternalLink, Download, Search, Filter } from 'lucide-react'

interface RegulationFile {
  id: string
  title: string
  description: string
  market: string
  type: string
  url: string
  fileSize: string
  updatedAt: string
}

const regulations: RegulationFile[] = [
  {
    id: '1',
    title: '21 CFR Part 820 - Quality System Regulation',
    description: 'FDA quality system regulation for medical devices including design controls, production controls, and corrective actions.',
    market: 'US',
    type: 'PDF',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfcfr/cfrsearch.cfm?cfrpart=820',
    fileSize: '2.4 MB',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    title: 'MDR 2017/745 - Medical Device Regulation (EU)',
    description: 'European Union Medical Device Regulation governing the production and distribution of medical devices in Europe.',
    market: 'EU',
    type: 'PDF',
    url: 'https://eur-lex.europa.eu/eli/reg/2017/745',
    fileSize: '4.1 MB',
    updatedAt: '2024-02-01'
  },
  {
    id: '3',
    title: 'FDA Guidance - 510(k) Submissions',
    description: 'Guidance for industry and FDA staff on premarket notification (510(k)) submissions.',
    market: 'US',
    type: 'PDF',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/510k-submissions',
    fileSize: '1.8 MB',
    updatedAt: '2024-01-20'
  },
  {
    id: '4',
    title: 'IVDR 2017/746 - In Vitro Diagnostic Regulation',
    description: 'European regulation on in vitro diagnostic medical devices.',
    market: 'EU',
    type: 'PDF',
    url: 'https://eur-lex.europa.eu/eli/reg/2017/746',
    fileSize: '3.2 MB',
    updatedAt: '2024-02-01'
  },
  {
    id: '5',
    title: 'FDA Guidance - Cybersecurity in Medical Devices',
    description: 'Cybersecurity in medical devices: Quality system considerations and content of premarket submissions.',
    market: 'US',
    type: 'PDF',
    url: 'https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions',
    fileSize: '1.2 MB',
    updatedAt: '2023-12-10'
  }
]

export default function RegulationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  const filteredRegulations = regulations.filter(reg => {
    const matchesSearch = 
      reg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMarket = selectedMarket === 'all' || reg.market === selectedMarket
    const matchesType = selectedType === 'all' || reg.type === selectedType
    return matchesSearch && matchesMarket && matchesType
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Regulatory Documents</h1>
          <p className="mt-2 text-gray-600">Access official regulations, guidance documents, and compliance resources</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search regulations and guidance..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Markets</option>
                <option value="US">United States (FDA)</option>
                <option value="EU">European Union</option>
              </select>
            </div>
            <div className="md:w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Types</option>
                <option value="PDF">PDF Document</option>
                <option value="HTML">Web Page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Documents ({filteredRegulations.length})
            </h2>
          </div>

          {filteredRegulations.map((reg) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      reg.market === 'US' 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {reg.market}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {reg.type}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{reg.title}</h3>
                  <p className="text-gray-600 mt-2 text-sm">{reg.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span>Updated: {reg.updatedAt}</span>
                    <span>Size: {reg.fileSize}</span>
                  </div>
                </div>
                <a
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  View
                </a>
              </div>
            </motion.div>
          ))}

          {filteredRegulations.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

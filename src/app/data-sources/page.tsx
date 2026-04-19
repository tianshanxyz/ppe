import { Metadata } from 'next'
import { CheckCircle, Clock, AlertCircle, Database, ExternalLink } from 'lucide-react'
import { DataSourceList } from '@/components/data/DataSourceList'

export const metadata: Metadata = {
  title: 'Data Sources - MDLooker Medical Device Database',
  description: 'Learn about our data sources including FDA, EUDAMED, NMPA, and other global medical device regulatory databases. Transparent data collection practices.',
  alternates: {
    canonical: '/data-sources'
  }
}

const dataSources = [
  {
    id: 'fda-510k',
    name: 'FDA 510(k) Premarket Notification',
    description: 'FDA database for premarket notifications (510(k)) for medical devices. Contains device clearances, product codes, and company information.',
    country: 'United States',
    flag: '🇺🇸',
    regulator: 'FDA',
    status: 'active',
    recordCount: 'Available',
    updateFrequency: 'Daily',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm',
    apiEndpoint: 'https://api.fda.gov/device/510k.json'
  },
  {
    id: 'fda-pma',
    name: 'FDA PMA Database',
    description: 'Premarket Approval database for Class III medical devices requiring FDA approval before marketing.',
    country: 'United States',
    flag: '🇺🇸',
    regulator: 'FDA',
    status: 'active',
    recordCount: 'Available',
    updateFrequency: 'Daily',
    url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpma/pma.cfm',
    apiEndpoint: 'https://api.fda.gov/device/pma.json'
  },
  {
    id: 'eudamed',
    name: 'EUDAMED',
    description: 'European Database on Medical Devices. Contains device registrations, UDI data, and manufacturer information for EU market.',
    country: 'European Union',
    flag: '🇪🇺',
    regulator: 'European Commission',
    status: 'active',
    recordCount: '43,798',
    updateFrequency: 'Weekly',
    url: 'https://ec.europa.eu/tools/eudamed',
    apiEndpoint: 'Internal Database'
  },
  {
    id: 'nmpa',
    name: 'NMPA (China)',
    description: 'National Medical Products Administration database for medical device registrations in China.',
    country: 'China',
    flag: '🇨🇳',
    regulator: 'NMPA',
    status: 'planned',
    recordCount: '-',
    updateFrequency: '-',
    url: 'https://www.nmpa.gov.cn/',
    apiEndpoint: 'Planned'
  },
  {
    id: 'pmda',
    name: 'PMDA (Japan)',
    description: 'Pharmaceuticals and Medical Devices Agency database for medical device approvals in Japan.',
    country: 'Japan',
    flag: '🇯🇵',
    regulator: 'PMDA',
    status: 'planned',
    recordCount: '-',
    updateFrequency: '-',
    url: 'https://www.pmda.go.jp/',
    apiEndpoint: 'Planned'
  },
  {
    id: 'mhra',
    name: 'MHRA (UK)',
    description: 'Medicines and Healthcare products Regulatory Agency database for UK medical device registrations.',
    country: 'United Kingdom',
    flag: '🇬🇧',
    regulator: 'MHRA',
    status: 'planned',
    recordCount: '-',
    updateFrequency: '-',
    url: 'https://www.gov.uk/government/organisations/medicines-and-healthcare-products-regulatory-agency',
    apiEndpoint: 'Planned'
  }
]

export default function DataSourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
          <p className="mt-2 text-gray-600">
            Transparent information about our data sources and collection practices
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-primary-900 mb-2">Data Collection Policy</h2>
          <p className="text-primary-700">
            MDLooker aggregates data from official regulatory databases worldwide. All data is sourced 
            directly from regulatory authorities through official APIs or public databases. We maintain 
            transparent practices and provide clear attribution for all data sources.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-primary-600">43K+</p>
            <p className="text-sm text-gray-600 mt-1">Total Records</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-primary-600">6</p>
            <p className="text-sm text-gray-600 mt-1">Data Sources</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-primary-600">3</p>
            <p className="text-sm text-gray-600 mt-1">Active Markets</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <p className="text-3xl font-bold text-primary-600">Daily</p>
            <p className="text-sm text-gray-600 mt-1">Update Frequency</p>
          </div>
        </div>

        {/* Data Sources List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Available Data Sources</h2>
          {dataSources.map((source) => (
            <div key={source.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{source.flag}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                    <StatusBadge status={source.status} />
                  </div>
                  <p className="text-gray-600 mb-4">{source.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Regulator:</span>
                      <p className="font-medium text-gray-900">{source.regulator}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Records:</span>
                      <p className="font-medium text-gray-900">{source.recordCount}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Updates:</span>
                      <p className="font-medium text-gray-900">{source.updateFrequency}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">API:</span>
                      <p className="font-medium text-gray-900">{source.apiEndpoint}</p>
                    </div>
                  </div>
                </div>
                
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Data Quality */}
        <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Quality & Validation</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">All data is sourced directly from official regulatory databases</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Automated daily synchronization ensures data freshness</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Data validation checks identify and flag inconsistencies</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">Clear attribution and source links for all records</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    active: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Active' },
    planned: { icon: Clock, color: 'bg-amber-100 text-amber-700', label: 'Planned' },
    maintenance: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Maintenance' }
  }
  
  const { icon: Icon, color, label } = config[status as keyof typeof config] || config.planned
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

import { Metadata } from 'next'
import { Database, Shield, Globe, Zap, Users, Lock, LucideIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About MDLooker - Global Medical Device Regulatory Database',
  description: 'Learn about MDLooker, the comprehensive medical device regulatory database covering FDA, EUDAMED, NMPA, and global regulatory authorities.',
  alternates: {
    canonical: '/about'
  }
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900">About MDLooker</h1>
          <p className="mt-4 text-xl text-gray-600">
            Empowering medical device professionals with comprehensive regulatory intelligence
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            MDLooker is dedicated to democratizing access to medical device regulatory information. 
            We aggregate data from FDA, EUDAMED, NMPA, and other global regulatory databases to provide 
            a unified platform for medical device manufacturers, regulatory consultants, healthcare 
            professionals, and researchers.
          </p>
        </section>

        {/* Features Grid */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              icon={Database}
              title="Comprehensive Database"
              description="Access 43,000+ medical device registrations from FDA, EUDAMED, and global regulatory authorities."
            />
            <FeatureCard
              icon={Shield}
              title="Regulatory Compliance"
              description="Stay compliant with up-to-date regulatory information, guidance documents, and classification tools."
            />
            <FeatureCard
              icon={Globe}
              title="Global Coverage"
              description="Multi-market data from US, EU, China, Japan, and other major regulatory jurisdictions."
            />
            <FeatureCard
              icon={Zap}
              title="Real-time Updates"
              description="Daily data synchronization ensures you always have the latest regulatory information."
            />
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sources</h2>
          <p className="text-gray-600 mb-6">
            MDLooker aggregates data from official regulatory databases worldwide. All data is 
            sourced directly from regulatory authorities and updated regularly to ensure accuracy.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇺🇸</span>
                <span className="font-medium text-gray-900">FDA (US)</span>
                <span className="text-gray-500">- 510(k), PMA, and device listings</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇪🇺</span>
                <span className="font-medium text-gray-900">EUDAMED (EU)</span>
                <span className="text-gray-500">- 43,798+ device registrations</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇨🇳</span>
                <span className="font-medium text-gray-900">NMPA (China)</span>
                <span className="text-gray-500">- Coming soon</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">🇯🇵</span>
                <span className="font-medium text-gray-900">PMDA (Japan)</span>
                <span className="text-gray-500">- Coming soon</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ValueCard
              icon={Users}
              title="Accessibility"
              description="Making regulatory data accessible to everyone, from startups to enterprise."
            />
            <ValueCard
              icon={Lock}
              title="Transparency"
              description="Clear data provenance and open information about our data collection practices."
            />
            <ValueCard
              icon={Shield}
              title="Accuracy"
              description="Rigorous data validation and regular updates to ensure information reliability."
            />
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
          <p className="text-gray-600 mb-4">
            Have questions or feedback? We&apos;d love to hear from you.
          </p>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-gray-700">
              <span className="font-medium">Email:</span>{' '}
              <a href="mailto:support@mdlooker.com" className="text-primary-600 hover:text-primary-700">
                support@mdlooker.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
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

function ValueCard({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-gray-600" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}

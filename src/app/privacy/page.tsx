export const metadata = {
  title: 'Privacy Policy - MDLooker',
  description: 'MDLooker Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last Updated: March 24, 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600">
                MDLooker (&quot;we&quot;, &quot;our&quot;, or &quot;this platform&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information Collection</h2>
              <p className="text-gray-600 mb-4">We may collect the following information:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Account Information: Email address, name</li>
                <li>Usage Data: Search history, access records</li>
                <li>Device Information: IP address, browser type</li>
                <li>Payment Information (paid users only)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Information Use</h2>
              <p className="text-gray-600 mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide and maintain services</li>
                <li>Improve user experience</li>
                <li>Send service notifications</li>
                <li>Prevent fraud and abuse</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-600">
                We employ industry-standard security measures to protect your data, including encrypted transmission, access controls, and security audits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-600 mb-4">Under GDPR and other regulations, you have the following rights:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your data (right to be forgotten)</li>
                <li>Export your data</li>
                <li>Object to data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Contact Us</h2>
              <p className="text-gray-600">
                For privacy-related questions, please contact: privacy@mdlooker.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

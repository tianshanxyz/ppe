export const metadata = {
  title: 'Terms of Service - MDLooker',
  description: 'MDLooker Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last Updated: March 24, 2026
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By using MDLooker services, you agree to these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="text-gray-600">
                MDLooker provides global medical device regulatory information query services, including search and report generation for FDA, NMPA, EUDAMED, and other databases.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <p className="text-gray-600 mb-4">You agree to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide true and accurate registration information</li>
                <li>Protect your account password security</li>
                <li>Not abuse or attack our services</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Disclaimer</h2>
              <p className="text-gray-600">
                We strive to ensure data accuracy but do not guarantee complete accuracy of information. Users should verify critical information independently. We are not responsible for any losses caused by using information from this platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-600">
                All content, trademarks, and code on this platform are protected by intellectual property rights. Unauthorized copying, modification, or distribution is prohibited.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Service Changes</h2>
              <p className="text-gray-600">
                We reserve the right to modify or terminate services at any time without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-600">
                For questions, please contact: contact@mdlooker.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

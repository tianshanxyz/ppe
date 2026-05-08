'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'

export default function TermsPage() {
  const locale = useLocale()

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{locale === 'zh' ? '服务条款' : 'Terms of Service'}</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              {locale === 'zh' ? '最后更新：2026年3月24日' : 'Last Updated: March 24, 2026'}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '1. 条款接受' : '1. Acceptance of Terms'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? '使用MDLooker服务即表示您同意本服务条款。如果您不同意这些条款，请不要使用我们的服务。'
                  : 'By using MDLooker services, you agree to these Terms of Service. If you do not agree to these terms, please do not use our services.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '2. 服务说明' : '2. Service Description'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? 'MDLooker提供全球医疗器械法规信息查询服务，包括FDA、NMPA、EUDAMED等数据库的搜索和报告生成。'
                  : 'MDLooker provides global medical device regulatory information query services, including search and report generation for FDA, NMPA, EUDAMED, and other databases.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '3. 用户责任' : '3. User Responsibilities'}</h2>
              <p className="text-gray-600 mb-4">{locale === 'zh' ? '您同意：' : 'You agree to:'}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{locale === 'zh' ? '提供真实准确的注册信息' : 'Provide true and accurate registration information'}</li>
                <li>{locale === 'zh' ? '保护您的账户密码安全' : 'Protect your account password security'}</li>
                <li>{locale === 'zh' ? '不滥用或攻击我们的服务' : 'Not abuse or attack our services'}</li>
                <li>{locale === 'zh' ? '遵守所有适用的法律法规' : 'Comply with all applicable laws and regulations'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '4. 免责声明' : '4. Disclaimer'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? '我们努力确保数据准确性，但不保证信息的完全准确。用户应独立核实关键信息。我们对因使用本平台信息而造成的任何损失不承担责任。'
                  : 'We strive to ensure data accuracy but do not guarantee complete accuracy of information. Users should verify critical information independently. We are not responsible for any losses caused by using information from this platform.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '5. 知识产权' : '5. Intellectual Property'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? '本平台上的所有内容、商标和代码均受知识产权保护。未经授权禁止复制、修改或分发。'
                  : 'All content, trademarks, and code on this platform are protected by intellectual property rights. Unauthorized copying, modification, or distribution is prohibited.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '6. 服务变更' : '6. Service Changes'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? '我们保留随时修改或终止服务的权利，恕不另行通知。'
                  : 'We reserve the right to modify or terminate services at any time without prior notice.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '7. 联系我们' : '7. Contact Us'}</h2>
              <p className="text-gray-600">
                {locale === 'zh' ? '如有问题，请联系：contact@mdlooker.com' : 'For questions, please contact: contact@mdlooker.com'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useLocale } from '@/lib/i18n/LocaleProvider'

export default function PrivacyPage() {
  const locale = useLocale()

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">{locale === 'zh' ? '隐私政策' : 'Privacy Policy'}</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              {locale === 'zh' ? '最后更新：2026年3月24日' : 'Last Updated: March 24, 2026'}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '1. 简介' : '1. Introduction'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? 'MDLooker（"我们"、"我们的"或"本平台"）致力于保护您的隐私。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。'
                  : 'MDLooker ("we", "our", or "this platform") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '2. 信息收集' : '2. Information Collection'}</h2>
              <p className="text-gray-600 mb-4">{locale === 'zh' ? '我们可能收集以下信息：' : 'We may collect the following information:'}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{locale === 'zh' ? '账户信息：邮箱地址、姓名' : 'Account Information: Email address, name'}</li>
                <li>{locale === 'zh' ? '使用数据：搜索历史、访问记录' : 'Usage Data: Search history, access records'}</li>
                <li>{locale === 'zh' ? '设备信息：IP地址、浏览器类型' : 'Device Information: IP address, browser type'}</li>
                <li>{locale === 'zh' ? '支付信息（仅付费用户）' : 'Payment Information (paid users only)'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '3. 信息使用' : '3. Information Use'}</h2>
              <p className="text-gray-600 mb-4">{locale === 'zh' ? '我们使用您的信息用于：' : 'We use your information to:'}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{locale === 'zh' ? '提供和维护服务' : 'Provide and maintain services'}</li>
                <li>{locale === 'zh' ? '改善用户体验' : 'Improve user experience'}</li>
                <li>{locale === 'zh' ? '发送服务通知' : 'Send service notifications'}</li>
                <li>{locale === 'zh' ? '防止欺诈和滥用' : 'Prevent fraud and abuse'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '4. 数据安全' : '4. Data Security'}</h2>
              <p className="text-gray-600">
                {locale === 'zh'
                  ? '我们采用行业标准的安全措施保护您的数据，包括加密传输、访问控制和安全审计。'
                  : 'We employ industry-standard security measures to protect your data, including encrypted transmission, access controls, and security audits.'}
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '5. 您的权利' : '5. Your Rights'}</h2>
              <p className="text-gray-600 mb-4">{locale === 'zh' ? '根据GDPR等法规，您享有以下权利：' : 'Under GDPR and other regulations, you have the following rights:'}</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>{locale === 'zh' ? '访问您的个人数据' : 'Access your personal data'}</li>
                <li>{locale === 'zh' ? '更正不准确的数据' : 'Correct inaccurate data'}</li>
                <li>{locale === 'zh' ? '删除您的数据（被遗忘权）' : 'Delete your data (right to be forgotten)'}</li>
                <li>{locale === 'zh' ? '导出您的数据' : 'Export your data'}</li>
                <li>{locale === 'zh' ? '反对数据处理' : 'Object to data processing'}</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{locale === 'zh' ? '6. 联系我们' : '6. Contact Us'}</h2>
              <p className="text-gray-600">
                {locale === 'zh' ? '如有隐私相关问题，请联系：privacy@mdlooker.com' : 'For privacy-related questions, please contact: privacy@mdlooker.com'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

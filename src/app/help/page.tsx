'use client';

import React, { useState } from 'react';
import { Card, Input } from '@/components/ui';
import { Search, ChevronDown, ChevronUp, BookOpen, MessageCircle, Mail } from 'lucide-react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

const faqs = {
  en: [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'What is MDLooker?',
          a: 'MDLooker is a global medical device compliance information platform, providing medical device registration information query services for major markets including FDA, NMPA, and EUDAMED.'
        },
        {
          q: 'How do I get started?',
          a: 'You can directly enter a company name, product name, or registration number in the search box on the homepage to search. No registration is required to view basic information. More advanced features are available after registration.'
        },
        {
          q: 'Which markets are supported?',
          a: 'Currently supports 5 major markets: US FDA, China NMPA, EU EUDAMED, Japan PMDA, and Health Canada.'
        }
      ]
    },
    {
      category: 'Search Features',
      questions: [
        {
          q: 'How to perform advanced search?',
          a: 'On the search page, you can use filters to precisely filter by market, product type, registration status, and other conditions. Multi-keyword combined search is supported.'
        },
        {
          q: 'What information is included in search results?',
          a: 'Search results include company information, product information, registration certificate information, registration date, product classification, and other detailed data. Click on the company name to view complete details.'
        },
        {
          q: 'Can I export search data?',
          a: 'Yes, registered users can export search results to CSV or Excel format for offline analysis and report creation.'
        }
      ]
    },
    {
      category: 'AI Reports',
      questions: [
        {
          q: 'What does the AI report include?',
          a: 'AI reports are based on big data analysis, including market access analysis, competitor analysis, risk assessment, regulatory summaries, and other professional content, supporting bilingual English and Chinese.'
        },
        {
          q: 'How long does report generation take?',
          a: 'Usually takes 3-5 minutes. Complex reports may take longer; you can check the results later in My Reports.'
        },
        {
          q: 'Can reports be downloaded?',
          a: 'Yes, generated reports support Markdown and PDF format downloads for your convenience to save and share.'
        }
      ]
    },
    {
      category: 'API Services',
      questions: [
        {
          q: 'How do I get an API key?',
          a: 'After logging in, go to the API Keys management page in the user center and click "Create New Key" to generate. Each account can create up to 5 keys.'
        },
        {
          q: 'Are there limits on API calls?',
          a: 'Free users are limited to 100 calls per minute; paid users enjoy higher quotas based on their plan. You will receive a 429 error response if you exceed the limit.'
        },
        {
          q: 'What data formats does the API support?',
          a: 'The API returns standard JSON format, supporting pagination, sorting, and filter parameters. Please refer to the API documentation page for detailed documentation.'
        }
      ]
    },
    {
      category: 'Account',
      questions: [
        {
          q: 'How do I modify account information?',
          a: 'After logging in, go to the Account Settings page in the user center to modify name, email, password, and other information.'
        },
        {
          q: 'What if I forget my password?',
          a: 'Click the "Forgot Password" link on the login page, enter your registered email, and we will send a password reset link to your email.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes. Please contact customer service to request account deletion. We will process your request within 7 working days and delete all personal data.'
        }
      ]
    }
  ],
  zh: [
    {
      category: '入门指南',
      questions: [
        {
          q: 'MDLooker是什么？',
          a: 'MDLooker是一个全球医疗器械合规信息平台，为FDA、NMPA、EUDAMED等主要市场提供医疗器械注册信息查询服务。'
        },
        {
          q: '如何开始使用？',
          a: '您可以在首页搜索框中直接输入公司名称、产品名称或注册号进行搜索。无需注册即可查看基本信息。注册后可使用更多高级功能。'
        },
        {
          q: '支持哪些市场？',
          a: '目前支持5大市场：美国FDA、中国NMPA、欧盟EUDAMED、日本PMDA和加拿大Health Canada。'
        }
      ]
    },
    {
      category: '搜索功能',
      questions: [
        {
          q: '如何进行高级搜索？',
          a: '在搜索页面，您可以使用筛选器按市场、产品类型、注册状态等条件精确筛选。支持多关键词组合搜索。'
        },
        {
          q: '搜索结果包含哪些信息？',
          a: '搜索结果包括公司信息、产品信息、注册证信息、注册日期、产品分类等详细数据。点击公司名称可查看完整详情。'
        },
        {
          q: '可以导出搜索数据吗？',
          a: '是的，注册用户可以将搜索结果导出为CSV或Excel格式，方便离线分析和报告制作。'
        }
      ]
    },
    {
      category: 'AI报告',
      questions: [
        {
          q: 'AI报告包含什么内容？',
          a: 'AI报告基于大数据分析，包括市场准入分析、竞争对手分析、风险评估、法规摘要等专业内容，支持中英双语。'
        },
        {
          q: '报告生成需要多长时间？',
          a: '通常需要3-5分钟。复杂报告可能需要更长时间，您可以在"我的报告"中稍后查看结果。'
        },
        {
          q: '报告可以下载吗？',
          a: '是的，生成的报告支持Markdown和PDF格式下载，方便您保存和分享。'
        }
      ]
    },
    {
      category: 'API服务',
      questions: [
        {
          q: '如何获取API密钥？',
          a: '登录后，前往用户中心的API密钥管理页面，点击"创建新密钥"即可生成。每个账户最多可创建5个密钥。'
        },
        {
          q: 'API调用有限制吗？',
          a: '免费用户每分钟限制100次调用；付费用户根据套餐享有更高额度。超出限制将收到429错误响应。'
        },
        {
          q: 'API支持哪些数据格式？',
          a: 'API返回标准JSON格式，支持分页、排序和筛选参数。详细文档请参阅API文档页面。'
        }
      ]
    },
    {
      category: '账户',
      questions: [
        {
          q: '如何修改账户信息？',
          a: '登录后，前往用户中心的账户设置页面，可修改姓名、邮箱、密码等信息。'
        },
        {
          q: '忘记密码怎么办？',
          a: '在登录页面点击"忘记密码"链接，输入注册邮箱，我们将发送密码重置链接到您的邮箱。'
        },
        {
          q: '可以删除账户吗？',
          a: '是的。请联系客服申请删除账户，我们将在7个工作日内处理您的请求并删除所有个人数据。'
        }
      ]
    }
  ]
};

export default function HelpPage() {
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    const newOpen = new Set(openItems);
    if (newOpen.has(key)) {
      newOpen.delete(key);
    } else {
      newOpen.add(key);
    }
    setOpenItems(newOpen);
  };

  const currentFaqs = locale === 'zh' ? faqs.zh : faqs.en;

  const filteredFaqs = currentFaqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-[calc(100vh-64px)] py-8 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{locale === 'zh' ? '帮助中心' : 'Help Center'}</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            {locale === 'zh' ? '查找常见问题答案或联系我们获取帮助' : 'Find answers to common questions or contact us for help'}
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'zh' ? '搜索问题...' : 'Search questions...'}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-8">
          {filteredFaqs.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#339999]" />
                {category.category}
              </h2>

              <div className="space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openItems.has(key);

                  return (
                    <Card key={qIndex} className="overflow-hidden">
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{item.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4">
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-gray-600 leading-relaxed">{item.a}</p>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            {locale === 'zh' ? '还需要帮助？' : 'Still need help?'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">{locale === 'zh' ? '在线客服' : 'Live Chat'}</h3>
              <p className="text-gray-500 text-sm mb-4">
                {locale === 'zh' ? '工作日 9:00-18:00 可用' : 'Available weekdays 9:00-18:00'}
              </p>
              <button className="text-[#339999] hover:underline">
                {locale === 'zh' ? '开始聊天' : 'Start Chat'}
              </button>
            </Card>

            <Card className="p-6 text-center">
              <Mail className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">{locale === 'zh' ? '邮件支持' : 'Email Support'}</h3>
              <p className="text-gray-500 text-sm mb-4">
                {locale === 'zh' ? '24小时内回复' : 'Reply within 24 hours'}
              </p>
              <a href="mailto:support@mdlooker.com" className="text-[#339999] hover:underline">
                support@mdlooker.com
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Card, Input } from '@/components/ui';
import { Search, ChevronDown, ChevronUp, BookOpen, MessageCircle, Mail } from 'lucide-react';

const faqs = [
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
];

export default function HelpPage() {
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

  const filteredFaqs = faqs.map(category => ({
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-gray-500 max-w-2xl mx-auto mb-8">
            Find answers to common questions or contact us for help
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
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
            Still need help?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 text-center">
              <MessageCircle className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-500 text-sm mb-4">
                Available weekdays 9:00-18:00
              </p>
              <button className="text-[#339999] hover:underline">
                Start Chat
              </button>
            </Card>

            <Card className="p-6 text-center">
              <Mail className="w-12 h-12 text-[#339999] mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-500 text-sm mb-4">
                Reply within 24 hours
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

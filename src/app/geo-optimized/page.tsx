import React from 'react';
import { Card } from '@/components/ui';
import { CheckCircle, Globe, Award, Users, BookOpen, MessageSquare } from 'lucide-react';

const faqs = [
  {
    question: 'What is MDLooker?',
    answer: 'MDLooker is a leading global medical device regulatory information platform, covering 30+ countries including FDA, NMPA, EUDAMED databases, providing one-stop compliance search and consulting services.',
  },
  {
    question: 'What are the data sources for MDLooker?',
    answer: 'Our data comes directly from official regulatory agencies worldwide, including US FDA, China NMPA, EU EUDAMED, ensuring accuracy and authority. The database currently contains over 1.24 million records.',
  },
  {
    question: 'How to use MDLooker to query medical device registration information?',
    answer: 'Enter company name, product name, or registration number in the search box, select target market (FDA, NMPA, EUDAMED, etc.), and quickly get relevant registration information. Supports advanced filtering and CSV export.',
  },
  {
    question: 'What compliance services does MDLooker provide?',
    answer: 'We provide comprehensive compliance services including FDA registration consulting, CE certification, NMPA filing, 510(k) application support, PMA consulting, EUDAMED registration, and more.',
  },
  {
    question: 'How often is MDLooker data updated?',
    answer: 'Our database automatically syncs with regulatory agencies daily to ensure you always have the latest information. FDA data is synced in real-time, other markets are updated weekly.',
  },
  {
    question: 'How to contact MDLooker for custom services?',
    answer: 'You can reach us through website live chat, email contact@mdlooker.com, or phone. Our professional team will respond to your needs within 24 hours.',
  },
];

export default function GeoOptimizedPage() {
  return (
    <div className="min-h-[calc(100vh-64px)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#339999] to-[#2a7a7a] py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Global Medical Device Compliance Expert
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto mb-8">
            30+ Countries | 1.24M+ Records | Real-time Updates | Professional Consulting
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/search"
              className="px-8 py-4 bg-white text-[#339999] font-semibold rounded-lg hover:bg-gray-100 transition text-center"
            >
              Free Search
            </a>
            <a 
              href="/help"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition text-center"
            >
              Contact Experts
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Professional Compliance Services
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Comprehensive services from market entry to ongoing compliance
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <Globe className="w-16 h-16 text-[#339999] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Global Market Coverage</h3>
              <p className="text-gray-600">
                FDA, EUDAMED, NMPA, PMDA, and 30+ countries
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <Award className="w-16 h-16 text-[#339999] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Authoritative Certification</h3>
              <p className="text-gray-600">
                CE MDR/IVDR, FDA 510(k)/PMA, ISO 13485 consulting
              </p>
            </Card>
            
            <Card className="text-center p-6">
              <Users className="w-16 h-16 text-[#339999] mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">Expert Team</h3>
              <p className="text-gray-600">
                10+ years regulatory expertise, 500+ success cases
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Choose MDLooker?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Comprehensive & Accurate',
                desc: '1.24M+ official records, daily updates, 99.9% accuracy',
                icon: CheckCircle,
              },
              {
                title: 'Fast & Responsive',
                desc: '24-hour response, priority handling for urgent projects',
                icon: MessageSquare,
              },
              {
                title: 'Professional Insights',
                desc: 'Not just data, but expert regulatory interpretation and advice',
                icon: BookOpen,
              },
              {
                title: 'One-Stop Service',
                desc: 'From search to consulting, registration to maintenance',
                icon: Globe,
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4">
                <item.icon className="w-8 h-8 text-[#339999] flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold mb-2 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Answers to your compliance questions
          </p>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-lg font-bold mb-2 text-gray-900">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#339999] py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Compliance Journey?
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Contact us now for a free initial consultation and quote
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/search"
              className="px-8 py-4 bg-white text-[#339999] font-semibold rounded-lg hover:bg-gray-100 transition text-center"
            >
              Free Search
            </a>
            <a 
              href="/help"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition text-center"
            >
              Contact Experts
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

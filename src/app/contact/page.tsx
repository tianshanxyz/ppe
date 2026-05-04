'use client'

import { useState } from 'react'
import emailjs from '@emailjs/browser'
import { Mail, MapPin, Phone, Send, CheckCircle, Building, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

// EmailJS configuration - these are public keys safe to expose in client code
const EMAILJS_SERVICE_ID = 'service_uv0j9z9'
const EMAILJS_TEMPLATE_ID = 'template_wiumo8o'
const EMAILJS_PUBLIC_KEY = '1_y80J3lBqJfYafV7'

// Fallback email address for when EmailJS is unavailable
const FALLBACK_EMAIL = 'info@h-guardian.com'

export default function ContactPage() {
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    // Clear error when user starts editing
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_name: 'MDLooker Team',
        to_email: FALLBACK_EMAIL,
      }, EMAILJS_PUBLIC_KEY)
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      console.error('Email send failed:', err)
      setError('Failed to send your message through our email service. You can use the direct email link below instead.')
    } finally {
      setSubmitting(false)
    }
  }

  // Generate mailto link as fallback
  const getMailtoLink = () => {
    const subject = encodeURIComponent(`[Contact Form] ${formData.subject || 'General Inquiry'}`)
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )
    return `mailto:${FALLBACK_EMAIL}?subject=${subject}&body=${body}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#339999]/5 via-white to-[#339999]/5 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{locale === 'zh' ? '联系我们' : 'Get in Touch'}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {locale === 'zh' ? '有关于PPE合规、企业解决方案或API访问的问题？我们随时为您提供帮助。' : "Have questions about PPE compliance, enterprise solutions, or API access? We're here to help."}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Company Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-[#339999]" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">MDLooker</h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                AI-powered PPE compliance platform helping manufacturers and exporters navigate global regulations.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#339999] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{locale === 'zh' ? '邮箱' : 'Email'}</p>
                    <a href="mailto:info@h-guardian.com" className="text-sm text-[#339999] hover:underline">
                      info@h-guardian.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#339999] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{locale === 'zh' ? '办公室' : 'Office'}</p>
                    <p className="text-sm text-gray-600">
                      Room 1208, Tower A<br />
                      International Trade Center<br />
                      Shenzhen, Guangdong 518000<br />
                      China
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#339999] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{locale === 'zh' ? '电话' : 'Phone'}</p>
                    <p className="text-sm text-gray-600">+86 755 8888 9999</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#339999] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Business Hours</p>
                    <p className="text-sm text-gray-600">Mon - Fri: 9:00 AM - 6:00 PM (CST)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/pricing" className="block text-sm text-[#339999] hover:underline">
                  View Pricing Plans
                </Link>
                <Link href="/knowledge-base" className="block text-sm text-[#339999] hover:underline">
                  Knowledge Base
                </Link>
                <Link href="/help" className="block text-sm text-[#339999] hover:underline">
                  Help Center
                </Link>
                <Link href="/about" className="block text-sm text-[#339999] hover:underline">
                  About MDLooker
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">{locale === 'zh' ? '消息发送成功' : 'Message Sent Successfully'}</h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Thank you for reaching out. Our team will review your message and get back to you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-3 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{locale === 'zh' ? '给我们留言' : 'Send Us a Message'}</h2>
                  <p className="text-gray-600 mb-4">
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </p>
                  <p className="text-gray-500 text-sm mb-8">
                    Prefer email? Reach us directly at{' '}
                    <a
                      href={`mailto:${FALLBACK_EMAIL}`}
                      className="text-[#339999] hover:underline font-medium"
                    >
                      {FALLBACK_EMAIL}
                    </a>
                  </p>

                  {/* Error State */}
                  {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-red-700 font-medium">{error}</p>
                          <a
                            href={getMailtoLink()}
                            className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#339999] hover:underline font-medium"
                          >
                            <Mail className="w-4 h-4" />
                            Send via email client instead
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          {locale === 'zh' ? '邮箱' : 'Email'} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="you@company.com"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'zh' ? '主题' : 'Subject'} <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/10 outline-none transition-all text-gray-900"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="enterprise">Enterprise Plan</option>
                        <option value="api">API Access</option>
                        <option value="compliance">Compliance Support</option>
                        <option value="partnership">Partnership</option>
                        <option value="feedback">Feedback</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        {locale === 'zh' ? '消息' : 'Message'} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={6}
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help you..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/10 outline-none transition-all text-gray-900 placeholder-gray-400 resize-vertical"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 px-8 py-3 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          {locale === 'zh' ? '发送消息' : 'Send Message'}
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

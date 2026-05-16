'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles, Send, ArrowLeft, Trash2, ExternalLink, AlertCircle, RotateCcw, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { getTranslations } from '@/lib/i18n/translations'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isNonPpe?: boolean
  searchEngines?: Array<{ name: string; url: string }>
}

const CHAT_HISTORY_KEY = 'mdlooker_ai_chat_history'

function AiChatContent() {
  const locale = useLocale()
  const ct = getTranslations(
    {
      en: {
        title: 'AI PPE Assistant',
        subtitle: 'Ask about PPE compliance, regulations, certifications & market access',
        placeholder: 'Type your PPE question here...',
        thinking: 'Thinking...',
        welcomeTitle: 'Welcome to PPE AI Assistant',
        welcomeSubtitle: 'I can help you with PPE compliance, regulations, certifications, and market access questions.',
        welcomeExamples: 'Try asking:',
        example1: 'What are CE marking requirements for PPE?',
        example2: 'How to register N95 masks with FDA?',
        example3: 'EN 388 glove protection levels explained',
        example4: 'China NMPA registration process for PPE',
        newChat: 'New Chat',
        backToHome: 'Back to Home',
        nonPpeTitle: 'Non-PPE Question Detected',
        nonPpeMessage: 'This question appears to be outside the PPE domain. I specialize in PPE compliance and regulations. You may find better results using these search engines:',
        searchOn: 'Search on',
        copied: 'Copied!',
        copyFailed: 'Copy failed',
        disclaimer: 'AI responses are for reference only. Please verify with official sources for compliance decisions.',
      },
      zh: {
        title: 'PPE AI助手',
        subtitle: '询问PPE合规、法规、认证及市场准入相关问题',
        placeholder: '请输入您的PPE相关问题...',
        thinking: '思考中...',
        welcomeTitle: '欢迎使用PPE AI助手',
        welcomeSubtitle: '我可以帮助您解答PPE合规、法规、认证和市场准入方面的问题。',
        welcomeExamples: '试试提问：',
        example1: 'PPE的CE认证要求是什么？',
        example2: '如何向FDA注册N95口罩？',
        example3: 'EN 388手套防护等级说明',
        example4: '中国NMPA PPE注册流程',
        newChat: '新对话',
        backToHome: '返回首页',
        nonPpeTitle: '检测到非PPE问题',
        nonPpeMessage: '此问题似乎不属于PPE领域。我专注于PPE合规和法规。您可以使用以下搜索引擎获取更好的结果：',
        searchOn: '在{engine}上搜索',
        copied: '已复制！',
        copyFailed: '复制失败',
        disclaimer: 'AI回复仅供参考，请以官方来源为准做出合规决策。',
      },
    },
    locale
  )

  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery)
    }
  }, [])

  const handleSend = useCallback(async (queryOverride?: string) => {
    const userMessage = (queryOverride || input).trim()
    if (!userMessage || loading) return

    setInput('')
    const userMsg: ChatMessage = { role: 'user', content: userMessage, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, conversationHistory }),
      })
      const data = await res.json()
      const aiContent = data.answer || data.error || ct.thinking

      const isNonPpe = aiContent.includes('I\'m specialized in PPE') || aiContent.includes('I specialize in PPE')

      const searchEngines = isNonPpe ? [
        { name: 'Google', url: `https://www.google.com/search?q=${encodeURIComponent(userMessage)}` },
        { name: 'Bing', url: `https://www.bing.com/search?q=${encodeURIComponent(userMessage)}` },
        { name: 'Baidu', url: `https://www.baidu.com/s?wd=${encodeURIComponent(userMessage)}` },
      ] : undefined

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiContent,
        timestamp: Date.now(),
        isNonPpe,
        searchEngines,
      }

      setMessages(prev => [...prev, assistantMsg])

      try {
        const chatHistory = [...messages, userMsg, assistantMsg].slice(-50)
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory))
      } catch {}
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: ct.thinking, timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, ct])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleNewChat = useCallback(() => {
    setMessages([])
    setInput('')
    try {
      localStorage.removeItem(CHAT_HISTORY_KEY)
    } catch {}
    inputRef.current?.focus()
  }, [])

  const handleCopy = useCallback(async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } catch {}
  }, [])

  const handleExampleClick = useCallback((example: string) => {
    handleSend(example)
  }, [handleSend])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#339999] rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">{ct.title}</h1>
                <p className="text-[10px] text-gray-500 hidden sm:block">{ct.subtitle}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {ct.newChat}
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 bg-[#339999]/10 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#339999]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{ct.welcomeTitle}</h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md">{ct.welcomeSubtitle}</p>
              <div className="w-full max-w-lg">
                <p className="text-xs text-gray-400 mb-3">{ct.welcomeExamples}</p>
                <div className="grid gap-2">
                  {[
                    { text: ct.example1, query: 'What are CE marking requirements for PPE?' },
                    { text: ct.example2, query: 'How to register N95 masks with FDA?' },
                    { text: ct.example3, query: 'EN 388 glove protection levels explained' },
                    { text: ct.example4, query: 'China NMPA registration process for PPE' },
                  ].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => handleExampleClick(ex.query)}
                      className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-[#339999] hover:bg-[#339999]/5 transition-all"
                    >
                      {ex.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 bg-[#339999] rounded-lg flex items-center justify-center mr-2 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#339999] text-white rounded-br-md px-4 py-3'
                    : 'bg-white text-gray-800 rounded-bl-md px-4 py-3 border border-gray-100 shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <span className="text-[10px] font-semibold text-[#339999]">{ct.title}</span>
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      title="Copy"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                {msg.isNonPpe && msg.searchEngines && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-600">{ct.nonPpeTitle}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{ct.nonPpeMessage}</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.searchEngines.map((engine, i) => (
                        <a
                          key={i}
                          href={engine.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {engine.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="mb-4 flex justify-start">
              <div className="flex-shrink-0 w-7 h-7 bg-[#339999] rounded-lg flex items-center justify-center mr-2 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-[#339999] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#339999] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#339999] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-gray-500">{ct.thinking}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="relative flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={ct.placeholder}
                disabled={loading}
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/10 resize-none disabled:opacity-50 transition-all"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex-shrink-0 p-3 bg-[#339999] text-white rounded-xl hover:bg-[#2d8b8b] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-[10px] text-gray-400 text-center mt-2">{ct.disclaimer}</p>
        </div>
      </div>
    </div>
  )
}

export default function AiChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Sparkles className="w-5 h-5 animate-pulse text-[#339999]" />
          <span>Loading...</span>
        </div>
      </div>
    }>
      <AiChatContent />
    </Suspense>
  )
}

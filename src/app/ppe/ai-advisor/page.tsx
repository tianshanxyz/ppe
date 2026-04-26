'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, Sparkles, User, RotateCcw, ThumbsUp, ThumbsDown, Copy, CheckCircle2 } from 'lucide-react'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  feedback?: 'positive' | 'negative'
}

const SUGGESTED_QUESTIONS = [
  'What are the CE marking requirements for N95 respirators in the EU?',
  'How do I prepare FDA 510(k) submission for safety gloves?',
  'What is the difference between CE Category II and Category III PPE?',
  'What documents are needed for NMPA registration of medical face masks?',
  'How long does UKCA marking transition take from CE marking?',
  'What are the post-market surveillance requirements for PPE in the EU?',
]

export default function AIComplianceAdvisorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (question?: string) => {
    const query = question || input.trim()
    if (!query || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error('API error')

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || 'I apologize, but I could not generate a response. Please try again.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, the AI service is temporarily unavailable. Please try again later or contact our support team.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback } : m))
  }

  const handleCopy = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(messageId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleReset = () => {
    setMessages([])
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <section className="bg-gradient-to-br from-[#339999]/10 via-white to-white py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#339999]/20 to-[#339999]/10 rounded-2xl shadow-lg">
                <Bot className="w-8 h-8 text-[#339999]" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Compliance Advisor</h1>
            <p className="text-lg text-gray-600">
              Ask any question about PPE compliance, regulations, and certification
            </p>
          </div>
        </div>
      </section>

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#339999]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-[#339999]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How can I help you today?</h2>
              <p className="text-gray-600 mb-8">I can answer questions about PPE compliance, certification requirements, and market access.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(question)}
                    className="text-left p-4 bg-white rounded-xl border border-gray-200 hover:border-[#339999] hover:shadow-md transition-all text-sm text-gray-700"
                  >
                    <Sparkles className="w-4 h-4 text-[#339999] inline mr-2" />
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(message => (
            <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-[#339999]/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-[#339999]" />
                </div>
              )}
              <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#339999] text-white rounded-br-md'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Copy"
                    >
                      {copiedId === message.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'positive')}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
                        message.feedback === 'positive' ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'negative')}
                      className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
                        message.feedback === 'negative' ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#339999]/10 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-[#339999]" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin text-[#339999]" />
                  Analyzing your question...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="py-4 border-t border-gray-200">
          <div className="flex items-end gap-3">
            {messages.length > 0 && (
              <button
                onClick={handleReset}
                className="p-2.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="New conversation"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about PPE compliance, certification, regulations..."
                rows={1}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all resize-none text-sm"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-3 bg-[#339999] text-white rounded-xl hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            AI-powered by Volcengine Ark. Responses are for reference only - always verify with official sources.
          </p>
        </div>
      </div>
    </div>
  )
}

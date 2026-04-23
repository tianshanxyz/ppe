'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Trash2, FileText, BarChart3, Sparkles } from 'lucide-react';

type AIMode = 'default' | 'document' | 'analysis';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: AIMode;
}

const MODE_CONFIG: Record<AIMode, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  default: {
    label: 'General',
    icon: <Sparkles className="w-4 h-4" />,
    description: 'General PPE compliance Q&A',
    color: 'from-[#339999] to-[#2d8b8b]',
  },
  document: {
    label: 'Document',
    icon: <FileText className="w-4 h-4" />,
    description: 'Generate & review compliance docs',
    color: 'from-blue-500 to-blue-600',
  },
  analysis: {
    label: 'Analysis',
    icon: <BarChart3 className="w-4 h-4" />,
    description: 'Market analysis & insights',
    color: 'from-purple-500 to-purple-600',
  },
};

const WELCOME_MESSAGES: Record<AIMode, string> = {
  default: `Hello! I'm MDLooker AI, your PPE compliance assistant.

I can help you with:
• CE/FDA/NMPA/UKCA regulation questions
• Market access guidance
• Compliance process explanations
• Document and standard recommendations
• Product classification assistance

How can I help you today?`,
  document: `Hello! I'm your Document Assistant.

I can help you:
• Generate compliance document drafts
• Review and improve existing documents
• Explain document requirements per market
• Structure technical files
• Provide templates and best practices

What document do you need help with?`,
  analysis: `Hello! I'm your Market Analysis Expert.

I can help you:
• Analyze PPE market trends
• Assess regulatory change impacts
• Compare market requirements
• Provide strategic recommendations
• Analyze competitive landscape

What market or trend would you like to analyze?`,
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AIMode>('default');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcome message when mode changes or first open
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_MESSAGES[mode],
          timestamp: new Date(),
          mode,
        },
      ]);
    }
  }, [mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      mode,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
          mode,
        }),
      });

      const result = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.message || 'Sorry, I encountered an issue. Please try again.',
        timestamp: new Date(),
        mode,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Send message error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, the AI service is temporarily unavailable. Please try again later.',
        timestamp: new Date(),
        mode,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGES[mode],
        timestamp: new Date(),
        mode,
      },
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleModeChange = (newMode: AIMode) => {
    setMode(newMode);
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGES[newMode],
        timestamp: new Date(),
        mode: newMode,
      },
    ]);
  };

  const currentConfig = MODE_CONFIG[mode];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-[#339999] to-[#2d8b8b] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-50"
        >
          <MessageCircle className="w-8 h-8" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] max-h-[700px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${currentConfig.color} text-white p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">MDLooker AI</h3>
                <p className="text-xs text-white/80">{currentConfig.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearConversation}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            {(Object.keys(MODE_CONFIG) as AIMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={`flex-1 py-2.5 px-3 text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  mode === m
                    ? 'bg-white text-[#339999] border-b-2 border-[#339999]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {MODE_CONFIG[m].icon}
                {MODE_CONFIG[m].label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-h-[300px] max-h-[450px]">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-[#339999]/20 text-[#339999]'
                    : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                <div className={`max-w-[75%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-[#339999] text-white'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Ask in ${MODE_CONFIG[mode].label} mode...`}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent disabled:bg-slate-100"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-[#339999] text-white rounded-lg hover:bg-[#2d8b8b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              AI-generated content is for reference only. Consult professionals for critical decisions.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

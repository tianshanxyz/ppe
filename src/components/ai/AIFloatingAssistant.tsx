'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Sparkles,
  Loader2,
  Zap,
  FileText,
  Search,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageType = 'text' | 'suggestion' | 'action';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  timestamp: Date;
  suggestions?: string[];
  actions?: {
    label: string;
    action: string;
    data?: Record<string, unknown>;
  }[];
}

export interface AIFloatingAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  quickActions?: {
    icon: React.ElementType;
    label: string;
    action: string;
  }[];
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary-100' : 'bg-gradient-to-br from-primary-500 to-primary-600'
      }`}>
        {isUser ? (
          <span className="text-sm font-medium text-primary-700">Me</span>
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-primary-500 text-white rounded-tr-sm'
            : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full
                  text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-8"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg
        text-sm text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all
        hover:shadow-sm"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

export function AIFloatingAssistant({
  isOpen,
  onToggle,
  messages,
  onSendMessage,
  isLoading = false,
  className = '',
  position = 'bottom-right',
  welcomeMessage = "Hello! I'm MDLooker AI Assistant. I can help you query medical device related information.",
  quickActions = [
    { icon: Search, label: 'Search Company', action: 'search_company' },
    { icon: FileText, label: 'Search Product', action: 'search_product' },
    { icon: Zap, label: 'Risk Analysis', action: 'risk_analysis' },
  ]
}: AIFloatingAssistantProps) {
  const [inputValue, setInputValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const positionClasses = {
    'bottom-right': 'right-4',
    'bottom-left': 'left-4'
  };

  return (
    <div className={`fixed bottom-4 ${positionClasses[position]} z-50 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#339999] to-[#2a7a7a] p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Assistant</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-white/80">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
                <button
                  onClick={onToggle}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-primary-600" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed px-4">
                    {welcomeMessage}
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2 px-4">
                    {quickActions.map((action, index) => (
                      <QuickActionButton
                        key={index}
                        icon={action.icon}
                        label={action.label}
                        onClick={() => onSendMessage(action.action)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your question..."
                  className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white
                    transition-all placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-2.5 bg-primary-500 text-white rounded-xl
                    hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                AI Assistant may produce inaccurate information. Please verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 bg-gradient-to-r from-[#339999] to-[#2a7a7a] rounded-full shadow-lg
          flex items-center justify-center text-white hover:shadow-xl transition-shadow
          ${isOpen ? 'rotate-90' : ''} transition-transform duration-200`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}

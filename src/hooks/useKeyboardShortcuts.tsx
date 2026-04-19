'use client'

import React from 'react'
import { useEffect } from 'react'

interface KeyboardShortcutOptions {
  onSearch?: () => void;
  onHome?: () => void;
  onHelp?: () => void;
  enabled?: boolean;
}

/**
 * 键盘导航 Hook
 * 提供全局键盘快捷键支持
 */
export function useKeyboardShortcuts({
  onSearch,
  onHome,
  onHelp,
  enabled = true,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略修饰键
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      
      // 如果在输入框中，忽略大部分快捷键
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      if (isInput && e.key !== 'Escape') return;

      switch (e.key.toLowerCase()) {
        case '/':
          // 按 / 聚焦搜索框
          if (onSearch && !isInput) {
            e.preventDefault();
            onSearch();
          }
          break;
          
        case 'g':
          // 按 g + h 返回首页
          if (!isInput) {
            const handleG = (nextE: KeyboardEvent) => {
              if (nextE.key.toLowerCase() === 'h') {
                nextE.preventDefault();
                onHome?.();
                window.removeEventListener('keydown', handleG);
              }
            };
            window.addEventListener('keydown', handleG, { once: true });
          }
          break;
          
        case '?':
          // 按 ? 显示帮助
          if (onHelp && !isInput) {
            e.preventDefault();
            onHelp();
          }
          break;
          
        case 'escape':
          // ESC 关闭弹窗/取消聚焦
          if (isInput) {
            (target as HTMLInputElement).blur();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onHome, onHelp, enabled]);
}

/**
 * 键盘导航组件
 * 显示快捷键提示
 */
export function KeyboardHints() {
  return (
    <div className="hidden md:block text-xs text-gray-500 dark:text-gray-400 space-y-1">
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">/</kbd>
        <span>快速搜索</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">g</kbd>
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">h</kbd>
        <span>返回首页</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd>
        <span>显示帮助</span>
      </div>
    </div>
  )
}

/**
 * 焦点管理 Hook
 * 管理键盘导航的焦点循环
 */
export function useFocusManagement(selector: string) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(selector);
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          // Shift + Tab: 反向导航
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: 正向导航
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selector]);
}

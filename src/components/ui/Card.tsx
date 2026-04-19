'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  hover = false,
  padding = 'md',
  onClick 
}: CardProps) {
  // H-Guardian 风格卡片基础样式
  const baseStyles = 'bg-white rounded-xl shadow-sm border border-gray-200';
  
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  // H-Guardian 悬停效果 - 上移 + 阴影加深 + 边框变色
  const hoverStyles = hover 
    ? 'hover:shadow-lg hover:-translate-y-1 hover:border-green-300 transition-all duration-300 cursor-pointer' 
    : '';
  
  // 焦点状态 - 品牌色光环
  const focusStyles = 'focus-within:ring-2 focus-within:ring-[#339999] focus-within:ring-offset-2';
  
  return (
    <div
      className={`
        ${baseStyles}
        ${paddingStyles[padding]}
        ${hoverStyles}
        ${focusStyles}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`mb-4 pb-3 border-b border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 flex items-center gap-2 ${className}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`text-gray-600 leading-relaxed ${className}`}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

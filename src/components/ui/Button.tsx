'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    // H-Guardian 主按钮 - 增强阴影和悬停效果
    primary: 'bg-[#339999] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-[#2a8080] active:bg-[#226666] active:translate-y-0 active:shadow-sm focus:ring-[#339999] transition-all duration-300',
    
    // H-Guardian 次要按钮 - 描边风格
    secondary: 'bg-white text-[#339999] border-2 border-[#339999] hover:bg-green-50 hover:-translate-y-0.5 active:bg-green-100 active:translate-y-0 focus:ring-[#339999] transition-all duration-300',
    
    // 幽灵按钮
    ghost: 'bg-transparent text-gray-700 hover:bg-green-50 hover:text-[#339999] active:bg-green-100 focus:ring-[#339999] transition-all duration-200',
    
    // 危险按钮
    danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600 hover:-translate-y-0.5 active:bg-red-700 active:translate-y-0 focus:ring-red-500 transition-all duration-300',
    
    // 轮廓按钮
    outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:border-[#339999] hover:text-[#339999] hover:-translate-y-0.5 active:bg-green-50 active:translate-y-0 focus:ring-[#339999] transition-all duration-300',
  };
  
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm rounded-lg',      // 小按钮
    md: 'px-6 py-2.5 text-base rounded-xl',  // 中按钮
    lg: 'px-8 py-3 text-lg rounded-xl',      // 大按钮
  };
  
  const disabledStyles = 'opacity-50 cursor-not-allowed disabled:pointer-events-none hover:translate-y-0 hover:shadow-none';
  
  return (
    <button
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled || isLoading ? disabledStyles : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

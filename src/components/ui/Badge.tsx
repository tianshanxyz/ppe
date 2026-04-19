'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'info' | 'outline' | 'secondary';
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}

export function Badge({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variantStyles = {
    primary: 'bg-green-100 text-green-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    info: 'bg-green-100 text-green-700',
    outline: 'border border-gray-300 text-gray-700 bg-transparent',
    secondary: 'bg-gray-100 text-gray-700'
  };
  
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };
  
  return (
    <span 
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
      `}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success';
  text?: string;
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const statusConfig = {
    active: { variant: 'success' as const, defaultText: 'Active' },
    inactive: { variant: 'gray' as const, defaultText: 'Inactive' },
    pending: { variant: 'warning' as const, defaultText: 'Pending' },
    error: { variant: 'danger' as const, defaultText: 'Error' },
    success: { variant: 'success' as const, defaultText: 'Success' },
  };
  
  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} size="sm">
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {text || config.defaultText}
    </Badge>
  );
}

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export function Tag({ children, onRemove, className = '' }: TagProps) {
  return (
    <span className={`
      inline-flex items-center gap-1
      px-2.5 py-0.5
      bg-gray-100 text-gray-700
      rounded-md text-sm
      ${className}
    `}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

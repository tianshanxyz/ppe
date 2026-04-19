'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    // H-Guardian 风格输入框
    const baseStyles = 'block w-full rounded-xl border-2 transition-all duration-200 placeholder:text-gray-400';
    
    const sizeStyles = 'px-4 py-2.5 text-base';
    
    // H-Guardian 状态样式 - 增强焦点效果
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-100'
      : 'border-gray-200 focus:border-[#339999] focus:ring-4 focus:ring-green-100 hover:border-green-300';
    
    const disabledStyles = 'disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            className={`
              ${baseStyles}
              ${sizeStyles}
              ${stateStyles}
              ${disabledStyles}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const baseStyles = 'block w-full rounded-lg border transition-all duration-200 placeholder:text-gray-400';
    
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20'
      : 'border-gray-300 focus:border-[#339999] focus:ring-2 focus:ring-[#339999] focus:ring-opacity-20 hover:border-gray-400';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        
        <textarea
          ref={ref}
          className={`
            ${baseStyles}
            px-4 py-2.5 text-base
            ${stateStyles}
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
            ${className}
          `}
          {...props}
        />
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    const baseStyles = 'block w-full rounded-lg border transition-all duration-200';
    
    const stateStyles = error
      ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20'
      : 'border-gray-300 focus:border-[#339999] focus:ring-2 focus:ring-[#339999] focus:ring-opacity-20 hover:border-gray-400';
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        
        <select
          ref={ref}
          className={`
            ${baseStyles}
            px-4 py-2.5 text-base
            ${stateStyles}
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
            ${className}
          `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
        
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

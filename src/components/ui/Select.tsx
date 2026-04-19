'use client'

import React, { createContext, useContext, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextType {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextType | undefined>(undefined);

function useSelect() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select provider');
  }
  return context;
}

interface SelectProps {
  children?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Legacy API support
  options?: Array<{ value: string; label: string }>;
  label?: string;
  onChange?: (value: string) => void;
  className?: string;
}

// Legacy API - simple select
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, label, value, defaultValue, onChange, ...props }, ref) => {
    // If options are provided, use the simple select API
    if (options && options.length > 0) {
      return (
        <div className="w-full">
          {label && (
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
          )}
          <div className="relative">
            <select
              ref={ref}
              value={value}
              defaultValue={defaultValue}
              onChange={(e) => onChange?.(e.target.value)}
              className={`flex h-10 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all ${className}`}
              {...props}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      );
    }
    
    // Otherwise use the new context-based API
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const [internalOpen, setInternalOpen] = useState(false);
    
    const selectedValue = value !== undefined ? value : internalValue;
    const handleChange = onChange || setInternalValue;

    return (
      <SelectContext.Provider value={{ 
        value: selectedValue, 
        onChange: handleChange,
        open: internalOpen,
        setOpen: setInternalOpen
      }}>
        {props.children}
      </SelectContext.Provider>
    );
  }
);

Select.displayName = 'Select';

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className = '' }: SelectTriggerProps) {
  const { open, setOpen } = useSelect();
  
  return (
    <button
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-medical focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
    >
      {children}
      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export function SelectValue({ placeholder, className = '' }: SelectValueProps) {
  const { value } = useSelect();
  
  return (
    <span className={className}>
      {value || placeholder}
    </span>
  );
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
  position?: 'popper' | 'portal';
}

export function SelectContent({ children, className = '', position = 'popper' }: SelectContentProps) {
  const { open } = useSelect();
  
  if (!open) {
    return null;
  }
  
  return (
    <div className={`absolute z-50 w-full min-w-[8rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-md ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  );
}

interface SelectItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export function SelectItem({ children, value, className = '' }: SelectItemProps) {
  const { value: selectedValue, onChange, setOpen } = useSelect();
  const isSelected = selectedValue === value;
  
  return (
    <button
      onClick={() => {
        onChange(value);
        setOpen(false);
      }}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none hover:bg-gray-100 ${className}`}
    >
      {children}
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg className="w-4 h-4 text-medical" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
}

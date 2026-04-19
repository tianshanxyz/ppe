'use client'

import React from 'react'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
}

export function Progress({ 
  value, 
  max = 100, 
  className = '', 
  indicatorClassName = 'bg-[#339999]' 
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div 
      className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div 
        className={`h-2.5 rounded-full transition-all duration-300 ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

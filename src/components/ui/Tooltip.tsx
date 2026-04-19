'use client'

import { useState, useRef, useEffect, ReactNode, Children } from 'react'

interface TooltipProps {
  children: ReactNode
  content?: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayDuration?: number
}

export const TooltipProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>
}

export const Tooltip = ({ children, content, side = 'top', delayDuration = 0 }: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showDelayed, setShowDelayed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Extract TooltipTrigger and TooltipContent from children
  let extractedTrigger: ReactNode = null
  let tooltipContent: ReactNode = content

  // Safe extraction of TooltipTrigger and TooltipContent
  Children.forEach(children, child => {
    if (child && typeof child === 'object' && 'type' in child) {
      const type = (child as any).type
      // Use displayName for safer type checking
      const displayName = (child as any).type?.displayName || (child as any).type?.name
      
      if (displayName === 'TooltipTrigger' || type === TooltipTrigger) {
        // Safely access children using React.Children utilities
        extractedTrigger = Children.toArray((child as any).props?.children || [])
      }
      if (displayName === 'TooltipContent' || type === TooltipContent) {
        tooltipContent = Children.toArray((child as any).props?.children || [])
      }
    }
  })

  // Use extracted trigger or fallback to whole children
  const trigger = extractedTrigger || children

  useEffect(() => {
    if (isOpen) {
      timeoutRef.current = setTimeout(() => setShowDelayed(true), delayDuration)
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    } else {
      setShowDelayed(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isOpen, delayDuration])

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        {trigger}
      </div>
      {showDelayed && tooltipContent && (
        <div
          className={
            'absolute z-50 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg ' +
            (side === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2 ' : '') +
            (side === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2 ' : '') +
            (side === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2 ' : '') +
            (side === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2 ' : '')
          }
        >
          {tooltipContent}
        </div>
      )}
    </div>
  )
}

export const TooltipTrigger = ({ children, asChild }: { children: ReactNode; asChild?: boolean }) => {
  return <>{children}</>
}
TooltipTrigger.displayName = 'TooltipTrigger'

export const TooltipContent = ({ children, className }: { children: ReactNode; className?: string }) => {
  return <>{children}</>
}
TooltipContent.displayName = 'TooltipContent'

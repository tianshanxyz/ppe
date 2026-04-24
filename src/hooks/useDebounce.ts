import { useState, useEffect } from 'react'

/**
 * Debounce hook - 延迟更新值
 * @param value 需要debounce的值
 * @param delay 延迟时间（毫秒）
 * @returns debounce后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

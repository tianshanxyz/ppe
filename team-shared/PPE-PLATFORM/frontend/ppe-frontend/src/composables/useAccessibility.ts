// 无障碍功能组合式函数
import { ref, onMounted, onUnmounted } from 'vue'

// 焦点管理
export function useFocusManagement() {
  const focusableElements = ref<HTMLElement[]>([])

  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector))
  }

  const trapFocus = (container: HTMLElement) => {
    focusableElements.value = getFocusableElements(container)
    const firstElement = focusableElements.value[0]
    const lastElement = focusableElements.value[focusableElements.value.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    focusableElements,
    getFocusableElements,
    trapFocus
  }
}

// 键盘导航
export function useKeyboardNavigation() {
  const handleArrowKeys = (
    items: HTMLElement[],
    currentIndex: number,
    direction: 'up' | 'down' | 'left' | 'right'
  ) => {
    let nextIndex = currentIndex

    switch (direction) {
      case 'up':
      case 'left':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        break
      case 'down':
      case 'right':
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        break
    }

    items[nextIndex]?.focus()
    return nextIndex
  }

  const handleEnterKey = (callback: () => void) => {
    return (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        callback()
      }
    }
  }

  const handleEscapeKey = (callback: () => void) => {
    return (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        callback()
      }
    }
  }

  return {
    handleArrowKeys,
    handleEnterKey,
    handleEscapeKey
  }
}

// 屏幕阅读器支持
export function useScreenReader() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    announcer.textContent = message
    document.body.appendChild(announcer)

    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  const describeElement = (description: string) => {
    const id = `desc-${Math.random().toString(36).substr(2, 9)}`
    const descEl = document.createElement('div')
    descEl.id = id
    descEl.className = 'sr-only'
    descEl.textContent = description
    document.body.appendChild(descEl)

    return {
      id,
      cleanup: () => document.body.removeChild(descEl)
    }
  }

  return {
    announce,
    describeElement
  }
}

// 高对比度模式检测
export function useHighContrast() {
  const isHighContrast = ref(false)

  const checkHighContrast = () => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    isHighContrast.value = mediaQuery.matches
  }

  onMounted(() => {
    checkHighContrast()
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    mediaQuery.addEventListener('change', checkHighContrast)
  })

  return { isHighContrast }
}

// 减少动画偏好
export function useReducedMotion() {
  const prefersReducedMotion = ref(false)

  const checkReducedMotion = () => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches
  }

  onMounted(() => {
    checkReducedMotion()
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', checkReducedMotion)
  })

  return { prefersReducedMotion }
}

// 颜色对比度检查
export function useContrastChecker() {
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      const normalized = c / 255
      return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * (rs as number) + 0.7152 * (gs as number) + 0.0722 * (bs as number)
  }

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return [0, 0, 0]
    return [
      parseInt(result[1]!, 16),
      parseInt(result[2]!, 16),
      parseInt(result[3]!, 16)
    ]
  }

  const getContrastRatio = (color1: string, color2: string) => {
    const [r1, g1, b1] = hexToRgb(color1)
    const [r2, g2, b2] = hexToRgb(color2)

    const lum1 = getLuminance(r1, g1, b1)
    const lum2 = getLuminance(r2, g2, b2)

    const brightest = Math.max(lum1, lum2)
    const darkest = Math.min(lum1, lum2)

    return (brightest + 0.05) / (darkest + 0.05)
  }

  const meetsWCAG = (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA') => {
    const ratio = getContrastRatio(color1, color2)
    return level === 'AAA' ? ratio >= 7 : ratio >= 4.5
  }

  return {
    getContrastRatio,
    meetsWCAG
  }
}

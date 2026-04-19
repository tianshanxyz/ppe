// 性能优化组合式函数
import { ref, onMounted, onUnmounted } from 'vue'

// 防抖函数
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

// 节流函数
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 虚拟列表
export function useVirtualList<T>(
  list: T[],
  itemHeight: number,
  containerHeight: number
) {
  const scrollTop = ref(0)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = ref(0)
  const endIndex = ref(visibleCount)

  const visibleData = ref<T[]>([])
  const offset = ref(0)

  const updateVisibleData = () => {
    startIndex.value = Math.floor(scrollTop.value / itemHeight)
    endIndex.value = Math.min(startIndex.value + visibleCount + 1, list.length)
    visibleData.value = list.slice(startIndex.value, endIndex.value)
    offset.value = startIndex.value * itemHeight
  }

  const onScroll = (e: Event) => {
    scrollTop.value = (e.target as HTMLElement).scrollTop
    updateVisibleData()
  }

  onMounted(() => {
    updateVisibleData()
  })

  return {
    visibleData,
    offset,
    onScroll,
    totalHeight: list.length * itemHeight
  }
}

// 页面可见性检测
export function usePageVisibility() {
  const isVisible = ref(!document.hidden)

  const handleVisibilityChange = () => {
    isVisible.value = !document.hidden
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })

  return { isVisible }
}

// 资源预加载
export function usePreload() {
  const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = src
    })
  }

  const preloadComponent = (component: () => Promise<any>) => {
    return component()
  }

  return {
    preloadImage,
    preloadComponent
  }
}

// 内存清理
export function useMemoryCleanup() {
  const cleanupFns: (() => void)[] = []

  const addCleanup = (fn: () => void) => {
    cleanupFns.push(fn)
  }

  const cleanup = () => {
    cleanupFns.forEach(fn => fn())
    cleanupFns.length = 0
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    addCleanup,
    cleanup
  }
}

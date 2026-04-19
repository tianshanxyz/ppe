// 响应式设计组合式函数
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 断点定义
const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
}

type Breakpoint = keyof typeof breakpoints

// 当前断点
export function useBreakpoint() {
  const current = ref<Breakpoint>('xs')

  const updateBreakpoint = () => {
    const width = window.innerWidth
    if (width >= breakpoints.xxl) current.value = 'xxl'
    else if (width >= breakpoints.xl) current.value = 'xl'
    else if (width >= breakpoints.lg) current.value = 'lg'
    else if (width >= breakpoints.md) current.value = 'md'
    else if (width >= breakpoints.sm) current.value = 'sm'
    else current.value = 'xs'
  }

  const isMobile = computed(() => ['xs', 'sm'].includes(current.value))
  const isTablet = computed(() => current.value === 'md')
  const isDesktop = computed(() => ['lg', 'xl', 'xxl'].includes(current.value))

  onMounted(() => {
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateBreakpoint)
  })

  return {
    current,
    isMobile,
    isTablet,
    isDesktop
  }
}

// 响应式布局
export function useResponsiveLayout() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint()

  const gridCols = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    return 3
  })

  const sidebarCollapsed = computed(() => isMobile.value)

  const containerPadding = computed(() => {
    if (isMobile.value) return 16
    if (isTablet.value) return 24
    return 32
  })

  const fontSize = computed(() => {
    if (isMobile.value) return 14
    if (isTablet.value) return 15
    return 16
  })

  return {
    gridCols,
    sidebarCollapsed,
    containerPadding,
    fontSize,
    isMobile,
    isTablet,
    isDesktop
  }
}

// 触摸设备检测
export function useTouchDevice() {
  const isTouch = ref(false)

  onMounted(() => {
    isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  return { isTouch }
}

// 屏幕方向
export function useOrientation() {
  const orientation = ref<'portrait' | 'landscape'>('portrait')

  const updateOrientation = () => {
    orientation.value = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  }

  onMounted(() => {
    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    window.addEventListener('orientationchange', updateOrientation)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateOrientation)
    window.removeEventListener('orientationchange', updateOrientation)
  })

  return { orientation }
}

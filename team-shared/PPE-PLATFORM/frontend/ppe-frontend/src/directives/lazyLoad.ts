// 懒加载指令
import type { Directive, DirectiveBinding } from 'vue'

interface LazyOptions {
  threshold?: number
  rootMargin?: string
  placeholder?: string
}

const imageCache = new Map<string, boolean>()

const lazyLoad: Directive<HTMLElement, LazyOptions> = {
  mounted(el: HTMLElement, binding: DirectiveBinding<LazyOptions>) {
    const options = {
      threshold: 0.1,
      rootMargin: '50px',
      ...binding.value
    }

    const loadImage = () => {
      const img = el as HTMLImageElement
      const src = img.dataset.src

      if (!src) return

      // 检查缓存
      if (imageCache.has(src)) {
        img.src = src
        img.classList.add('loaded')
        return
      }

      // 创建图片预加载
      const tempImg = new Image()
      tempImg.onload = () => {
        img.src = src
        img.classList.add('loaded')
        imageCache.set(src, true)
      }
      tempImg.onerror = () => {
        img.classList.add('error')
        console.error(`Failed to load image: ${src}`)
      }
      tempImg.src = src
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage()
          observer.unobserve(el)
        }
      })
    }, {
      threshold: options.threshold,
      rootMargin: options.rootMargin
    })

    observer.observe(el)

    // 存储 observer 用于清理
    ;(el as any)._lazyObserver = observer
  },

  unmounted(el: HTMLElement) {
    const observer = (el as any)._lazyObserver
    if (observer) {
      observer.disconnect()
    }
  }
}

export default lazyLoad

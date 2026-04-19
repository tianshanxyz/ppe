/**
 * MDLooker Design System
 * 统一视觉风格规范
 */

// ============================================
// 1. 颜色系统
// ============================================

/**
 * 主色调 - H-Guardian 青绿色（Shield Teal #339999）
 * 用于品牌标识、主要按钮、重要交互元素
 */
export const primaryColors = {
  50: '#E8F5F5',
  100: '#D1EDED',
  200: '#A3DBDB',
  300: '#75C9C9',
  400: '#57B9B9',
  500: '#339999', // ★ H-Guardian 基准色
  600: '#2D8585', // hover
  700: '#267373',
  800: '#1F5F5F',
  900: '#194D4D',
};

/**
 * 中性色
 * 用于文本、背景、边框
 */
export const neutralColors = {
  // 白色背景
  white: '#FFFFFF',
  
  // 灰色系列（用于背景、边框）
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // 黑色
  black: '#000000',
};

/**
 * 功能色
 * 用于状态、反馈、警告
 */
export const functionalColors = {
  // 成功
  success: {
    light: '#DCFCE7',
    DEFAULT: '#22C55E',
    dark: '#15803D',
  },
  
  // 错误/危险
  danger: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#B91C1C',
  },
  
  // 警告
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#B45309',
  },
  
  // 信息
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1D4ED8',
  },
};

// ============================================
// 2. 间距系统
// ============================================

export const spacing = {
  // 基于 4px 网格
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  '4xl': '2.5rem', // 40px
};

// ============================================
// 3. 字体系统
// ============================================

export const typography = {
  // 字号
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  
  // 字重
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // 行高
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

// ============================================
// 4. 圆角系统
// ============================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.625rem',   // 10px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

// ============================================
// 5. 阴影系统
// ============================================

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// ============================================
// 6. 动画系统
// ============================================

export const animations = {
  // 过渡时间
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  
  // 缓动函数
  easing: {
    linear: 'linear',
    ease: 'ease',
    'ease-in': 'ease-in',
    'ease-out': 'ease-out',
    'ease-in-out': 'ease-in-out',
  },
  
  // 常用动画
  transitions: {
    hover: 'all 0.3s ease',
    focus: 'all 0.2s ease',
    transform: 'transform 0.3s ease',
    color: 'color 0.2s ease',
  },
};

// ============================================
// 7. 断点系统（Tailwind 默认）
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// 8. Z-Index 层级
// ============================================

export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  fixed: '1200',
  modalBackdrop: '1300',
  modal: '1400',
  popover: '1500',
  tooltip: '1600',
};

// ============================================
// 9. 组件样式规范
// ============================================

/**
 * 按钮样式变体
 */
export const buttonVariants = {
  // 主按钮
  primary: {
    bg: 'bg-primary-500',
    hover: 'hover:bg-primary-600',
    text: 'text-white',
    active: 'active:bg-primary-700',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
  },
  
  // 次要按钮
  secondary: {
    bg: 'bg-white',
    border: 'border border-primary-500',
    text: 'text-primary-500',
    hover: 'hover:bg-primary-50',
  },
  
  // 幽灵按钮
  ghost: {
    bg: 'bg-transparent',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-100',
  },
};

/**
 * 卡片样式规范
 */
export const cardStyles = {
  base: 'bg-white rounded-xl shadow-sm border border-gray-200',
  hover: 'hover:shadow-md hover:-translate-y-1 transition-all duration-300',
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
};

/**
 * 输入框样式规范
 */
export const inputStyles = {
  base: 'border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all',
  error: 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
  disabled: 'bg-gray-100 cursor-not-allowed',
};

// ============================================
// 10. 使用指南
// ============================================

/**
 * 使用示例：
 * 
 * 1. 按钮组件
 *    <button className={`${buttonVariants.primary.bg} ${buttonVariants.primary.hover} ...`}>
 * 
 * 2. 卡片组件
 *    <div className={`${cardStyles.base} ${cardStyles.hover}`}>
 * 
 * 3. 输入框
 *    <input className={inputStyles.base} />
 * 
 * 4. 间距
 *    <div className="gap-4"> (使用 Tailwind 类名)
 * 
 * 5. 颜色
 *    <div className="text-primary-500 bg-primary-50">
 */

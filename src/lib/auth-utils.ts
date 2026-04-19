import { createClient } from './supabase/client';
import { z } from 'zod';

/**
 * 认证输入验证模式
 */
export const LoginSchema = z.object({
  email: z.string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空')
    .max(100, '邮箱长度不能超过100个字符'),
  password: z.string()
    .min(8, '密码至少需要8个字符')
    .max(100, '密码长度不能超过100个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含字母和数字'),
});

export const RegisterSchema = z.object({
  email: z.string()
    .email('请输入有效的邮箱地址')
    .min(1, '邮箱不能为空')
    .max(100, '邮箱长度不能超过100个字符'),
  password: z.string()
    .min(8, '密码至少需要8个字符')
    .max(100, '密码长度不能超过100个字符')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, '密码必须包含字母和数字'),
  confirmPassword: z.string(),
  username: z.string()
    .min(2, '用户名至少需要2个字符')
    .max(50, '用户名长度不能超过50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '密码确认不匹配',
  path: ['confirmPassword'],
});

/**
 * 认证工具类
 */
export class AuthUtils {
  /**
   * 验证登录输入
   */
  static validateLoginInput(email: string, password: string): { success: boolean; errors?: Record<string, string> } {
    try {
      LoginSchema.parse({ email, password });
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        (error as any).issues.forEach((err: any) => {
          if (err.path.length > 0) {
            errors[err.path[0]] = err.message;
          }
        });
        return { success: false, errors };
      }
      return { success: false, errors: { general: '验证失败' } };
    }
  }

  /**
   * 清理和转义用户输入
   */
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>"'&]/g, (char) => {
        const map: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return map[char] || char;
      });
  }

  /**
   * 检查密码强度
   */
  static checkPasswordStrength(password: string): {
    score: number;
    strength: 'weak' | 'medium' | 'strong';
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // 长度检查
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // 字符类型检查
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;

    // 常见弱密码检查
    const weakPasswords = [
      'password', '123456', 'qwerty', 'admin', 'welcome', 'letmein'
    ];
    
    if (weakPasswords.includes(password.toLowerCase())) {
      feedback.push('避免使用常见弱密码');
      score = Math.max(0, score - 2);
    }

    // 重复字符检查
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('避免重复字符');
      score = Math.max(0, score - 1);
    }

    // 确定强度级别
    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 6) strength = 'strong';
    else if (score >= 4) strength = 'medium';

    // 提供反馈
    if (password.length < 8) feedback.push('密码长度至少8位');
    if (!/[a-z]/.test(password)) feedback.push('包含小写字母');
    if (!/[A-Z]/.test(password)) feedback.push('包含大写字母');
    if (!/\d/.test(password)) feedback.push('包含数字');
    if (!/[^a-zA-Z\d]/.test(password)) feedback.push('包含特殊字符');

    return { score, strength, feedback };
  }

  /**
   * 获取当前用户信息
   */
  static async getCurrentUser() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
    
    return user;
  }

  /**
   * 检查用户是否已认证
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * 安全退出登录
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('退出登录失败:', error);
        return { success: false, error: error.message };
      }

      // 清除本地存储的敏感信息
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        sessionStorage.clear();
      }

      return { success: true };
    } catch (error) {
      console.error('退出登录异常:', error);
      return { success: false, error: '退出登录失败' };
    }
  }

  /**
   * 刷新访问令牌
   */
  static async refreshToken(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('刷新令牌失败:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('刷新令牌异常:', error);
      return { success: false, error: '刷新令牌失败' };
    }
  }
}

/**
 * 认证守卫组件类型
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * 认证错误类型
 */
export interface AuthError {
  code: string;
  message: string;
  details?: string;
}

export default AuthUtils;
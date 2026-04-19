import { z } from 'zod';

// 搜索查询验证
export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  market: z.enum(['all', 'fda', 'nmpa', 'eudamed', 'companies', 'products']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// 登录验证
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
});

// 注册验证
export const registerSchema = z.object({
  name: z.string().min(2, '姓名至少2位').max(50),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少6位'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

// API密钥验证
export const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// 报告生成验证
export const reportSchema = z.object({
  companyId: z.string().uuid(),
  reportType: z.enum(['market_analysis', 'competitor_analysis', 'risk_assessment']),
  language: z.enum(['zh', 'en']).default('zh'),
});

// 企业ID验证
export const companyIdSchema = z.string().uuid();

// 通用ID验证
export const idSchema = z.string().uuid();

// 清理用户输入（防止XSS）
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

// 验证并清理搜索关键词
export function validateSearchQuery(query: string): string | null {
  const sanitized = sanitizeInput(query);
  if (sanitized.length < 1 || sanitized.length > 200) {
    return null;
  }
  return sanitized;
}

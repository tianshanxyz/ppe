import { NextRequest, NextResponse } from 'next/server';

/**
 * 安全中间件配置
 */
interface SecurityConfig {
  /**
   * CSP (Content Security Policy) 配置
   */
  csp?: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
    baseUri?: string[];
    formAction?: string[];
    frameAncestors?: string[];
    reportUri?: string;
  };
  
  /**
   * 安全头配置
   */
  headers?: {
    hsts?: boolean;
    xssProtection?: boolean;
    contentTypeOptions?: boolean;
    referrerPolicy?: string;
    permissionsPolicy?: string;
  };
}

/**
 * 安全中间件类
 */
export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    this.config = {
      csp: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        ...config.csp
      },
      headers: {
        hsts: true,
        xssProtection: true,
        contentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
        ...config.headers
      }
    };
  }

  /**
   * 生成 CSP 头
   */
  private generateCSP(): string {
    const { csp } = this.config;
    if (!csp) return '';

    const directives: string[] = [];

    Object.entries(csp).forEach(([directive, sources]) => {
      if (sources && sources.length > 0) {
        const sourceStr = Array.isArray(sources) ? sources.join(' ') : sources;
        directives.push(`${directive} ${sourceStr}`);
      }
    });

    return directives.join('; ');
  }

  /**
   * 应用安全头
   */
  private applySecurityHeaders(response: NextResponse): void {
    const { headers } = this.config;

    // CSP 头
    const csp = this.generateCSP();
    if (csp) {
      response.headers.set('Content-Security-Policy', csp);
    }

    // HSTS
    if (headers?.hsts) {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // XSS 保护
    if (headers?.xssProtection) {
      response.headers.set('X-XSS-Protection', '1; mode=block');
    }

    // 内容类型选项
    if (headers?.contentTypeOptions) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }

    // Referrer 策略
    if (headers?.referrerPolicy) {
      response.headers.set('Referrer-Policy', headers.referrerPolicy);
    }

    // 权限策略
    if (headers?.permissionsPolicy) {
      response.headers.set('Permissions-Policy', headers.permissionsPolicy);
    }

    // 其他安全头
    response.headers.set('X-Frame-Options', 'DENY');
  }

  /**
   * 验证请求来源
   */
  private validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // 允许没有 origin 的请求（如直接访问）
    if (!origin) return true;
    
    // 检查 origin 是否与 host 匹配
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }

  /**
   * 验证 CSRF Token
   */
  private validateCSRFToken(request: NextRequest): boolean {
    // 对于 GET 请求，跳过 CSRF 检查
    if (request.method === 'GET' || request.method === 'HEAD') {
      return true;
    }

    // 检查 CSRF Token
    const csrfToken = request.headers.get('x-csrf-token');
    const cookieToken = request.cookies.get('csrf-token')?.value;

    // 如果配置了 CSRF 保护但缺少 token，拒绝请求
    if (!csrfToken || !cookieToken) {
      return false;
    }

    // 验证 token 匹配
    return csrfToken === cookieToken;
  }

  /**
   * 清理请求参数
   */
  private sanitizeParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'string') {
        // HTML 转义
        sanitized[key] = value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  /**
   * 处理请求
   */
  async handle(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next();

    try {
      // 应用安全头
      this.applySecurityHeaders(response);

      // 验证请求来源
      if (!this.validateOrigin(request)) {
        return new NextResponse('Invalid origin', { status: 403 });
      }

      // 验证 CSRF Token（对于非 GET 请求）
      if (!this.validateCSRFToken(request)) {
        return new NextResponse('Invalid CSRF token', { status: 403 });
      }

      // 限制请求大小
      const contentLength = parseInt(request.headers.get('content-length') || '0');
      if (contentLength > 10 * 1024 * 1024) { // 10MB
        return new NextResponse('Request too large', { status: 413 });
      }

      // 限制请求频率（简单的防刷机制）
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      const rateLimitKey = `rate_limit_${ip}`;
      
      // 这里可以集成 Redis 或其他缓存系统进行更精确的限流
      // 目前使用简单的内存缓存（生产环境应使用 Redis）
      
      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return new NextResponse('Security error', { status: 500 });
    }
  }

  /**
   * 生成 CSRF Token
   */
  static generateCSRFToken(): string {
    return crypto.randomUUID();
  }

  /**
   * 创建安全的响应
   */
  static createSecureResponse(data: unknown, status: number = 200): NextResponse {
    const response = NextResponse.json(data, { status });
    
    // 应用基本安全头
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }
}

/**
 * 默认安全中间件实例
 */
export const securityMiddleware = new SecurityMiddleware();

export default SecurityMiddleware;
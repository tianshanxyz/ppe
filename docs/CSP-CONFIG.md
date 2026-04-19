# 内容安全策略 (CSP) 配置文档

## 概述

本项目实施了严格的内容安全策略 (CSP) 以防止 XSS、数据注入和其他代码注入攻击。

## CSP 头配置

### default-src: 'self'
- **说明**: 默认只允许来自同源的资源
- **理由**: 最小化信任范围，防止加载外部资源

### script-src: 'self' https://*.sentry.io https://*.volces.com
- **说明**: 仅允许来自自身、Sentry 和火山引擎的脚本
- **移除**: `'unsafe-inline'` - 禁止内联脚本
- **移除**: `'unsafe-eval'` - 禁止 eval() 和类似函数
- **理由**: 防止恶意脚本注入和执行

### style-src: 'self' https://*.volces.com
- **说明**: 仅允许来自自身和火山引擎的样式表
- **移除**: `'unsafe-inline'` - 禁止内联样式
- **理由**: 防止样式注入和点击劫持

### img-src: 'self' data: https: blob: https://*.supabase.co
- **说明**: 允许来自自身、data URI、HTTPS 源、blob 和 Supabase 的图片
- **理由**: 支持现代图片加载方式，同时限制来源

### font-src: 'self' data:
- **说明**: 允许来自自身和 data URI 的字体
- **理由**: 支持内嵌字体，防止加载外部字体

### connect-src: 'self' https://*.sentry.io https://*.supabase.co https://*.vercel.app https://*.volces.com https://api.medplum.com
- **说明**: 限制 XHR、Fetch、WebSocket 等连接的目标
- **理由**: 防止数据泄露到未授权的服务器

### frame-src: 'none'
- **说明**: 禁止嵌入任何框架
- **理由**: 防止点击劫持和框架注入攻击

### frame-ancestors: 'none'
- **说明**: 禁止页面被嵌入到框架中
- **理由**: 防止点击劫持攻击

### base-uri: 'self'
- **说明**: 禁止修改页面的 base URI
- **理由**: 防止通过 base 标签改变相对 URL 的解析

### form-action: 'self'
- **说明**: 表单只能提交到同源
- **理由**: 防止表单数据泄露

### object-src: 'none'
- **说明**: 禁止加载插件对象（如 Flash、Java Applet）
- **理由**: 插件通常是安全漏洞的来源

### upgrade-insecure-requests
- **说明**: 自动将 HTTP 请求升级为 HTTPS
- **理由**: 确保所有通信都是加密的

### report-uri
- **说明**: CSP 违规报告地址
- **理由**: 监控和追踪 CSP 违规尝试

## 安全头总览

除 CSP 外，还配置了以下安全头：

### Strict-Transport-Security
```
max-age=63072000; includeSubDomains; preload
```
强制使用 HTTPS 连接

### X-Content-Type-Options
```
nosniff
```
防止 MIME 类型嗅探攻击

### X-Frame-Options
```
DENY
```
禁止页面被嵌入到框架中

### X-XSS-Protection
```
1; mode=block
```
启用浏览器 XSS 过滤器

### Referrer-Policy
```
strict-origin-when-cross-origin
```
控制 Referrer 信息的泄露

### Permissions-Policy
```
camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```
禁用不必要的浏览器功能

### Cross-Origin-* Policies
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```
增强跨域隔离和安全性

## 开发和测试

### 开发环境注意事项

1. **内联脚本**: 开发时避免使用内联脚本，使用外部文件
2. **eval()**: 禁止使用 eval() 和 new Function()
3. **动态样式**: 避免使用 element.style，使用 CSS 类

### 测试 CSP 配置

使用浏览器开发者工具检查：
```javascript
// 在控制台运行
document.securityPolicy;
```

使用在线工具测试：
- https://csp-evaluator.withgoogle.com/
- https://securityheaders.com/

### 监控 CSP 违规

在 Sentry 中查看 CSP 违规报告：
1. 登录 Sentry 控制台
2. 选择项目
3. 查看 Issues > CSP Violations

## 常见问题

### Q: 为什么移除了 'unsafe-inline'？
A: 内联脚本和样式是 XSS 攻击的主要入口。移除此选项可以显著降低 XSS 风险。

### Q: 如何调试 CSP 问题？
A: 
1. 打开浏览器开发者工具
2. 查看 Console 中的 CSP 违规信息
3. 根据错误信息调整 CSP 配置或代码

### Q: 需要添加新的可信源怎么办？
A: 
1. 评估该源的必要性和安全性
2. 在 next.config.ts 中添加相应的 CSP 规则
3. 更新本文档

## 参考资源

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Web.dev Security Headers](https://web.dev/security-headers/)

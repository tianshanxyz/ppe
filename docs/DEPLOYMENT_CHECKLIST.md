# 🚀 部署就绪检查清单

> **状态**: ✅ 准备就绪  
> **最后更新**: 2026-04-20

---

## ✅ 前置条件检查

### 1. GitHub 配置
- [x] GitHub 仓库已创建
- [x] GitHub Actions 已启用
- [x] GitHub Secrets 已配置
  - [x] `VERCEL_TOKEN`
  - [x] `VERCEL_PROJECT_ID`
  - [x] `VERCEL_ORG_ID`（如适用）

### 2. Vercel 配置
- [x] Vercel 账号已注册
- [x] 项目已创建（`ppe-platform`）
- [x] 域名已配置（`ppe-platform.vercel.app`）
- [x] 环境变量已在 `vercel.json` 中配置

### 3. Supabase 配置
- [x] Supabase 项目已创建
- [x] 数据库已初始化
- [x] API 密钥已获取
  - [x] `NEXT_PUBLIC_SUPABASE_URL`
  - [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [x] `SUPABASE_SERVICE_ROLE_KEY`

---

## 📋 部署前验证

### 本地测试
```bash
# 1. 安装依赖
cd ppe-platform
npm install

# 2. 运行开发服务器
npm run dev

# 3. 访问 http://localhost:3000
# 确保应用正常运行
```

### 代码质量检查
```bash
# 1. 运行 ESLint
npm run lint

# 2. 运行 TypeScript 检查
npm run build

# 3. 运行测试（如有）
npm test
```

---

## 🎯 部署步骤

### 步骤 1: 推送代码到 GitHub

```bash
# 确保在 main 分支
git checkout main

# 添加所有更改
git add .

# 提交更改
git commit -m "feat: 准备生产环境部署"

# 推送到 GitHub
git push origin main
```

### 步骤 2: 监控 GitHub Actions

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 查看 **CI/CD Pipeline** 运行状态
4. 等待所有 Job 完成（约 5-10 分钟）

**预期流程**:
```
✅ lint (代码质量检查)
✅ unit-test (单元测试)
✅ e2e-test (E2E 测试)
✅ build (构建)
✅ deploy-production (生产部署)
```

### 步骤 3: 验证部署

```bash
# 1. 检查部署状态
curl https://ppe-platform.vercel.app/api/health

# 2. 访问生产环境
open https://ppe-platform.vercel.app

# 3. 测试关键功能
# - 首页加载
# - 搜索功能
# - API 端点
```

### 步骤 4: 检查 Vercel 部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `ppe-platform`
3. 查看最新部署状态
4. 确认部署成功（绿色勾）

---

## 🔍 验证清单

### 应用功能
- [ ] 首页正常加载
- [ ] 导航栏正常显示
- [ ] 搜索功能可用
- [ ] 产品列表正常显示
- [ ] 企业详情正常显示
- [ ] API 端点响应正常

### 性能指标
- [ ] 首屏加载时间 < 2 秒
- [ ] API 响应时间 < 500ms
- [ ] 无控制台错误
- [ ] 图片正常加载

### 数据库连接
- [ ] Supabase 连接成功
- [ ] 数据查询正常
- [ ] 数据写入正常
- [ ] RLS 策略生效

### 环境变量
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 正确
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 正确
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 正确
- [ ] 其他环境变量已配置

---

## 🚨 故障排查

### 问题 1: GitHub Actions 失败

**查看日志**:
```
GitHub → Actions → CI/CD Pipeline → 失败的 Job
```

**常见错误**:
- `Missing secrets`: 检查 GitHub Secrets 配置
- `Build failed`: 检查构建错误日志
- `Test failed`: 查看测试失败原因

### 问题 2: Vercel 部署失败

**查看日志**:
```
Vercel Dashboard → Deployments → 失败的部署 → View Logs
```

**常见错误**:
- `Environment variables missing`: 检查环境变量
- `Build timeout`: 优化构建时间
- `Node version mismatch`: 检查 Node.js 版本

### 问题 3: 应用无法访问

**检查项**:
```bash
# 1. 检查域名解析
nslookup ppe-platform.vercel.app

# 2. 检查 SSL 证书
curl -vI https://ppe-platform.vercel.app

# 3. 检查 Vercel 状态
https://www.vercel-status.com/
```

---

## 📊 监控配置

### 1. Vercel Analytics
- [ ] 访问分析已启用
- [ ] 性能监控已启用
- [ ] 错误追踪已启用

### 2. Sentry（可选）
- [ ] Sentry 项目已创建
- [ ] DSN 已配置
- [ ] 错误上报正常

### 3. UptimeRobot（可选）
- [ ] UptimeRobot 账号已注册
- [ ] 监控已配置
- [ ] 告警通知已设置

---

## 🔄 回滚流程

### 方法 1: 使用 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目
3. 点击 **Deployments**
4. 找到上一个稳定版本
5. 点击 **⋯** → **Promote to Production**

### 方法 2: 使用 GitHub Actions

1. 打开 **Actions** 标签
2. 选择 **Rollback Deployment**
3. 点击 **Run workflow**
4. 输入要回滚的 Deployment ID
5. 点击 **Run workflow**

### 方法 3: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 查看部署历史
vercel ls

# 回滚到指定部署
vercel rollback <DEPLOYMENT_ID>
```

---

## 📝 部署后任务

### 1. 功能验证
- [ ] 测试所有核心功能
- [ ] 验证 API 端点
- [ ] 检查数据库连接
- [ ] 测试用户认证

### 2. 性能优化
- [ ] 分析 Vercel Analytics
- [ ] 优化慢查询
- [ ] 配置 CDN 缓存
- [ ] 启用 Gzip 压缩

### 3. 监控设置
- [ ] 配置健康检查
- [ ] 设置告警通知
- [ ] 配置日志收集
- [ ] 设置性能监控

### 4. 文档更新
- [ ] 更新部署日志
- [ ] 记录已知问题
- [ ] 编写用户手册
- [ ] 更新 API 文档

---

## 🎉 成功标志

当看到以下标志时，说明部署成功：

✅ **GitHub Actions**:
- 所有 Job 显示绿色勾
- 部署状态：Success
- 无错误或警告

✅ **Vercel**:
- 部署完成
- 生产环境已更新
- 域名正常解析
- SSL 证书有效

✅ **应用**:
- 网站正常访问
- 所有功能正常
- 性能指标良好
- 无控制台错误

✅ **监控**:
- 健康检查通过
- 无错误告警
- 性能指标正常
- 用户访问正常

---

## 📞 支持资源

### 文档
- [部署指南](./DEPLOYMENT_GUIDE.md)
- [运维手册](./OPERATIONS_MANUAL.md)
- [故障排查](./TROUBLESHOOTING.md)
- [CI/CD 测试指南](./TEST_CI_CD.md)

### 工具
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/features/actions)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel CLI](https://vercel.com/docs/cli)

### 社区
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

*创建日期：2026-04-20*  
*维护者：AI 助手（运维工程师）*  
*状态：✅ 准备就绪*

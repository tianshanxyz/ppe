# 测试 CI/CD 流水线

## 前提条件 ✅

- [x] GitHub Secrets 已配置
  - [x] `VERCEL_TOKEN`
  - [x] `VERCEL_PROJECT_ID`
  - [x] `VERCEL_ORG_ID`（如适用）

---

## 快速测试（推荐）

### 步骤 1: 推送测试提交

```bash
# 进入项目目录
cd ppe-platform

# 创建一个测试提交
git add .
git commit -m "test: 触发 CI/CD 流水线测试"
git push origin main
```

### 步骤 2: 查看 GitHub Actions 执行

1. 打开 GitHub 仓库
2. 点击 **Actions** 标签
3. 查看正在运行的工作流：
   - **CI/CD Pipeline** - 主流水线
   - **Health Check** - 健康检查（每 5 分钟）
   - **Backup Database** - 数据备份（每天 2 点）

### 步骤 3: 验证部署

```bash
# 访问生产环境
curl https://ppe-platform.vercel.app/api/health

# 预期响应：
# {"status":"healthy", ...}
```

---

## 详细测试流程

### 测试 1: 代码质量检查

**触发条件**: 推送到 main 分支

**检查项**:
- [ ] ESLint 通过
- [ ] 无语法错误
- [ ] 代码风格符合规范

**查看日志**:
```
GitHub → Actions → CI/CD Pipeline → lint job
```

### 测试 2: 单元测试

**触发条件**: 推送到 main 分支

**检查项**:
- [ ] 所有单元测试通过
- [ ] 测试覆盖率报告生成
- [ ] 无运行时错误

**查看日志**:
```
GitHub → Actions → CI/CD Pipeline → unit-test job
```

### 测试 3: E2E 测试

**触发条件**: 推送到 main 分支

**检查项**:
- [ ] Playwright 测试通过
- [ ] 浏览器自动化测试完成
- [ ] 测试报告生成

**查看日志**:
```
GitHub → Actions → CI/CD Pipeline → e2e-test job
```

### 测试 4: 构建测试

**触发条件**: 推送到 main 分支，且 lint 和 tests 通过

**检查项**:
- [ ] Next.js 构建成功
- [ ] 无 TypeScript 错误
- [ ] 静态资源生成完成

**查看日志**:
```
GitHub → Actions → CI/CD Pipeline → build job
```

### 测试 5: 生产部署

**触发条件**: 推送到 main 分支，且所有前置检查通过

**检查项**:
- [ ] Vercel 部署成功
- [ ] 环境变量正确配置
- [ ] 部署状态更新为 Success

**查看日志**:
```
GitHub → Actions → CI/CD Pipeline → deploy-production job
```

---

## 故障排查

### 问题 1: GitHub Actions 未触发

**可能原因**:
- 推送的分支不是 main
- GitHub Actions 被禁用
- Secrets 配置错误

**解决方案**:
```bash
# 检查当前分支
git branch

# 确保推送到 main
git push origin main

# 检查 GitHub Actions 状态
# GitHub → Settings → Actions → General
# 确保 Actions 已启用
```

### 问题 2: 部署失败 - "Missing secrets"

**错误信息**:
```
Error: Input required and not supplied: VERCEL_TOKEN
```

**解决方案**:
1. 检查 Secrets 名称是否完全匹配
2. 确认 Secrets 在正确的仓库配置
3. 重新添加 Secrets

### 问题 3: Vercel 部署失败

**错误信息**:
```
Error: Cannot find project id
```

**解决方案**:
```bash
# 验证 Project ID
# GitHub → Settings → Secrets and variables → Actions
# 检查 VERCEL_PROJECT_ID 是否正确

# 验证 Token 有效性
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  https://api.vercel.com/v6/user/info
```

### 问题 4: 构建超时

**错误信息**:
```
Error: Build timed out after 10 minutes
```

**解决方案**:
```bash
# 优化构建
npm run build -- --profile

# 检查是否有无限循环
# 检查大型文件是否被正确忽略
```

---

## 手动触发测试

### 方法 1: 使用 GitHub UI

1. 打开 **Actions** 标签
2. 选择 **CI/CD Pipeline**
3. 点击 **Run workflow**
4. 选择分支（main）
5. 点击 **Run workflow**

### 方法 2: 使用 GitHub CLI

```bash
# 安装 GitHub CLI
brew install gh

# 登录
gh auth login

# 触发工作流
gh workflow run ci-cd.yml --ref main

# 查看运行状态
gh run list
gh run watch <RUN_ID>
```

---

## 验证清单

部署完成后，请验证以下项目：

### 应用功能
- [ ] 首页正常加载
- [ ] 搜索功能可用
- [ ] API 端点响应正常
- [ ] 数据库连接成功

### 性能指标
- [ ] 首屏加载 < 2 秒
- [ ] API 响应 < 500ms
- [ ] 无控制台错误

### 监控告警
- [ ] Vercel Analytics 开始收集数据
- [ ] Sentry 错误追踪正常
- [ ] 健康检查端点可用

---

## 回滚测试

### 测试回滚流程

```bash
# 1. 找到上一个稳定的部署
# GitHub → Actions → 找到成功的部署

# 2. 手动触发回滚
# GitHub → Actions → Rollback Deployment → Run workflow
# 输入要回滚的 Deployment ID

# 3. 验证回滚成功
curl https://ppe-platform.vercel.app/api/health
```

---

## 成功标志

当看到以下标志时，说明 CI/CD 流水线正常工作：

✅ **GitHub Actions**:
- 所有 Job 显示绿色勾
- 部署状态：Success
- 无错误或警告

✅ **Vercel**:
- 部署完成
- 生产环境已更新
- 域名正常解析

✅ **应用**:
- 网站正常访问
- 所有功能正常
- 性能指标良好

---

## 下一步

CI/CD 测试通过后，建议：

1. **配置监控告警**
   - 注册 UptimeRobot
   - 配置 Sentry
   - 设置通知渠道

2. **优化部署流程**
   - 配置预览部署
   - 设置自动审查
   - 优化构建时间

3. **完善文档**
   - 更新部署日志
   - 记录已知问题
   - 编写运维手册

---

*创建日期：2026-04-20*
*维护者：AI 助手（运维工程师）*

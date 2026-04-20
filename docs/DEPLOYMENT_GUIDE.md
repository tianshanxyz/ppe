# MDLooker 生产环境部署文档

## 文档版本

| 版本 | 日期 | 作者 | 变更说明 |
|-----|------|------|---------|
| 1.0 | 2026-04-20 | AI 助手（运维工程师） | 初始版本 |

---

## 一、环境配置清单

### 1.1 服务器配置

| 配置项 | 规格 | 数量 | 说明 |
|-------|------|------|------|
| **应用托管** | Vercel Pro | 1 | Next.js 应用托管 |
| **数据库** | Supabase Pro | 1 | PostgreSQL 数据库 |
| **对象存储** | AWS S3 | 1 | 备份文件存储 |
| **CDN** | Vercel Edge Network | 全球 | 内容分发网络 |

### 1.2 软件版本

| 软件 | 版本 | 说明 |
|-----|------|------|
| Node.js | 20.x | 运行时环境 |
| Next.js | 16.x | Web 框架 |
| PostgreSQL | 15.x (Supabase) | 数据库 |
| npm | 10.x | 包管理器 |

### 1.3 网络要求

| 类型 | 端口 | 协议 | 说明 |
|-----|------|------|------|
| HTTPS | 443 | TCP | Web 访问（Vercel 自动管理） |
| PostgreSQL | 5432 | TCP | 数据库连接（内网） |

### 1.4 域名配置

| 域名 | 类型 | 记录值 | 说明 |
|-----|------|--------|------|
| mdlooker.com | CNAME | cname.vercel-dns.com | 主域名 |
| www.mdlooker.com | CNAME | cname.vercel-dns.com | WWW 重定向 |
| api.mdlooker.com | CNAME | cname.vercel-dns.com | API 域名（可选） |

### 1.5 SSL 证书

- **提供商**: Vercel 自动管理（Let's Encrypt）
- **类型**: 自动续期
- **配置**: 无需手动配置

---

## 二、部署前准备

### 2.1 获取访问凭证

#### Vercel

1. 注册账号：https://vercel.com/signup
2. 创建项目
3. 获取 Token：Settings → Account → Tokens

#### Supabase

1. 注册账号：https://supabase.com
2. 创建项目
3. 获取密钥：Settings → API

#### AWS S3（用于备份）

1. 创建 AWS 账号
2. 创建 S3 存储桶
3. 创建 IAM 用户并获取 Access Key

### 2.2 配置环境变量

创建 `.env.production` 文件：

```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Vercel 配置
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# AWS 配置（备份用）
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
BACKUP_BUCKET=mdlooker-backups

# 通知配置（可选）
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

---

## 三、部署步骤

### 3.1 方法一：使用一键部署脚本（推荐）

```bash
# 克隆仓库
git clone https://github.com/maxiaoha/mdlooker.git
cd mdlooker

# 设置环境变量
export NEXT_PUBLIC_SUPABASE_URL="https://..."
export NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export VERCEL_TOKEN="..."

# 运行部署脚本
chmod +x ppe-platform/scripts/deploy.sh
./ppe-platform/scripts/deploy.sh
```

### 3.2 方法二：手动部署

#### 步骤 1: 安装依赖

```bash
cd ppe-platform
npm install
```

#### 步骤 2: 运行测试

```bash
npm run lint
npm run test:ci
```

#### 步骤 3: 构建项目

```bash
npm run build
```

#### 步骤 4: 部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 3.3 方法三：GitHub Actions 自动部署

推送代码到 main 分支会自动触发部署：

```bash
git add .
git commit -m "feat: 新功能"
git push origin main
```

GitHub Actions 会自动执行：
1. 代码质量检查
2. 单元测试
3. E2E 测试
4. 构建
5. 部署到 Vercel

---

## 四、配置要点

### 4.1 端口映射

Vercel 自动管理端口，无需手动配置。

### 4.2 域名配置

在 Vercel Dashboard 中配置：

1. 进入项目 → Settings → Domains
2. 添加域名：mdlooker.com
3. 按照提示更新 DNS 记录

### 4.3 证书路径

Vercel 自动管理 SSL 证书，无需手动配置。

### 4.4 数据库连接

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 4.5 防火墙规则

Vercel 自动管理防火墙，建议配置：

- 启用 DDoS 防护
- 配置速率限制
- 设置 CORS 策略

---

## 五、验证部署

### 5.1 健康检查

访问健康检查端点：

```bash
curl https://ppe-platform.vercel.app/api/health
```

预期响应：

```json
{
  "status": "healthy",
  "timestamp": "2026-04-20T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "web": "ok",
    "database": "ok",
    "external_apis": "ok"
  }
}
```

### 5.2 功能测试

1. **首页访问**: https://ppe-platform.vercel.app
2. **搜索功能**: 测试产品搜索
3. **企业查询**: 测试企业详情页面
4. **数据同步**: 验证数据更新

### 5.3 性能测试

```bash
# 使用 Lighthouse 测试
npm install -g lighthouse
lighthouse https://ppe-platform.vercel.app --view
```

---

## 六、故障排查

### 6.1 常见问题

#### 问题 1: 部署失败 - "Missing environment variables"

**症状**:
```
Error: Missing environment variables
```

**解决方案**:
1. 检查 `.env.production` 文件是否存在
2. 确认所有必需的环境变量已设置
3. 在 Vercel Dashboard 重新配置环境变量

#### 问题 2: 数据库连接失败

**症状**:
```
Error: Cannot connect to database
```

**解决方案**:
1. 检查 Supabase 项目状态
2. 验证环境变量是否正确
3. 检查网络连接
4. 查看 Supabase 日志

#### 问题 3: 构建失败 - "Out of memory"

**症状**:
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**解决方案**:
```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### 问题 4: 静态资源 404

**症状**:
```
404 Not Found: /_next/static/...
```

**解决方案**:
1. 清理构建缓存：`rm -rf .next`
2. 重新构建：`npm run build`
3. 重新部署：`vercel --prod`

### 6.2 日志查看

#### Vercel 日志

```bash
# 查看实时日志
vercel logs --prod

# 查看错误日志
vercel logs --prod --level=error
```

#### Supabase 日志

1. 登录 Supabase Dashboard
2. 进入 **Logs** 页面
3. 筛选错误日志

---

## 七、服务重启流程

### 7.1 应用重启

Vercel 自动管理应用重启，无需手动操作。

如需强制重启：

```bash
# 重新部署（触发重启）
vercel --prod --force
```

### 7.2 数据库重启

Supabase 自动管理数据库，无需手动重启。

如遇数据库问题：

1. 查看 Supabase Dashboard 状态
2. 联系 Supabase 支持

### 7.3 服务验证

```bash
# 检查服务状态
curl -f https://ppe-platform.vercel.app/api/health

# 检查响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://ppe-platform.vercel.app

# curl-format.txt 内容:
# time_namelookup:  %{time_namelookup}\n
# time_connect:     %{time_connect}\n
# time_starttransfer: %{time_starttransfer}\n
# --------------------\n
# time_total:        %{time_total}\n
```

---

## 八、数据备份操作

### 8.1 手动备份

```bash
# 导出数据库
pg_dump \
  -h db.xtqhjyiyjhxfdzyypfqq.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump

# 压缩备份
gzip backup_$(date +%Y%m%d).dump

# 上传到 S3
aws s3 cp backup_$(date +%Y%m%d).dump.gz s3://mdlooker-backups/database/
```

### 8.2 恢复数据

```bash
# 下载备份
aws s3 cp s3://mdlooker-backups/database/backup_20260420.dump.gz .

# 解压备份
gunzip backup_20260420.dump.gz

# 恢复数据库
pg_restore \
  -h db.xtqhjyiyjhxfdzyypfqq.supabase.co \
  -U postgres \
  -d postgres \
  -c \
  backup_20260420.dump
```

### 8.3 备份验证

```bash
# 运行备份验证脚本
./scripts/verify-backup.sh backup_20260420.dump.gz
```

---

## 九、监控和告警

### 9.1 监控 Dashboard

| 工具 | URL | 说明 |
|-----|-----|------|
| Vercel Analytics | https://vercel.com/analytics | 应用性能 |
| Sentry | https://sentry.io | 错误追踪 |
| Supabase Dashboard | https://supabase.com/dashboard | 数据库监控 |
| UptimeRobot | https://uptimerobot.com | 可用性监控 |

### 9.2 告警配置

#### 配置告警联系人

1. **Slack**: 配置 Webhook
2. **邮件**: 配置 SMTP
3. **短信**: 配置 Twilio

#### 告警阈值

| 指标 | 阈值 | 级别 |
|-----|------|------|
| 错误率 | > 5% | Critical |
| 响应时间 P95 | > 1000ms | Warning |
| 可用性 | < 99% | Critical |

---

## 十、成本优化

### 10.1 当前成本结构

| 服务 | 套餐 | 月度成本 |
|-----|------|---------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| AWS S3 | Pay-as-you-go | ~$1 |
| **总计** | - | **~$46/月** |

### 10.2 优化建议

1. **使用免费额度**: Vercel Hobby（个人项目）
2. **优化构建**: 减少构建时间和资源使用
3. **缓存策略**: 启用 CDN 缓存
4. **数据库优化**: 清理无用数据

---

## 十一、安全最佳实践

### 11.1 密钥管理

- ✅ 使用环境变量存储密钥
- ✅ 定期轮换密钥（每 90 天）
- ❌ 不要将密钥提交到 Git

### 11.2 访问控制

- ✅ 启用双因素认证
- ✅ 使用最小权限原则
- ✅ 定期审计访问日志

### 11.3 数据安全

- ✅ 启用 HTTPS
- ✅ 数据库加密
- ✅ 定期备份

---

## 十二、联系支持

### 内部支持

- **运维负责人**: AI 助手
- **技术负责人**: AI 助手
- **项目 Owner**: 项目负责人

### 外部支持

- **Vercel 支持**: https://vercel.com/support
- **Supabase 支持**: https://supabase.com/support
- **AWS 支持**: https://aws.amazon.com/support

---

## 附录

### A. 常用命令速查

```bash
# 部署
./scripts/deploy.sh

# 查看日志
vercel logs --prod

# 健康检查
curl https://ppe-platform.vercel.app/api/health

# 手动备份
./scripts/backup-database.sh

# 恢复数据
./scripts/restore-database.sh backup.dump.gz

# 运行测试
npm run test:ci

# 查看部署历史
vercel ls
```

### B. 相关文件位置

| 文件 | 路径 | 说明 |
|-----|------|------|
| CI/CD 配置 | `.github/workflows/ci-cd.yml` | 自动化部署 |
| 环境变量 | `.env.production` | 生产环境配置 |
| Vercel 配置 | `vercel.json` | Vercel 设置 |
| 部署脚本 | `scripts/deploy.sh` | 一键部署 |
| 备份脚本 | `scripts/backup-database.sh` | 数据库备份 |

---

*最后更新：2026-04-20*
*维护者：AI 助手（运维工程师）*

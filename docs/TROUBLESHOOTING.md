# 故障排查快速指南

## 快速诊断流程

### 第一步：确认故障现象（2 分钟）

```bash
# 1. 检查应用是否可访问
curl -I https://ppe-platform.vercel.app

# 2. 检查健康状态
curl https://ppe-platform.vercel.app/api/health

# 3. 查看响应时间
time curl https://ppe-platform.vercel.app
```

### 第二步：查看监控指标（3 分钟）

| 检查项 | 工具 | URL |
|-------|------|-----|
| 应用可用性 | UptimeRobot | https://uptimerobot.com |
| 错误追踪 | Sentry | https://sentry.io |
| 性能分析 | Vercel Analytics | https://vercel.com/analytics |
| 数据库状态 | Supabase | https://supabase.com/dashboard |

### 第三步：初步判断故障类型

```
应用完全不可用 → 检查 Vercel 状态、DNS 配置
部分功能异常 → 检查错误日志、API 状态
性能下降 → 检查数据库查询、网络延迟
数据异常 → 检查数据同步、数据库状态
```

---

## 常见故障速查

### 🔴 P0 - 应用完全不可用

**症状**: 网站打不开，所有用户无法访问

**快速处理**（5 分钟内）:
```bash
# 1. 检查 Vercel 状态
https://vercel.com/status

# 2. 尝试重新部署
vercel --prod --force

# 3. 如无效，回滚
vercel rollback

# 4. 联系支持
https://vercel.com/support
```

**可能原因**:
- Vercel 平台故障
- DNS 解析问题
- 部署失败

---

### 🟠 P1 - 核心功能异常

**症状**: 搜索、查询等核心功能无法使用

**快速处理**（30 分钟内）:
```bash
# 1. 查看错误日志
vercel logs --prod --level=error

# 2. 检查 Sentry 错误
https://sentry.io/organizations/mdlooker

# 3. 检查数据库连接
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT 1"

# 4. 重启服务（重新部署）
vercel --prod
```

**可能原因**:
- API 错误
- 数据库连接失败
- 第三方服务故障

---

### 🟡 P2 - 性能下降

**症状**: 页面加载慢，API 响应时间长

**快速处理**（2 小时内）:
```bash
# 1. 检查性能指标
https://vercel.com/analytics

# 2. 查看慢查询
# Supabase Dashboard → Database → Slow queries

# 3. 检查资源使用
# Vercel Dashboard → Resource Usage

# 4. 清理缓存
# 重新部署触发缓存刷新
vercel --prod --force
```

**可能原因**:
- 数据库慢查询
- 网络延迟
- 缓存失效

---

### 🟢 P3 - 轻微问题

**症状**: UI 显示异常、非核心功能问题

**快速处理**（24 小时内）:
```bash
# 1. 记录问题
# 截图、记录复现步骤

# 2. 创建 Issue
# GitHub Issues

# 3. 安排修复
# 加入待办任务池
```

---

## 工具速查

### 日志查看

```bash
# Vercel 实时日志
vercel logs --prod

# Vercel 错误日志
vercel logs --prod --level=error

# 最近 100 行
vercel logs --prod --lines=100

# 跟踪特定部署
vercel logs <DEPLOYMENT_ID>
```

### 性能测试

```bash
# Lighthouse 测试
lighthouse https://ppe-platform.vercel.app --view

# 使用 curl 测试响应时间
curl -w "@curl-format.txt" -o /dev/null -s https://ppe-platform.vercel.app

# 批量测试
ab -n 1000 -c 10 https://ppe-platform.vercel.app/
```

### 数据库诊断

```bash
# 测试连接
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT 1"

# 查看连接数
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 查看慢查询
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

## 升级流程

### 何时升级？

| 情况 | 操作 |
|-----|------|
| 故障超过 30 分钟未解决 | 通知技术负责人 |
| 影响核心业务 | 通知项目负责人 |
| 数据安全问题 | 立即通知所有人 |
| 需要外部支持 | 联系 Vercel/Supabase |

### 如何升级？

```
1. 准备故障信息
   - 故障现象
   - 影响范围
   - 已采取措施
   - 当前状态

2. 发送通知
   - Slack/钉钉/企业微信
   - 邮件
   - 电话（紧急情况）

3. 建立作战室
   - 共享屏幕
   - 实时同步进展
```

---

## 事后复盘

### 复盘模板

```markdown
## 故障报告

**故障 ID**: INC-YYYY-MM-XXX
**发生时间**: YYYY-MM-DD HH:MM
**恢复时间**: YYYY-MM-DD HH:MM
**持续时间**: X 小时 X 分钟
**影响范围**: [描述影响的用户和功能]

## 时间线

- HH:MM 故障发生
- HH:MM 故障发现
- HH:MM 开始处理
- HH:MM 找到原因
- HH:MM 实施修复
- HH:MM 故障恢复

## 根本原因

[详细描述根本原因]

## 处理过程

[描述采取的措施]

## 改进措施

- [ ] 措施 1
- [ ] 措施 2
- [ ] 措施 3

## 经验教训

[总结学到的经验]
```

---

## 快速联系

| 支持渠道 | 联系方式 | 响应时间 |
|---------|---------|---------|
| Vercel | https://vercel.com/support | 24 小时 |
| Supabase | https://supabase.com/support | 24 小时 |
| AWS | https://aws.amazon.com/support | 24 小时 |
| 内部团队 | Slack #incidents | 即时 |

---

*最后更新：2026-04-20*
*维护者：AI 助手（运维工程师）*

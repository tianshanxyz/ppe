# Vercel Token 快速获取指南（2025 最新版）

> ⏱️ **预计时间**：3 分钟
> 📅 **最后更新**：2026-04-20

---

## 🚀 快速步骤（3 分钟搞定）

### 第一步：登录 Vercel（30 秒）

1. 打开 https://vercel.com/dashboard
2. 点击 **Continue with GitHub**（或其他登录方式）
3. 完成登录

---

### 第二步：创建 Access Token（2 分钟）

#### 方法 A：直接链接（最快）

1. **直接访问 Tokens 页面**：
   ```
   https://vercel.com/account/tokens
   ```

2. **填写 Token 信息**：
   - **Name**: `MDLooker CI/CD`
   - **Scope**: 选择你的账号（下拉菜单）
   - **Expires In**: 选择 `1 Year` 或 `Never`

3. **点击 Create Token**

4. **立即复制 Token**
   - ⚠️ **只会显示一次！**
   - 格式类似：`Vercel_xxxxxxxxxxxxxxxxxxxxxxxx`

#### 方法 B：通过 Dashboard

1. 点击右上角 **头像图标**
2. 选择 **Account Settings**
3. 左侧菜单选择 **Tokens**
4. 填写信息并创建 Token
5. 复制 Token

---

### 第三步：添加到 GitHub（30 秒）

1. 打开你的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 填写：
   ```
   Name: VERCEL_TOKEN
   Value: [粘贴刚才复制的 Token]
   ```
5. 点击 **Add secret**

---

## ✅ 验证 Token

### 方法 1: 在线测试

```bash
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  https://api.vercel.com/v6/user/info
```

如果返回 JSON 用户信息，说明 Token 有效。

### 方法 2: 使用 CLI

```bash
# 安装 CLI
npm install -g vercel

# 设置 Token
export VERCEL_TOKEN=<YOUR_TOKEN>

# 测试
vercel ls
```

---

## 🔍 常见问题

### Q1: 找不到 Tokens 菜单？

**A**: 确保你使用的是正确的账号登录，并且有管理员权限。

### Q2: Token 创建后立即失效？

**A**: 检查是否：
- 选择了正确的 Scope（团队/个人）
- Token 没有过期
- 账号权限足够

### Q3: 需要配置 VERCEL_ORG_ID 吗？

**A**: 
- **个人账户**：不需要
- **团队账户**：需要，从 Team Settings 获取

### Q4: Token 应该设置多少有效期？

**A**: 
- **开发/测试**：30 天
- **生产环境**：1 年或永不过期
- **CI/CD**：建议 1 年，设置提醒定期轮换

---

## 📋 完整配置清单

配置 CI/CD 需要以下 3 个 Secrets：

| Secret | 必需 | 获取位置 |
|--------|------|----------|
| `VERCEL_TOKEN` | ✅ 必需 | https://vercel.com/account/tokens |
| `VERCEL_PROJECT_ID` | ✅ 必需 | Project Settings → General |
| `VERCEL_ORG_ID` | ⚠️ 可选 | Team Settings（仅团队账户） |

---

## 🔗 快速链接

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Tokens 页面](https://vercel.com/account/tokens)
- [REST API 文档](https://vercel.com/docs/rest-api)
- [GitHub Secrets 配置指南](./SECRETS_GUIDE.md)

---

## 💡 小贴士

1. **Token 安全**：
   - 不要将 Token 提交到 Git
   - 使用密码管理器保存
   - 定期轮换（建议每 90 天）

2. **权限最小化**：
   - 只为必要的团队创建 Token
   - 设置合适的过期时间
   - 定期检查 Token 使用情况

3. **故障恢复**：
   - 如果 Token 泄露，立即删除并重新创建
   - 在 Tokens 页面可以查看和管理所有 Token

---

*创建日期：2026-04-20*
*基于 Vercel 官方文档更新*

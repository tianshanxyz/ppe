# GitHub Actions Secrets 配置指南

## 必需配置的 Secrets

请在 GitHub 仓库的 `Settings > Secrets and variables > Actions` 中添加以下 Secrets：

### 1. Vercel 相关

| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `VERCEL_TOKEN` | Vercel API Token | 查看下方详细步骤 ✅ |
| `VERCEL_ORG_ID` | Vercel 组织 ID | Vercel Dashboard → 团队设置 |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID | Vercel Dashboard → 项目设置 |

### 2. Supabase 相关

| Secret 名称 | 说明 | 获取方式 |
|------------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | Supabase Dashboard → Settings → API |
| `SUPABASE_PROJECT_ID` | Supabase 项目 ID | Supabase Dashboard → Settings → General |
| `SUPABASE_ACCESS_TOKEN` | Supabase 访问令牌 | Supabase Dashboard → Settings → Account |
| `SUPABASE_DB_PASSWORD` | 数据库密码 | 创建项目时设置的密码 |

### 3. 应用配置

| Secret 名称 | 说明 | 示例值 |
|------------|------|--------|
| `NEXT_PUBLIC_APP_URL` | 生产环境 URL | `https://ppe-platform.vercel.app` |

## 配置步骤

### 步骤 1: 获取 Vercel Token（2025 最新版）✅

根据 Vercel 官方文档，创建 Access Token 的最新步骤如下：

#### 方法 A：通过 Dashboard 创建（推荐）

1. **登录 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard
   - 使用 GitHub/Google/GitLab 账号登录

2. **进入 Tokens 页面**
   - 点击右上角 **头像图标**
   - 在下拉菜单中选择 **Account Settings**
   - 或者直接访问：https://vercel.com/account/tokens

3. **创建 Access Token**
   - 在左侧边栏选择 **Tokens**
   - 找到 **Create Token** 区域
   - 输入 Token 名称（例如：`MDLooker CI/CD`）
   - **选择 Scope（团队）**：
     - 如果是个人账户：选择你的个人账号
     - 如果是团队账户：从下拉菜单选择对应的团队
   - **选择过期时间**：
     - 建议选择 **1 年** 或 **永不过期**（用于 CI/CD）
   - 点击 **Create Token** 按钮

4. **复制 Token**
   - ⚠️ **重要**：Token 只会显示一次！
   - 立即复制生成的 Token（格式类似：`<TOKEN_STRING>`）
   - 妥善保存，建议立即添加到密码管理器

5. **添加到 GitHub Secrets**
   ```
   GitHub 仓库 → Settings → Secrets and variables → Actions
   → New repository secret
   Name: VERCEL_TOKEN
   Value: [粘贴刚才复制的 Token]
   ```

#### 方法 B：通过 Vercel CLI 创建

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 创建 Access Token
vercel tokens create

# 4. 查看已创建的 Token
vercel tokens ls
```

#### 验证 Token 是否有效

```bash
# 测试 Token
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  https://api.vercel.com/v6/user/info

# 如果返回用户信息，说明 Token 有效
```

---

### 步骤 2: 获取 Vercel 组织 ID 和项目 ID

#### 获取项目 ID

1. **登录 Vercel Dashboard**
   - 访问：https://vercel.com/dashboard

2. **选择项目**
   - 点击你的项目（例如：`ppe-platform`）

3. **进入项目设置**
   - 点击顶部导航栏的 **Settings**

4. **找到 Project ID**
   - 在 **General** 页面
   - 滚动到页面底部
   - 找到 **Project ID** 字段
   - 点击复制按钮复制 ID
   - 添加到 GitHub Secrets：`VERCEL_PROJECT_ID`

#### 获取组织 ID（Team ID）

**如果是个人账户**：
- 个人账户通常不需要配置 `VERCEL_ORG_ID`
- 可以在 CI/CD 工作流中留空或移除相关配置

**如果是团队账户**：
1. 在 Vercel Dashboard 点击右上角 **头像**
2. 选择 **Team Settings**（或访问：https://vercel.com/<YOUR_TEAM>/~/settings）
3. 在 **General** 页面找到 **Team ID**
4. 复制并添加到 GitHub Secrets：`VERCEL_ORG_ID`

#### 快速查看项目信息

```bash
# 使用 Vercel CLI 查看项目信息
vercel ls

# 输出示例：
# ✔  Ready!  [2s]
#  ppe-platform [username]
#  - Production:  https://ppe-platform.vercel.app
#  Project ID: prj_xxxxxxxxxxxxx
```

### 步骤 3: 获取 Supabase 密钥

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目
3. 进入 **Settings** → **API**
4. 复制以下值：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`（⚠️ 保密）

### 步骤 4: 获取 Supabase 项目 ID 和访问令牌

1. 在 Supabase Dashboard 进入 **Settings** → **General**
2. 复制 **Project ID** → `SUPABASE_PROJECT_ID`
3. 进入 **Settings** → **Account**
4. 创建或复制 **Access Token** → `SUPABASE_ACCESS_TOKEN`

## 验证配置

配置完成后，运行以下命令验证：

```bash
# 在本地测试 GitHub Actions 工作流
act -s VERCEL_TOKEN=your_token -s VERCEL_ORG_ID=your_org_id ...
```

或者触发一次小的代码提交，检查 GitHub Actions 是否正常运行。

## 安全注意事项

1. ⚠️ **永远不要**将 Secrets 提交到代码仓库
2. 定期轮换 Secrets（建议每 90 天）
3. 使用最小权限原则：
   - Vercel Token 只授予当前项目权限
   - Supabase service_role_key 仅在必要时使用
4. 监控 Secrets 使用情况，发现异常立即撤销

## 故障排查

### 问题：部署失败，提示 "Missing secrets"

**解决方案**：
1. 检查 Secrets 名称是否完全匹配（区分大小写）
2. 确认 Secrets 已添加到正确的仓库
3. 检查 GitHub Actions 权限设置

### 问题：Vercel 部署成功但环境变量未生效

**解决方案**：
1. 在 Vercel Dashboard 检查环境变量配置
2. 确认工作流中正确传递了环境变量
3. 重新部署使环境变量生效

## 参考链接

- [GitHub Actions Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI 认证](https://vercel.com/docs/cli/getting-started-with-vercel-for-github)
- [Supabase API 文档](https://supabase.com/docs/reference/javascript/introduction)

---

*最后更新：2026-04-20*

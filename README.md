# MDLooker - 全球PPE合规平台

**版本**: 1.0.0  
**创建日期**: 2026-04-19  
**状态**: 生产就绪

---

## 🎯 项目定位

MDLooker 是一个专注于**个人防护装备（PPE）出口合规**的全球信息平台，为PPE制造商和出口商提供：

- ✅ **免费合规检查工具** - 60秒获取CE/FDA/UKCA认证要求
- 📊 **产品数据库** - 浏览全球PPE产品认证信息
- 🏭 **制造商目录** - 查找验证的PPE供应商
- 🌍 **市场准入指南** - 各国合规要求详解
- 📈 **市场统计分析** - 数据驱动的市场洞察

> **注意**: 平台目前聚焦PPE领域，未来计划扩展至医疗器械合规服务。

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm start
```

### 部署到Vercel

```bash
vercel --prod
```

---

## 📁 项目结构

```
ppe-platform/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 首页 - PPE合规检查工具
│   │   ├── layout.tsx         # 根布局
│   │   ├── ppe/               # PPE功能模块
│   │   │   ├── products/      # 产品数据库
│   │   │   ├── manufacturers/ # 制造商目录
│   │   │   ├── market-access/ # 市场准入
│   │   │   ├── certification-comparison/ # 认证对比
│   │   │   ├── regulations/   # 法规库
│   │   │   ├── statistics/    # 市场统计
│   │   │   └── pricing/       # 定价页面
│   │   ├── auth/              # 认证页面
│   │   ├── about/             # 关于我们
│   │   ├── help/              # 帮助中心
│   │   ├── privacy/           # 隐私政策
│   │   └── terms/             # 服务条款
│   ├── components/            # React组件
│   │   ├── layouts/           # 布局组件
│   │   │   ├── Header.tsx     # 导航栏
│   │   │   └── Footer.tsx     # 页脚
│   │   ├── ppe/               # PPE相关组件
│   │   │   └── ComplianceCheckTool.tsx  # 合规检查工具
│   │   └── ui/                # UI组件库
│   ├── lib/                   # 工具库
│   │   ├── ppe-data.ts        # PPE数据服务
│   │   ├── ppe-database-client.ts  # 数据库客户端
│   │   └── supabase/          # Supabase配置
│   ├── data/                  # 静态数据
│   │   └── ppe/               # PPE相关数据
│   └── styles/                # 样式文件
├── public/                    # 静态资源
├── docs/                      # 文档
├── data/                      # 数据文件
└── package.json
```

---

## 🎨 设计系统

### 品牌色彩

与 [h-guardian.com](https://h-guardian.com) 保持一致：

```css
/* 主色调 - Shield Teal */
--primary: #339999;
--primary-dark: #2D8585;
--primary-light: #57B9B9;

/* 辅助色 */
--accent: #F59E0B;
--accent-light: #FBBF24;

/* 功能色 */
--success: #10B981;  /* 合规通过 */
--warning: #F59E0B;  /* 需要注意 */
--danger: #EF4444;   /* 不合规 */
```

### 字体

- **主字体**: system-ui, -apple-system, sans-serif
- **标题**: font-bold, tracking-tight

---

## 🔧 核心功能

### 1. 合规检查工具
- 选择PPE产品类别（口罩、防护服、手套等）
- 选择目标市场（欧盟、美国、英国、中东等）
- 即时生成合规要求报告

### 2. 产品数据库
- 浏览51+ PPE产品
- 查看详细认证信息
- 搜索和筛选功能

### 3. 制造商目录
- 全球验证的PPE制造商
- 公司档案和认证信息
- 联系方式

### 4. 市场准入
- 各国合规要求详解
- 认证流程指南
- 成本和时间估算

### 5. 认证对比
- CE vs FDA vs UKCA vs NMPA
- 并排对比认证要求
- 成本和时间差异分析

---

## 🛠 技术栈

- **框架**: Next.js 16.2.4 + React 19
- **语言**: TypeScript 5.8.2
- **样式**: Tailwind CSS 4.1.4
- **UI组件**: shadcn/ui
- **数据库**: Supabase
- **部署**: Vercel

---

## 📋 环境变量

创建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 可选：AI服务
ALIBABA_BAILIAN_API_KEY=your_api_key
```

---

## 📝 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 组件使用函数式编程
- 遵循 ESLint 和 Prettier 配置

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

---

## 🚀 部署检查清单

- [ ] 环境变量已配置
- [ ] Supabase数据库已设置
- [ ] 域名已配置
- [ ] SSL证书已启用
- [ ] SEO元数据已更新
- [ ] 分析工具已集成

---

## 📞 支持

- **邮箱**: support@mdlooker.com
- **文档**: https://docs.mdlooker.com
- **GitHub**: https://github.com/tianshanxyz/ppe

---

**© 2024 MDLooker. All rights reserved.**

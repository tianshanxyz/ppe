# PPE Platform Backend - 快速启动指南

## 第一步：克隆与安装

```bash
# 进入项目目录
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/mdlooker-v5/team-shared/PPE-PLATFORM/backend/ppe-backend

# 安装所有依赖
npm install
```

## 第二步：配置环境

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置你的数据库和其他服务
# 至少需要配置：
# - DATABASE_HOST
# - DATABASE_PASSWORD
# - JWT_SECRET
```

## 第三步：初始化数据库

### 方式 1: 使用 SQL 脚本

```bash
# 连接 PostgreSQL
psql -h localhost -U postgres

# 执行初始化脚本
\i database/init.sql
```

### 方式 2: 使用 TypeORM 自动同步（仅开发环境）

在 `.env` 中设置：
```env
NODE_ENV=development
```

TypeORM 会自动创建表结构。

## 第四步：启动服务

### 开发模式（推荐）

```bash
# 启动开发服务器（支持热重载）
npm run start:dev

# 或者使用调试模式
npm run start:debug
```

### 生产模式

```bash
# 编译项目
npm run build

# 启动生产服务器
npm run start:prod
```

## 第五步：验证服务

### 访问 API

```bash
# 健康检查
curl http://localhost:3000

# 查看 API 文档
# 浏览器访问：http://localhost:3000/api/docs

# 查看监控指标
curl http://localhost:3000/metrics

# 查看日志
curl http://localhost:3000/api/v1/logs
```

## 常见问题

### 1. 端口被占用

错误信息：`Error: listen EADDRINUSE: address already in use :::3000`

解决方法：
```bash
# 方法 1: 修改端口
# 在 .env 中设置 PORT=3001

# 方法 2: 关闭占用端口的进程
lsof -ti:3000 | xargs kill
```

### 2. 数据库连接失败

错误信息：`Error: connect ECONNREFUSED`

解决方法：
```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 启动 PostgreSQL（macOS）
brew services start postgresql

# 检查 .env 配置是否正确
```

### 3. Redis 连接失败

错误信息：`Error: connect ECONNREFUSED 127.0.0.1:6379`

解决方法：
```bash
# 启动 Redis（macOS）
brew services start redis

# 或者临时禁用 Redis
# 在 .env 中设置 REDIS_HOST=
```

## 开发工作流

### 1. 创建新模块

```bash
# 使用 NestJS CLI
nest generate module users
nest generate controller users
nest generate service users
```

### 2. 编写代码

- 遵循 TypeScript 严格模式
- 使用 ESLint + Prettier 格式化代码
- 编写单元测试

### 3. 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:cov

# 运行 E2E 测试
npm run test:e2e
```

### 4. 代码检查

```bash
# 运行 ESLint
npm run lint

# 格式化代码
npm run format
```

### 5. 提交代码

```bash
# 添加更改
git add .

# 提交（使用语义化提交信息）
git commit -m "feat: add user authentication module"

# 推送到远程
git push
```

## 项目结构说明

```
src/
├── auth/              # 认证模块（待开发）
├── users/             # 用户管理（待开发）
├── permissions/       # 权限管理（待开发）
├── ppe/               # PPE 数据（待开发）
├── regulations/       # 法规数据（待开发）
├── companies/         # 企业数据（待开发）
├── alerts/            # 预警系统（待开发）
├── logs/              # 日志系统 ✅ 已完成
├── metrics/           # 监控指标 ✅ 已完成
├── tasks/             # 任务调度（待开发）
├── app.module.ts      # 根模块
├── app.controller.ts  # 根控制器
├── app.service.ts     # 根服务
└── main.ts            # 入口文件
```

## API 端点

### 已实现

- `GET /api/v1/logs` - 查询日志
- `GET /metrics` - Prometheus 指标

### 待实现

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/ppe` - 搜索 PPE 数据
- `GET /api/v1/regulations` - 搜索法规
- `GET /api/v1/companies` - 搜索企业
- `GET /api/v1/alerts` - 获取预警列表

## 下一步

1. **完成 BE-002**: 实现用户认证模块
2. **完成 BE-003**: 实现权限管理模块
3. **数据库初始化**: 执行 `database/init.sql`
4. **编写测试**: 为核心模块编写单元测试

## 获取帮助

- 查看 [README.md](./README.md) 获取完整文档
- 查看 [BE-001_COMPLETION_REPORT.md](./BE-001_COMPLETION_REPORT.md) 了解任务详情
- 访问 Swagger 文档：http://localhost:3000/api/docs

---

**祝开发愉快！** 🚀

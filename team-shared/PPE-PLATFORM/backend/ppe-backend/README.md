# PPE Platform Backend

全球 PPE 数据平台后端服务

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + TypeORM
- **缓存**: Redis
- **消息队列**: Bull
- **认证**: JWT + Passport
- **日志**: Winston
- **监控**: Prometheus
- **文档**: Swagger/OpenAPI

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和其他服务连接信息
```

### 3. 启动服务

#### 开发模式

```bash
npm run start:dev
```

#### 生产模式

```bash
npm run build
npm run start:prod
```

### 4. 访问 API 文档

启动服务后，访问：http://localhost:3000/api/docs

## 项目结构

```
src/
├── auth/              # 认证模块
├── users/             # 用户管理模块
├── permissions/       # 权限管理模块
├── ppe/               # PPE 数据模块
├── regulations/       # 法规数据模块
├── companies/         # 企业数据模块
├── alerts/            # 预警系统模块
├── logs/              # 日志系统模块
├── metrics/           # 监控指标模块
├── tasks/             # 任务调度模块
├── common/            # 公共模块
├── config/            # 配置模块
├── app.module.ts      # 根模块
└── main.ts            # 入口文件
```

## 核心功能

### 认证与权限

- JWT 认证
- 用户注册/登录
- RBAC 权限模型
- 资源级权限控制

### 数据管理

- PPE 数据采集
- 企业数据管理
- 法规数据管理
- 数据质量管理

### 预警系统

- 规则引擎
- 实时监控
- 多级预警
- 通知服务

### 监控与日志

- Winston 日志
- Prometheus 指标
- 性能监控
- 错误追踪

## API 端点

### 认证相关

- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新 Token
- `POST /api/v1/auth/logout` - 用户登出

### 用户管理

- `GET /api/v1/users` - 获取用户列表
- `GET /api/v1/users/:id` - 获取用户详情
- `PATCH /api/v1/users/:id` - 更新用户
- `DELETE /api/v1/users/:id` - 删除用户

### PPE 数据

- `GET /api/v1/ppe` - 搜索 PPE 数据
- `GET /api/v1/ppe/:id` - 获取 PPE 详情
- `POST /api/v1/ppe` - 创建 PPE 记录
- `PATCH /api/v1/ppe/:id` - 更新 PPE 记录
- `DELETE /api/v1/ppe/:id` - 删除 PPE 记录

### 监控

- `GET /api/v1/metrics` - Prometheus 格式指标
- `GET /api/v1/logs` - 查询日志

## 开发规范

### 代码规范

- 遵循 ESLint + Prettier 配置
- 使用 TypeScript 严格模式
- 遵循 NestJS 最佳实践

### 测试规范

- 单元测试覆盖率 ≥ 80%
- 关键业务逻辑必须编写测试
- E2E 测试覆盖核心流程

### Git 规范

- 使用语义化提交信息
- 功能开发使用 feature 分支
- 代码审查通过后方可合并

## 部署

### Docker 部署

```bash
docker-compose up -d
```

### 环境变量

生产环境需要配置以下环境变量：

- `NODE_ENV=production`
- `DATABASE_HOST` - 数据库主机
- `DATABASE_PASSWORD` - 数据库密码
- `JWT_SECRET` - JWT 密钥
- `REDIS_HOST` - Redis 主机

## 性能优化

- 数据库查询优化
- Redis 缓存策略
- API 响应压缩
- 并发处理优化

## 安全加固

- SQL 注入防护
- XSS 攻击防护
- CSRF 防护
- 速率限制
- 输入验证

## 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否运行
   - 验证连接配置是否正确

2. **Redis 连接失败**
   - 检查 Redis 服务状态
   - 验证 Redis 配置

3. **JWT 认证失败**
   - 检查 JWT_SECRET 配置
   - 验证 Token 是否过期

## 联系方式

- 项目仓库：[GitHub](https://github.com/mdlooker/ppe-platform)
- 问题反馈：[Issues](https://github.com/mdlooker/ppe-platform/issues)

## 许可证

MIT License

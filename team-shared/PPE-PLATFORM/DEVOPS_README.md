# 🛠️ 运维部署工程师工作指南 - 全球 PPE 数据平台

**负责人**: Maxiao  
**创建时间**: 2026-04-18  
**最后更新**: 2026-04-18  

---

## 📋 快速导航

### 核心文档
- 📋 [任务清单](./tasks-devops.md) - 完整的运维任务列表
- 📝 [任务认领报告](./DEVOPS_TASK_CLAIM.md) - 任务认领详情
- 📊 [认领总结](./DEVOPS_TASK_CLAIM_SUMMARY.md) - 认领工作总结
- 📓 [OP-001 执行日志](./OP-001_EXECUTION_LOG.md) - OP-001 任务执行记录

### 技术文档
- 📖 [开发环境搭建指南](./docs/DEV_ENV_SETUP.md) - 完整的开发环境配置教程
- 🐳 [Docker Compose 配置](./docker-compose.dev.yml) - 一键启动开发环境

### 脚本工具
- 🔍 [环境验证脚本](./scripts/verify-env.sh) - 自动化验证开发环境

---

## 🎯 任务概览

### Phase 1: 基础架构搭建 (W1-W4)

| 任务 | 优先级 | 工时 | 截止时间 | 状态 |
|------|--------|------|----------|------|
| **OP-001**: 搭建开发环境 | P0 | 16h | W1 (04-25) | 🟡 进行中 |
| **OP-002**: Docker 容器化配置 | P0 | 24h | W3 (05-09) | ⚪ 未开始 |
| **OP-003**: CI/CD 流水线搭建 | P0 | 24h | W3 (05-09) | ⚪ 未开始 |

### 后续阶段

| 阶段 | 任务数 | 总工时 | 状态 |
|------|--------|--------|------|
| Phase 2: 数据采集系统 | 1 | 16h | ⚪ 未开始 |
| Phase 3: 数据治理系统 | 1 | 16h | ⚪ 未开始 |
| Phase 6: 测试与优化 | 1 | 16h | ⚪ 未开始 |
| Phase 7: 上线部署 | 3 | 96h | ⚪ 未开始 |
| **总计** | **9** | **152h** | **🟡 进行中** |

---

## 🚀 快速开始

### 第一步：认领任务

1. 打开 [任务清单](./tasks-devops.md)
2. 在对应任务后填写：
   - 认领人：Maxiao
   - 开始日期：2026-04-18
   - 状态：🟡 进行中

### 第二步：阅读文档

**必读文档**:
1. [开发环境搭建指南](./docs/DEV_ENV_SETUP.md)
2. [OP-001 执行日志](./OP-001_EXECUTION_LOG.md)
3. [任务认领报告](./DEVOPS_TASK_CLAIM.md)

### 第三步：开始执行

**OP-001 任务流程**:
```bash
# 1. 安装 Docker Desktop
# 访问：https://www.docker.com/products/docker-desktop/

# 2. 验证 Docker 安装
docker --version
docker compose version

# 3. 启动开发环境
cd team-shared/PPE-PLATFORM
docker compose -f docker-compose.dev.yml up -d

# 4. 验证环境
./scripts/verify-env.sh
```

---

## 📦 开发环境架构

### 技术栈

```
┌─────────────────────────────────────────┐
│         开发环境服务架构                  │
├─────────────────────────────────────────┤
│                                         │
│  应用层                                  │
│  ┌───────────┐  ┌──────────┐            │
│  │ Node.js   │  │  前端    │            │
│  │   v20     │  │  Vue 3   │            │
│  └───────────┘  └──────────┘            │
│                                         │
│  数据层                                  │
│  ┌───────────┐  ┌──────────┐            │
│  │PostgreSQL │  │  Redis   │            │
│  │   v15     │  │   v7     │            │
│  └───────────┘  └──────────┘            │
│                                         │
│  搜索层                                  │
│  ┌───────────┐  ┌──────────┐            │
│  │Elasticsearch      │  │  Kibana  │   │
│  │   v8.11           │  │  v8.11   │   │
│  └───────────┘  └──────────┘            │
│                                         │
│  工具层                                  │
│  ┌───────────┐  ┌──────────┐            │
│  │  pgAdmin  │  │  Redis   │            │
│  │           │  │Commander │            │
│  └───────────┘  └──────────┘            │
│                                         │
└─────────────────────────────────────────┘
```

### 服务端口

| 服务 | 端口 | 访问地址 |
|------|------|----------|
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Elasticsearch | 9200 | http://localhost:9200 |
| Kibana | 5601 | http://localhost:5601 |
| pgAdmin | 5050 | http://localhost:5050 |
| Redis Commander | 8081 | http://localhost:8081 |

---

## 📝 日常工作流程

### 每日站会

**时间**: 每日 09:30  
**模板**:
```markdown
日期：YYYY-MM-DD
姓名：Maxiao

【昨日完成】
- 

【今日计划】
- 

【需要支持】
- 

【备注】
- 
```

### 环境检查

**每日检查**:
```bash
# 1. 检查 Docker 容器状态
docker ps

# 2. 查看资源使用
docker stats

# 3. 查看服务日志
docker compose -f docker-compose.dev.yml logs -f

# 4. 运行环境验证
./scripts/verify-env.sh
```

### 文档更新

**更新频率**: 每日站会后  
**更新内容**:
- 任务进度
- 执行日志
- 遇到的问题
- 解决方案

---

## 🔧 常用命令

### Docker 相关

```bash
# 启动所有服务
docker compose -f docker-compose.dev.yml up -d

# 停止所有服务
docker compose -f docker-compose.dev.yml down

# 重启服务
docker compose -f docker-compose.dev.yml restart

# 查看日志
docker compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.dev.yml logs postgres

# 进入容器
docker exec -it ppe-postgres bash
docker exec -it ppe-redis bash
docker exec -it ppe-elasticsearch bash

# 清理所有数据（谨慎使用）
docker compose -f docker-compose.dev.yml down -v
```

### Node.js 相关

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 运行测试
npm test
```

---

## ⚠️ 常见问题

### Q1: Docker Desktop 启动失败

**解决方案**:
```bash
# macOS 重置 Docker
rm -rf ~/Library/Containers/com.docker.docker
# 重启 Docker Desktop
```

### Q2: PostgreSQL 连接失败

**解决方案**:
```bash
# 检查容器状态
docker ps | grep postgres

# 查看日志
docker logs ppe-postgres

# 重启容器
docker restart ppe-postgres
```

### Q3: 环境验证失败

**解决方案**:
```bash
# 运行详细验证
./scripts/verify-env.sh

# 根据错误信息修复
# 参考：docs/DEV_ENV_SETUP.md 常见问题章节
```

---

## 📊 进度追踪

### 当前进度

- **总体完成度**: 25%
- **文档编写**: 100% ✅
- **Docker 安装**: 0% ⏳
- **基础服务**: 0% ⏳
- **环境验证**: 0% ⏳

### 本周计划 (W1: 04-18 ~ 04-25)

| 日期 | 任务 | 状态 |
|------|------|------|
| 04-18 | 文档编写 | ✅ 完成 |
| 04-19 | Docker 安装 | ⏳ 待开始 |
| 04-20 | 基础服务部署 | ⏳ 待开始 |
| 04-21 | Node.js 安装 | ⏳ 待开始 |
| 04-22 | 环境联调测试 | ⏳ 待开始 |
| 04-23 | 文档完善 | ⏳ 待开始 |
| 04-24 | 验收交付 | ⏳ 待开始 |

---

## 📞 联系方式

- **负责人**: Maxiao
- **邮箱**: devops@mdlooker.com
- **GitHub**: @tianshanxyz

---

## 🔗 相关链接

### 项目文档
- [项目实施方案](./GLOBAL_PPE_PLATFORM_IMPLEMENTATION_PLAN.md)
- [里程碑追踪表](./milestone-tracker.md)
- [项目启动通知](./PROJECT_LAUNCH_NOTIFICATION.md)

### 技术文档
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Node.js 官方文档](https://nodejs.org/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Redis 文档](https://redis.io/docs/)
- [Elasticsearch 文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)

---

## ✅ 承诺

作为运维部署工程师，我承诺：

1. **按时交付**: 确保所有任务按截止日期完成
2. **质量保证**: 提供稳定、可靠、文档完整的运维方案
3. **主动沟通**: 及时同步进展，遇到问题立即上报
4. **持续优化**: 不断改进部署流程和运维效率

---

**文档状态**: 🟡 编写中  
**最后更新**: 2026-04-18  
**下次更新**: Docker 安装完成后

---

*全力以赴，确保 PPE 平台顺利部署上线！* 🚀

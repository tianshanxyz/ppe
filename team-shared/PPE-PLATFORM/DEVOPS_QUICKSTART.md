# 🚀 运维部署快速入门 - 全球 PPE 数据平台

**适合人群**: 新加入的运维部署工程师  
**创建时间**: 2026-04-18  
**最后更新**: 2026-04-18  
**当前负责人**: Maxiao

---

## 🎯 5 分钟快速开始

### 第一步：了解项目（2 分钟）

1. **阅读项目概况**
   - 📖 [项目 README](./README.md) - 了解项目整体
   - 📖 [实施方案](./GLOBAL_PPE_PLATFORM_IMPLEMENTATION_PLAN.md) - 了解项目目标

2. **查看任务清单**
   - 📋 [运维任务清单](./tasks-devops.md) - 查看所有运维任务
   - 📊 [里程碑追踪](./milestone-tracker.md) - 了解项目进度

### 第二步：认领任务（1 分钟）

1. 打开 [运维任务清单](./tasks-devops.md)
2. 在对应任务后填写：
   ```markdown
   - **认领人**: 你的名字
   - **开始日期**: YYYY-MM-DD
   - **状态**: 🟡 进行中
   ```

3. 提交 Git：
   ```bash
   git add team-shared/PPE-PLATFORM/tasks-devops.md
   git commit -m "feat: 认领运维任务 OP-XXX"
   git push origin main
   ```

### 第三步：开始工作（2 分钟）

1. **阅读工作指南**
   - 📖 [DEVOPS_README.md](./DEVOPS_README.md) - 运维工作完整指南

2. **搭建开发环境**
   - 📖 [DEV_ENV_SETUP.md](./docs/DEV_ENV_SETUP.md) - 环境搭建详细教程

3. **使用工具脚本**
   - 🔧 [verify-env.sh](./scripts/verify-env.sh) - 环境验证脚本

---

## 📚 文档导航

### 🎓 新手必读（按顺序阅读）

1. **[项目 README](./README.md)** ⭐⭐⭐⭐⭐
   - 项目概况、团队角色、技术栈

2. **[运维任务清单](./tasks-devops.md)** ⭐⭐⭐⭐⭐
   - 所有运维任务、优先级、截止时间

3. **[DEVOPS_README.md](./DEVOPS_README.md)** ⭐⭐⭐⭐⭐
   - 运维工作完整指南、常用命令、工作流程

4. **[开发环境搭建](./docs/DEV_ENV_SETUP.md)** ⭐⭐⭐⭐
   - Docker、Node.js、开发工具安装

5. **[任务认领报告](./DEVOPS_TASK_CLAIM.md)** ⭐⭐⭐
   - 任务认领详情、承诺

### 📖 技术文档

#### 环境配置
- **[DEV_ENV_SETUP.md](./docs/DEV_ENV_SETUP.md)** - 开发环境搭建完整教程
- **[docker-compose.dev.yml](./docker-compose.dev.yml)** - Docker Compose 配置
- **[scripts/verify-env.sh](./scripts/verify-env.sh)** - 环境验证脚本

#### 工作指南
- **[DEVOPS_README.md](./DEVOPS_README.md)** - 运维工作完整指南
- **[OP-001_EXECUTION_LOG.md](./OP-001_EXECUTION_LOG.md)** - OP-001 执行日志
- **[DEVOPS_TASK_CLAIM_SUMMARY.md](./DEVOPS_TASK_CLAIM_SUMMARY.md)** - 任务认领总结

#### 报告文档
- **[DEVOPS_TASK_CLAIM.md](./DEVOPS_TASK_CLAIM.md)** - 任务认领报告
- **[DEVOPS_TASK_CLAIM_COMPLETE.md](./DEVOPS_TASK_CLAIM_COMPLETE.md)** - 完成报告

---

## 🛠️ 快速命令参考

### Docker 相关

```bash
# 启动所有服务
docker compose -f docker-compose.dev.yml up -d

# 停止所有服务
docker compose -f docker-compose.dev.yml down

# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.dev.yml logs -f

# 进入容器
docker exec -it ppe-postgres bash
docker exec -it ppe-redis bash
docker exec -it ppe-elasticsearch bash
```

### 环境验证

```bash
# 运行环境验证
./scripts/verify-env.sh

# 查看详细输出
./scripts/verify-env.sh -v
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

## 📋 任务清单速查

### Phase 1: 基础架构搭建 (W1-W4)

| 任务 | 优先级 | 工时 | 截止 | 状态 | 负责人 |
|------|--------|------|------|------|--------|
| **OP-001**: 搭建开发环境 | P0 | 16h | W1 | 🟡 进行中 | Maxiao |
| **OP-002**: Docker 容器化配置 | P0 | 24h | W3 | ⚪ | Maxiao |
| **OP-003**: CI/CD 流水线搭建 | P0 | 24h | W3 | ⚪ | Maxiao |

### 后续阶段

- **OP-004**: 采集器部署 (Phase 2, W5)
- **OP-005**: 数据库备份配置 (Phase 3, W11)
- **OP-006**: 部署演练 (Phase 6, W21)
- **OP-007**: 生产环境部署 (Phase 7, W23)
- **OP-008**: 数据迁移 (Phase 7, W23)
- **OP-009**: 监控值守 (Phase 7, W24)

---

## 🔧 开发环境服务

### 服务端口速查

| 服务 | 端口 | 访问地址 | 用途 |
|------|------|----------|------|
| **PostgreSQL** | 5432 | localhost:5432 | 主数据库 |
| **Redis** | 6379 | localhost:6379 | 缓存服务 |
| **Elasticsearch** | 9200 | http://localhost:9200 | 搜索引擎 |
| **Kibana** | 5601 | http://localhost:5601 | ES 可视化 |
| **pgAdmin** | 5050 | http://localhost:5050 | DB 管理工具 |
| **Redis Commander** | 8081 | http://localhost:8081 | Redis 管理 |

### 默认账号

**PostgreSQL**:
- 用户名：`ppe_dev`
- 密码：`ppe_dev_password_2026`
- 数据库：`ppe_platform`

**Redis**:
- 密码：`ppe_redis_password_2026`

**pgAdmin**:
- 邮箱：`admin@ppe-platform.local`
- 密码：`admin`

---

## ⚠️ 常见问题速查

### Q1: Docker 未安装

**解决**: 访问 https://www.docker.com/products/docker-desktop/ 下载安装

### Q2: 容器启动失败

**解决**:
```bash
# 查看容器状态
docker ps -a

# 查看日志
docker logs <container-name>

# 重启容器
docker restart <container-name>
```

### Q3: 环境验证失败

**解决**:
```bash
# 运行详细验证
./scripts/verify-env.sh

# 查看错误信息
# 根据提示修复
```

### Q4: 数据库连接失败

**解决**:
```bash
# 检查 PostgreSQL 容器
docker ps | grep postgres

# 查看日志
docker logs ppe-postgres

# 重启容器
docker restart ppe-postgres
```

---

## 📞 联系与支持

### 团队联系方式

- **负责人**: Maxiao
- **邮箱**: devops@mdlooker.com
- **GitHub**: @tianshanxyz

### 沟通渠道

- **即时通讯**: [待指定]
- **邮件群组**: [待指定]
- **文档协作**: GitHub
- **代码仓库**: GitHub

---

## 📊 工作进度

### 当前状态

- **任务认领**: ✅ 9/9 (100%)
- **文档编写**: ✅ 10/10 (100%)
- **OP-001**: 🟡 25% 进行中
- **总体进度**: 🟡 25%

### 今日完成 (2026-04-18)

- ✅ 任务清单更新
- ✅ 环境搭建指南编写
- ✅ Docker Compose 配置
- ✅ 环境验证脚本开发
- ✅ Git 提交

### 明日计划 (2026-04-19)

- [ ] 安装 Docker Desktop
- [ ] 配置镜像加速器
- [ ] 验证 Docker 安装

---

## 🎯 下一步行动

### 立即执行

1. **阅读文档**: [DEVOPS_README.md](./DEVOPS_README.md)
2. **搭建环境**: 按照 [DEV_ENV_SETUP.md](./docs/DEV_ENV_SETUP.md) 操作
3. **验证环境**: 运行 `./scripts/verify-env.sh`

### 本周重点

- **OP-001**: 搭建开发环境（截止：W1 结束）
- **OP-002**: Docker 容器化配置（截止：W3 结束）
- **OP-003**: CI/CD 流水线搭建（截止：W3 结束）

---

## 🔗 相关链接

### 项目文档
- [项目 README](./README.md)
- [实施方案](./GLOBAL_PPE_PLATFORM_IMPLEMENTATION_PLAN.md)
- [里程碑追踪](./milestone-tracker.md)

### 技术文档
- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Redis](https://redis.io/docs/)
- [Elasticsearch](https://www.elastic.co/guide/)

---

## ✅ 检查清单

### 入职第一天

- [ ] 阅读项目 README
- [ ] 阅读运维任务清单
- [ ] 认领任务
- [ ] 阅读 DEVOPS_README.md
- [ ] 开始搭建开发环境

### 入职第一周

- [ ] 完成开发环境搭建
- [ ] 通过环境验证
- [ ] 熟悉项目结构
- [ ] 开始 OP-002 任务

---

**文档状态**: ✅ 已完成  
**最后更新**: 2026-04-18  
**维护人**: Maxiao

---

*欢迎加入 PPE 平台运维团队！* 🚀  
*如有问题，请随时联系负责人或查阅相关文档。*

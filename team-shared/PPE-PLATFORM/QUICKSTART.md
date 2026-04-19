# 🚀 PPE 平台快速启动指南

**最后更新**: 2026-04-19  
**适用环境**: macOS (Apple Silicon M1/M2/M3)

---

## ⚡ 5 分钟快速启动

### 前提条件

- ✅ Docker Desktop 已安装并运行
- ✅ 至少 5GB 可用磁盘空间
- ✅ 至少 4GB 可用内存

### 快速启动命令

```bash
# 1. 进入项目目录
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/mdlooker-v5/team-shared/PPE-PLATFORM

# 2. 启动所有核心服务
docker compose -f docker-compose.dev-core.yml up -d

# 3. 查看服务状态
docker compose -f docker-compose.dev-core.yml ps

# 4. 验证服务
echo "=== PostgreSQL ==="
docker compose -f docker-compose.dev-core.yml exec postgres psql -U ppe_dev -d ppe_platform -c "SELECT version();"

echo "=== Redis ==="
docker compose -f docker-compose.dev-core.yml exec redis redis-cli -a ppe_redis_password_2026 ping

echo "=== Elasticsearch ==="
curl -X GET "http://localhost:9200/_cluster/health?pretty"

echo "=== Kibana ==="
curl -X GET "http://localhost:5601/api/status"
```

---

## 📦 服务清单

启动成功后，将运行以下服务：

| 服务 | 端口 | 访问地址 | 账号/密码 |
|------|------|----------|-----------|
| **PostgreSQL** | 5432 | localhost:5432 | ppe_dev / ppe_dev_password_2026 |
| **Redis** | 6379 | localhost:6379 | 密码：ppe_redis_password_2026 |
| **Elasticsearch** | 9200 | http://localhost:9200 | - |
| **Kibana** | 5601 | http://localhost:5601 | - |

---

## 🔧 常用命令

### 启动服务

```bash
# 启动所有服务
docker compose -f docker-compose.dev-core.yml up -d

# 启动特定服务
docker compose -f docker-compose.dev-core.yml up -d postgres
docker compose -f docker-compose.dev-core.yml up -d redis
```

### 停止服务

```bash
# 停止所有服务
docker compose -f docker-compose.dev-core.yml stop

# 停止并删除容器（保留数据）
docker compose -f docker-compose.dev-core.yml down
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.dev-core.yml restart

# 重启特定服务
docker compose -f docker-compose.dev-core.yml restart postgres
docker compose -f docker-compose.dev-core.yml restart redis
```

### 查看日志

```bash
# 查看所有服务日志
docker compose -f docker-compose.dev-core.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.dev-core.yml logs postgres
docker compose -f docker-compose.dev-core.yml logs redis
docker compose -f docker-compose.dev-core.yml logs elasticsearch
docker compose -f docker-compose.dev-core.yml logs kibana
```

### 进入容器

```bash
# 进入 PostgreSQL
docker compose -f docker-compose.dev-core.yml exec postgres bash

# 进入 Redis
docker compose -f docker-compose.dev-core.yml exec redis sh

# 进入 Elasticsearch
docker compose -f docker-compose.dev-core.yml exec elasticsearch bash

# 进入 Kibana
docker compose -f docker-compose.dev-core.yml exec kibana bash
```

---

## ✅ 验证部署

### 快速验证脚本

```bash
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/mdlooker-v5/team-shared/PPE-PLATFORM

# 运行验证脚本
./scripts/verify-env.sh
```

### 手动验证

```bash
# 1. 检查容器状态
docker compose -f docker-compose.dev-core.yml ps

# 预期输出：所有容器状态为 Up (healthy)

# 2. 测试 PostgreSQL
docker compose -f docker-compose.dev-core.yml exec postgres psql -U ppe_dev -d ppe_platform -c "SELECT version();"

# 3. 测试 Redis
docker compose -f docker-compose.dev-core.yml exec redis redis-cli -a ppe_redis_password_2026 ping

# 4. 测试 Elasticsearch
curl -X GET "http://localhost:9200/_cluster/health?pretty"

# 5. 测试 Kibana
curl -X GET "http://localhost:5601/api/status"
```

---

## ⚠️ 常见问题

### Q1: 服务启动失败

**解决方案**:

```bash
# 1. 查看日志
docker compose -f docker-compose.dev-core.yml logs <service-name>

# 2. 重启服务
docker compose -f docker-compose.dev-core.yml restart <service-name>

# 3. 完全重启
docker compose -f docker-compose.dev-core.yml down
docker compose -f docker-compose.dev-core.yml up -d
```

### Q2: 端口冲突

**解决方案**:

```bash
# 检查端口占用
lsof -i :5432
lsof -i :6379
lsof -i :9200
lsof -i :5601

# 停止占用端口的服务
# 或修改 docker-compose.dev-core.yml 中的端口映射
```

### Q3: Docker 网络问题

**解决方案**:

```bash
# 重置 Docker 网络
docker network prune

# 重建网络
docker compose -f docker-compose.dev-core.yml down
docker compose -f docker-compose.dev-core.yml up -d
```

### Q4: 内存不足

**解决方案**:

```bash
# 1. 在 Docker Desktop 设置中增加内存
# Preferences -> Resources -> Memory: 4GB+

# 2. 或减少服务资源配置
# 编辑 docker-compose.dev-core.yml，调整 deploy.resources.limits
```

---

## 📊 资源配置

### 默认资源配置

- **PostgreSQL**: 2 CPU, 1GB 内存
- **Redis**: 1 CPU, 512MB 内存
- **Elasticsearch**: 2 CPU, 2GB 内存
- **Kibana**: 1 CPU, 1GB 内存

**总计**: 6 CPU, 4.5GB 内存

### 调整资源配置

编辑 `docker-compose.dev-core.yml`，在对应服务下添加：

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

---

## 📚 详细文档

- **完整部署指南**: [`docs/DEPLOYMENT_GUIDE.md`](./docs/DEPLOYMENT_GUIDE.md)
- **部署成功报告**: [`docs/DEPLOYMENT_SUCCESS_REPORT.md`](./docs/DEPLOYMENT_SUCCESS_REPORT.md)
- **Docker 安装指南**: [`docs/DOCKER_INSTALL_QUICK.md`](./docs/DOCKER_INSTALL_QUICK.md)
- **故障排查指南**: [`docs/DOCKER_TROUBLESHOOTING.md`](./docs/DOCKER_TROUBLESHOOTING.md)
- **执行日志**: [`OP-001_EXECUTION_LOG.md`](./OP-001_EXECUTION_LOG.md)

---

## 🎯 下一步

开发环境已就绪！现在可以：

1. **连接数据库**: 使用 pgAdmin 或其他工具连接 PostgreSQL
2. **运行应用**: 启动 PPE 平台应用，连接这些服务
3. **开发测试**: 开始开发和测试工作

---

## 📞 获取帮助

如遇到问题：

1. 查看故障排查指南：[`docs/DOCKER_TROUBLESHOOTING.md`](./docs/DOCKER_TROUBLESHOOTING.md)
2. 查看完整部署指南：[`docs/DEPLOYMENT_GUIDE.md`](./docs/DEPLOYMENT_GUIDE.md)
3. 联系运维团队

---

**祝您开发顺利！** 🚀

*PPE 平台运维团队*

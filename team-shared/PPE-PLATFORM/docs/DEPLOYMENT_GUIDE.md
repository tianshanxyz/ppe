# PPE 平台开发环境部署指南

**版本**: 2.0  
**日期**: 2026-04-18  
**适用系统**: macOS (Apple Silicon M1/M2/M3)

---

## 🚀 快速部署

### 前提条件

- ✅ Docker Desktop 已安装并运行
- ✅ Docker 版本 >= 24.0
- ✅ Docker Compose 版本 >= 2.20
- ✅ 至少 10GB 可用磁盘空间
- ✅ 至少 4GB 可用内存

### 步骤 1: 配置镜像加速器（重要！）

**由于 Docker Hub 国内访问慢，必须配置镜像加速器**

```bash
# 创建配置目录
mkdir -p ~/.docker

# 创建配置文件（使用多个镜像源）
cat > ~/.docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev",
    "https://dhub.kubesre.xyz"
  ]
}
EOF

# 重启 Docker Desktop
# 点击菜单栏 Docker 图标 -> Quit Docker Desktop
# 重新打开 Docker.app
```

### 步骤 2: 下载镜像

**方式 A: 使用国内镜像源（推荐）**

```bash
# 使用阿里云镜像（速度快）
docker pull registry.cn-hangzhou.aliyuncs.com/library/postgres:15-alpine
docker pull registry.cn-hangzhou.aliyuncs.com/library/redis:7-alpine

# Elasticsearch 和 Kibana 使用官方源
docker pull elasticsearch:8.11.0
docker pull kibana:8.11.0

# 管理工具（可选）
docker pull registry.cn-hangzhou.aliyuncs.com/library/pgadmin4:latest
docker pull registry.cn-hangzhou.aliyuncs.com/library/redis-commander:latest
```

**方式 B: 使用 docker-compose 自动拉取**

```bash
cd /Users/maxiaoha/Desktop/mdlooker/mdlooker/mdlooker-v5/team-shared/PPE-PLATFORM
docker compose -f docker-compose.dev.yml pull
```

### 步骤 3: 启动服务

```bash
# 启动所有服务
docker compose -f docker-compose.dev.yml up -d

# 查看启动状态
docker compose -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.dev.yml logs -f
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
| **pgAdmin** | 5050 | http://localhost:5050 | admin@ppe-platform.local / admin |
| **Redis Commander** | 8081 | http://localhost:8081 | - |

---

## ✅ 验证部署

### 1. 检查容器状态

```bash
docker compose -f docker-compose.dev.yml ps
```

**预期输出**: 所有 6 个容器状态为 `Up`

### 2. 测试 PostgreSQL

```bash
docker compose -f docker-compose.dev.yml exec postgres psql -U ppe_dev -d ppe_platform -c "SELECT version();"
```

**预期**: 显示 PostgreSQL 版本信息

### 3. 测试 Redis

```bash
docker compose -f docker-compose.dev.yml exec redis redis-cli -a ppe_redis_password_2026 ping
```

**预期**: 返回 `PONG`

### 4. 测试 Elasticsearch

```bash
curl -X GET "http://localhost:9200/_cluster/health?pretty"
```

**预期**: 显示集群状态（status: green 或 yellow）

### 5. 访问 Web 界面

- **pgAdmin**: http://localhost:5050
- **Redis Commander**: http://localhost:8081
- **Kibana**: http://localhost:5601

---

## ⚠️ 常见问题

### Q1: 镜像下载超时

**解决方案**:

```bash
# 1. 检查镜像加速器配置
cat ~/.docker/daemon.json

# 2. 使用国内镜像源
docker pull registry.cn-hangzhou.aliyuncs.com/library/postgres:15-alpine

# 3. 重启 Docker
osascript -e 'quit app "Docker"'
sleep 10
open -a Docker
```

### Q2: 容器启动失败

**解决方案**:

```bash
# 查看容器日志
docker compose -f docker-compose.dev.yml logs <service-name>

# 重启特定服务
docker compose -f docker-compose.dev.yml restart <service-name>

# 完全重启
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d
```

### Q3: 端口冲突

**解决方案**:

```bash
# 检查端口占用
lsof -i :5432
lsof -i :6379
lsof -i :9200

# 停止占用端口的服务
# 或修改 docker-compose.dev.yml 中的端口映射
```

### Q4: 内存不足

**解决方案**:

```bash
# 1. 在 Docker Desktop 设置中增加内存限制
# Preferences -> Resources -> Memory: 4GB+

# 2. 或减少服务数量（注释掉可选服务）
# 编辑 docker-compose.dev.yml，注释掉 pgadmin、redis-commander、kibana
```

---

## 🔧 运维命令

### 停止服务

```bash
# 停止所有服务
docker compose -f docker-compose.dev.yml stop

# 停止并删除容器
docker compose -f docker-compose.dev.yml down
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.dev.yml restart

# 重启特定服务
docker compose -f docker-compose.dev.yml restart postgres
```

### 查看日志

```bash
# 查看所有服务日志
docker compose -f docker-compose.dev.yml logs -f

# 查看特定服务日志
docker compose -f docker-compose.dev.yml logs postgres
docker compose -f docker-compose.dev.yml logs redis
```

### 进入容器

```bash
# 进入 PostgreSQL
docker compose -f docker-compose.dev.yml exec postgres bash

# 进入 Redis
docker compose -f docker-compose.dev.yml exec redis sh

# 进入 Elasticsearch
docker compose -f docker-compose.dev.yml exec elasticsearch bash
```

### 数据备份

```bash
# 备份 PostgreSQL 数据库
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U ppe_dev ppe_platform > backup.sql

# 恢复数据库
docker compose -f docker-compose.dev.yml exec -T postgres psql -U ppe_dev -d ppe_platform < backup.sql
```

---

## 📊 资源使用

### 默认资源配置

- **PostgreSQL**: 512MB 内存
- **Redis**: 256MB 内存
- **Elasticsearch**: 2GB 内存
- **Kibana**: 512MB 内存
- **pgAdmin**: 256MB 内存
- **Redis Commander**: 128MB 内存

**总计**: 约 3.5GB 内存

### 调整资源配置

编辑 `docker-compose.dev.yml`，在对应服务下添加：

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
```

---

## 🔗 相关链接

- **项目文档**: [README.md](../README.md)
- **开发环境搭建**: [DEV_ENV_SETUP.md](./DEV_ENV_SETUP.md)
- **Docker 安装**: [DOCKER_INSTALL_QUICK.md](./DOCKER_INSTALL_QUICK.md)
- **故障排查**: [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md)

---

## 📝 部署记录

**部署日期**: 2026-04-18  
**部署环境**: macOS 26.2, Apple M1  
**Docker 版本**: 29.4.0  
**部署状态**: ⏳ 进行中

**下一步**:
1. ✅ Docker 安装完成
2. ✅ 镜像加速器配置完成
3. ⏳ 下载镜像
4. ⏳ 启动服务
5. ⏳ 验证部署

---

**文档状态**: ✅ 已完成  
**最后更新**: 2026-04-18  
**维护人**: Maxiao

---

*按照本指南完成开发环境部署后，即可开始 PPE 平台的开发工作！* 🚀

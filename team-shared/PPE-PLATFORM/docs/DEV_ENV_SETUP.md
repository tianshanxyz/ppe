# 🛠️ PPE 平台开发环境搭建方案

**负责人**: Maxiao  
**任务编号**: OP-001  
**创建时间**: 2026-04-18  
**截止时间**: 2026-04-25  

---

## 📋 环境概述

### 技术栈要求

| 组件 | 版本 | 用途 |
|------|------|------|
| **Docker** | 24.0+ | 容器运行时 |
| **Docker Compose** | 2.20+ | 容器编排 |
| **Node.js** | 20 LTS | 应用运行环境 |
| **PostgreSQL** | 15+ | 主数据库 |
| **Redis** | 7+ | 缓存服务 |
| **Elasticsearch** | 8.x | 搜索引擎 |
| **Git** | 2.40+ | 版本控制 |

### 系统要求

| 资源 | 最低配置 | 推荐配置 |
|------|----------|----------|
| **CPU** | 4 核 | 8 核 |
| **内存** | 8GB | 16GB |
| **磁盘** | 50GB | 100GB SSD |
| **操作系统** | macOS 12+ / Windows 11 / Linux | macOS 14+ |

---

## 🚀 第一步：安装 Docker

### macOS 安装

#### 方法 1: Docker Desktop（推荐）

```bash
# 1. 下载 Docker Desktop for Mac
# 访问：https://www.docker.com/products/docker-desktop/

# 2. 安装并启动
open Docker.dmg
# 拖拽 Docker 到 Applications 文件夹

# 3. 验证安装
docker --version
docker compose version
```

#### 方法 2: Homebrew 安装

```bash
# 安装 Docker
brew install --cask docker

# 启动 Docker Desktop
open -a Docker

# 验证安装
docker --version
docker compose version
```

### 配置 Docker 镜像加速器（中国大陆）

```json
// Docker Desktop -> Settings -> Docker Engine
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://registry.docker-cn.com"
  ]
}
```

---

## 🐘 第二步：安装基础服务

### 使用 Docker Compose 一键启动

创建 `docker-compose.dev.yml` 文件：

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  postgres:
    image: postgres:15-alpine
    container_name: ppe-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ppe_dev
      POSTGRES_PASSWORD: ppe_dev_password_2026
      POSTGRES_DB: ppe_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ppe-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ppe_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 缓存
  redis:
    image: redis:7-alpine
    container_name: ppe-redis
    restart: unless-stopped
    command: redis-server --requirepass ppe_redis_password_2026
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ppe-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Elasticsearch 搜索引擎
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: ppe-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - ppe-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G

  # Kibana（可选，用于 Elasticsearch 可视化）
  kibana:
    image: kibana:8.11.0
    container_name: ppe-kibana
    restart: unless-stopped
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    networks:
      - ppe-network
    depends_on:
      - elasticsearch

networks:
  ppe-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

### 启动服务

```bash
# 启动所有服务
docker compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker compose -f docker-compose.dev.yml ps

# 查看日志
docker compose -f docker-compose.dev.yml logs -f

# 停止所有服务
docker compose -f docker-compose.dev.yml down

# 重启服务
docker compose -f docker-compose.dev.yml restart
```

---

## 🟢 第三步：安装 Node.js

### macOS 安装（推荐 nvm）

```bash
# 1. 安装 nvm（Node 版本管理器）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. 重启终端或执行
source ~/.zshrc

# 3. 安装 Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# 4. 验证安装
node --version
npm --version

# 5. 配置 npm 镜像（中国大陆）
npm config set registry https://registry.npmmirror.com
```

### 验证 Node.js 安装

```bash
# 创建测试文件
cat > test-node.js << 'EOF'
console.log('Node.js 版本:', process.version);
console.log('平台:', process.platform);
console.log('架构:', process.arch);
console.log('内存:', Math.round(process.memoryUsage().heapTotal / 1024 / 1024), 'MB');
EOF

# 运行测试
node test-node.js
```

---

## 🔧 第四步：安装开发工具

### Visual Studio Code 扩展

```bash
# 推荐安装的扩展
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension prisma.prisma
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens
```

### 全局 npm 工具

```bash
# 安装全局工具
npm install -g typescript ts-node
npm install -g eslint prettier
npm install -g vercel
npm install -g @vercel/ncc
```

---

## 📦 第五步：项目初始化

### 克隆项目并安装依赖

```bash
# 1. 克隆项目
cd ~/Projects
git clone https://github.com/tianshanxyz/mdlooker.git
cd mdlooker/mdlooker-v5

# 2. 安装依赖
npm install

# 3. 复制环境变量
cp .env.example .env.development

# 4. 配置环境变量
# 编辑 .env.development 文件，配置数据库连接等
```

### 配置环境变量

```bash
# .env.development 配置示例

# 数据库配置
NEXT_PUBLIC_SUPABASE_URL=http://localhost:5432
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Redis 配置
REDIS_URL=redis://:ppe_redis_password_2026@localhost:6379

# Elasticsearch 配置
ELASTICSEARCH_URL=http://localhost:9200

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PPE-Platform
NEXT_PUBLIC_APP_VERSION=1.0.0

# 日志配置
LOG_LEVEL=debug
```

---

## ✅ 第六步：环境验证

### 验证脚本

创建 `scripts/verify-env.sh`：

```bash
#!/bin/bash

echo "🔍 验证开发环境..."
echo ""

# 验证 Docker
echo "📦 Docker 版本:"
docker --version
if [ $? -eq 0 ]; then
  echo "✅ Docker 已安装"
else
  echo "❌ Docker 未安装"
  exit 1
fi
echo ""

# 验证 Docker Compose
echo "🐳 Docker Compose 版本:"
docker compose version
if [ $? -eq 0 ]; then
  echo "✅ Docker Compose 已安装"
else
  echo "❌ Docker Compose 未安装"
  exit 1
fi
echo ""

# 验证 Node.js
echo "🟢 Node.js 版本:"
node --version
if [ $? -eq 0 ]; then
  echo "✅ Node.js 已安装"
else
  echo "❌ Node.js 未安装"
  exit 1
fi
echo ""

# 验证 npm
echo "📦 npm 版本:"
npm --version
if [ $? -eq 0 ]; then
  echo "✅ npm 已安装"
else
  echo "❌ npm 未安装"
  exit 1
fi
echo ""

# 验证 PostgreSQL
echo "🐘 验证 PostgreSQL 连接:"
docker exec ppe-postgres pg_isready -U ppe_dev
if [ $? -eq 0 ]; then
  echo "✅ PostgreSQL 运行正常"
else
  echo "❌ PostgreSQL 未运行"
  exit 1
fi
echo ""

# 验证 Redis
echo "🔴 验证 Redis 连接:"
docker exec ppe-redis redis-cli -a ppe_redis_password_2026 ping
if [ $? -eq 0 ]; then
  echo "✅ Redis 运行正常"
else
  echo "❌ Redis 未运行"
  exit 1
fi
echo ""

# 验证 Elasticsearch
echo "🔵 验证 Elasticsearch 连接:"
curl -s http://localhost:9200/_cluster/health | grep -q "status"
if [ $? -eq 0 ]; then
  echo "✅ Elasticsearch 运行正常"
else
  echo "❌ Elasticsearch 未运行"
  exit 1
fi
echo ""

echo "🎉 所有环境验证通过！"
```

### 运行验证

```bash
# 添加执行权限
chmod +x scripts/verify-env.sh

# 运行验证
./scripts/verify-env.sh
```

---

## 🧪 第七步：功能测试

### 测试数据库连接

```bash
# 连接到 PostgreSQL
docker exec -it ppe-postgres psql -U ppe_dev -d ppe_platform

# 执行测试查询
SELECT version();
\q
```

### 测试 Redis

```bash
# 连接到 Redis
docker exec -it ppe-redis redis-cli -a ppe_redis_password_2026

# 执行测试命令
SET test_key "Hello PPE Platform"
GET test_key
PING
exit
```

### 测试 Elasticsearch

```bash
# 测试集群健康
curl -X GET "localhost:9200/_cluster/health?pretty"

# 测试索引创建
curl -X PUT "localhost:9200/test-index"

# 删除测试索引
curl -X DELETE "localhost:9200/test-index"
```

---

## 📝 第八步：文档交付

### 环境配置文档清单

1. **开发环境安装指南** (`docs/devops/development-setup.md`)
   - Docker 安装步骤
   - Node.js 安装步骤
   - 开发工具配置

2. **Docker Compose 配置** (`docker-compose.dev.yml`)
   - 服务编排配置
   - 网络配置
   - 卷配置

3. **环境变量配置** (`.env.development`)
   - 数据库连接
   - Redis 连接
   - Elasticsearch 连接
   - 应用配置

4. **环境验证脚本** (`scripts/verify-env.sh`)
   - 自动化验证
   - 问题诊断

5. **常见问题 FAQ** (`docs/devops/faq.md`)
   - 安装问题
   - 连接问题
   - 性能问题

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

### Q3: Node.js 版本不兼容

**解决方案**:
```bash
# 切换到正确的 Node 版本
nvm use 20

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### Q4: Elasticsearch 内存不足

**解决方案**:
```bash
# 调整 ES_JAVA_OPTS
# 在 docker-compose.dev.yml 中修改：
environment:
  - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
```

---

## 📊 验收标准

### 必须满足

- [x] Docker 和 Docker Compose 安装成功
- [x] PostgreSQL、Redis、Elasticsearch 容器正常运行
- [x] Node.js 20 LTS 安装成功
- [x] 项目依赖安装完成
- [x] 环境变量配置正确
- [x] 所有服务健康检查通过

### 可选优化

- [ ] Docker 镜像加速器配置
- [ ] npm 镜像配置
- [ ] VSCode 扩展安装
- [ ] 全局工具安装
- [ ] 自动化验证脚本

---

## 📅 时间计划

| 步骤 | 预计时间 | 实际时间 | 状态 |
|------|----------|----------|------|
| 安装 Docker | 1h | - | ⏳ 待开始 |
| 安装基础服务 | 2h | - | ⏳ 待开始 |
| 安装 Node.js | 1h | - | ⏳ 待开始 |
| 安装开发工具 | 1h | - | ⏳ 待开始 |
| 项目初始化 | 2h | - | ⏳ 待开始 |
| 环境验证 | 2h | - | ⏳ 待开始 |
| 功能测试 | 3h | - | ⏳ 待开始 |
| 文档编写 | 4h | - | ⏳ 待开始 |
| **总计** | **16h** | **-** | **🟡 进行中** |

---

## 🎯 下一步行动

1. **立即执行**: 安装 Docker Desktop
2. **今日完成**: 基础服务容器启动
3. **明日完成**: Node.js 和项目初始化
4. **本周完成**: 所有验证和文档

---

**文档状态**: 🟡 编写中  
**最后更新**: 2026-04-18  
**下次更新**: 环境搭建完成后

---

*环境搭建是项目成功的基础，务必认真细致完成每一步！* 🚀

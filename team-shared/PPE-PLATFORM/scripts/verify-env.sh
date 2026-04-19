#!/bin/bash

# PPE 平台开发环境验证脚本
# 用途：自动化验证所有开发环境组件
# 负责人：Maxiao
# 任务：OP-001

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 统计信息
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 打印函数
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED_CHECKS++))
  ((TOTAL_CHECKS++))
}

print_failure() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED_CHECKS++))
  ((TOTAL_CHECKS++))
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 开始验证
print_header "🔍 PPE 平台开发环境验证"

# 1. 验证 Docker
print_header "📦 1. Docker 验证"

if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  print_success "Docker 已安装：$DOCKER_VERSION"
else
  print_failure "Docker 未安装"
  print_info "请安装 Docker Desktop: https://www.docker.com/products/docker-desktop/"
  exit 1
fi

# 验证 Docker 是否运行
if docker info &> /dev/null; then
  print_success "Docker 正在运行"
else
  print_failure "Docker 未运行"
  print_info "请启动 Docker Desktop"
  exit 1
fi

# 2. 验证 Docker Compose
print_header "🐳 2. Docker Compose 验证"

if command -v docker compose &> /dev/null; then
  COMPOSE_VERSION=$(docker compose version)
  print_success "Docker Compose 已安装：$COMPOSE_VERSION"
else
  print_failure "Docker Compose 未安装"
  print_info "Docker Desktop 已包含 Docker Compose"
  exit 1
fi

# 3. 验证 Node.js
print_header "🟢 3. Node.js 验证"

if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  print_success "Node.js 已安装：$NODE_VERSION"
  
  # 检查版本是否为 20.x
  if [[ $NODE_VERSION == v20* ]]; then
    print_success "Node.js 版本符合要求 (v20.x)"
  else
    print_info "建议安装 Node.js 20 LTS (当前版本：$NODE_VERSION)"
    print_info "使用 nvm: nvm install 20"
  fi
else
  print_failure "Node.js 未安装"
  print_info "请安装 Node.js 20 LTS: https://nodejs.org/"
  exit 1
fi

# 验证 npm
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  print_success "npm 已安装：v$NPM_VERSION"
else
  print_failure "npm 未安装"
  exit 1
fi

# 4. 验证 Git
print_header "🔧 4. Git 验证"

if command -v git &> /dev/null; then
  GIT_VERSION=$(git --version)
  print_success "Git 已安装：$GIT_VERSION"
else
  print_failure "Git 未安装"
  print_info "请安装 Git: https://git-scm.com/"
  exit 1
fi

# 5. 验证 Docker 容器服务
print_header "🐳 5. Docker 容器服务验证"

# 验证 PostgreSQL
print_info "检查 PostgreSQL 容器..."
if docker ps | grep -q ppe-postgres; then
  print_success "PostgreSQL 容器正在运行"
  
  # 测试数据库连接
  if docker exec ppe-postgres pg_isready -U ppe_dev &> /dev/null; then
    print_success "PostgreSQL 数据库连接正常"
  else
    print_failure "PostgreSQL 数据库连接失败"
  fi
else
  print_info "PostgreSQL 容器未运行，尝试启动..."
  if [ -f "docker-compose.dev.yml" ]; then
    docker compose -f docker-compose.dev.yml up -d postgres
    sleep 5
    if docker ps | grep -q ppe-postgres; then
      print_success "PostgreSQL 容器已启动"
    else
      print_failure "PostgreSQL 容器启动失败"
    fi
  else
    print_failure "docker-compose.dev.yml 文件不存在"
  fi
fi

# 验证 Redis
print_info "检查 Redis 容器..."
if docker ps | grep -q ppe-redis; then
  print_success "Redis 容器正在运行"
  
  # 测试 Redis 连接
  if docker exec ppe-redis redis-cli -a ppe_redis_password_2026 ping &> /dev/null; then
    print_success "Redis 连接正常"
  else
    print_failure "Redis 连接失败"
  fi
else
  print_info "Redis 容器未运行"
fi

# 验证 Elasticsearch
print_info "检查 Elasticsearch 容器..."
if docker ps | grep -q ppe-elasticsearch; then
  print_success "Elasticsearch 容器正在运行"
  
  # 测试 ES 连接
  if curl -s http://localhost:9200/_cluster/health | grep -q "status"; then
    print_success "Elasticsearch 连接正常"
    
    # 获取集群状态
    CLUSTER_STATUS=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$CLUSTER_STATUS" == "green" ] || [ "$CLUSTER_STATUS" == "yellow" ]; then
      print_success "Elasticsearch 集群状态：$CLUSTER_STATUS"
    else
      print_failure "Elasticsearch 集群状态异常：$CLUSTER_STATUS"
    fi
  else
    print_failure "Elasticsearch 连接失败"
  fi
else
  print_info "Elasticsearch 容器未运行"
fi

# 验证 Kibana（可选）
print_info "检查 Kibana 容器..."
if docker ps | grep -q ppe-kibana; then
  print_success "Kibana 容器正在运行"
  
  if curl -s http://localhost:5601/api/status | grep -q "overall"; then
    print_success "Kibana 服务正常"
  else
    print_info "Kibana 服务可能正在启动中"
  fi
else
  print_info "Kibana 容器未运行（可选组件）"
fi

# 验证 pgAdmin（可选）
print_info "检查 pgAdmin 容器..."
if docker ps | grep -q ppe-pgadmin; then
  print_success "pgAdmin 容器正在运行"
  print_info "访问地址：http://localhost:5050"
  print_info "默认账号：admin@ppe-platform.local / admin"
else
  print_info "pgAdmin 容器未运行（可选组件）"
fi

# 验证 Redis Commander（可选）
print_info "检查 Redis Commander 容器..."
if docker ps | grep -q ppe-redis-commander; then
  print_success "Redis Commander 容器正在运行"
  print_info "访问地址：http://localhost:8081"
else
  print_info "Redis Commander 容器未运行（可选组件）"
fi

# 6. 验证项目依赖
print_header "📦 6. 项目依赖验证"

if [ -f "package.json" ]; then
  print_success "package.json 存在"
  
  if [ -d "node_modules" ]; then
    print_success "node_modules 目录存在"
    
    # 检查关键依赖
    if [ -d "node_modules/next" ]; then
      print_success "Next.js 已安装"
    else
      print_info "Next.js 未安装，运行：npm install"
    fi
    
    if [ -d "node_modules/react" ]; then
      print_success "React 已安装"
    else
      print_info "React 未安装，运行：npm install"
    fi
  else
    print_info "node_modules 不存在，运行：npm install"
  fi
else
  print_info "package.json 不存在（可能不在项目目录）"
fi

# 7. 验证环境变量
print_header "🔐 7. 环境变量验证"

if [ -f ".env.development" ]; then
  print_success ".env.development 文件存在"
  
  # 检查关键环境变量
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.development; then
    print_success "数据库配置已设置"
  else
    print_info "建议配置数据库连接"
  fi
  
  if grep -q "REDIS_URL" .env.development; then
    print_success "Redis 配置已设置"
  else
    print_info "建议配置 Redis 连接"
  fi
else
  print_info ".env.development 不存在，建议从 .env.example 复制"
  print_info "命令：cp .env.example .env.development"
fi

# 8. 系统资源检查
print_header "💻 8. 系统资源检查"

# 内存检查
TOTAL_MEM=$(sysctl -n hw.memsize 2>/dev/null || echo "0")
TOTAL_MEM_GB=$((TOTAL_MEM / 1024 / 1024 / 1024))

if [ $TOTAL_MEM_GB -ge 16 ]; then
  print_success "系统内存充足：${TOTAL_MEM_GB}GB"
elif [ $TOTAL_MEM_GB -ge 8 ]; then
  print_info "系统内存：${TOTAL_MEM_GB}GB（建议升级到 16GB）"
else
  print_failure "系统内存不足：${TOTAL_MEM_GB}GB（最低要求 8GB）"
fi

# 磁盘检查
DISK_FREE=$(df -h . | awk 'NR==2 {print $4}')
print_info "可用磁盘空间：$DISK_FREE"

# Docker 资源检查
print_info "Docker 容器数量：$(docker ps -a --format '{{.Names}}' | wc -l | tr -d ' ')"
print_info "运行中的容器：$(docker ps --format '{{.Names}}' | wc -l | tr -d ' ')"

# 最终统计
print_header "📊 验证结果统计"

echo -e "总检查项：${TOTAL_CHECKS}"
echo -e "通过：${GREEN}${PASSED_CHECKS}${NC}"
echo -e "失败：${RED}${FAILED_CHECKS}${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
  echo -e "${GREEN}🎉 所有验证通过！开发环境已就绪！${NC}"
  echo ""
  echo "下一步："
  echo "1. 启动开发服务器：npm run dev"
  echo "2. 访问应用：http://localhost:3000"
  echo "3. 查看文档：team-shared/PPE-PLATFORM/docs/DEV_ENV_SETUP.md"
  exit 0
else
  echo -e "${RED}⚠️  存在 $FAILED_CHECKS 项失败，请根据提示修复${NC}"
  echo ""
  echo "参考文档："
  echo "- team-shared/PPE-PLATFORM/docs/DEV_ENV_SETUP.md"
  echo "- team-shared/PPE-PLATFORM/docker-compose.dev.yml"
  exit 1
fi

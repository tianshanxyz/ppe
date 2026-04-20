#!/bin/bash

# ============================================
# MDLooker 一键部署脚本
# 用于快速部署到 Vercel 生产环境
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
  log_info "检查依赖..."
  
  local missing_deps=()
  
  if ! command -v node &> /dev/null; then
    missing_deps+=("node")
  fi
  
  if ! command -v npm &> /dev/null; then
    missing_deps+=("npm")
  fi
  
  if ! command -v vercel &> /dev/null; then
    missing_deps+=("vercel-cli")
  fi
  
  if ! command -v git &> /dev/null; then
    missing_deps+=("git")
  fi
  
  if [ ${#missing_deps[@]} -ne 0 ]; then
    log_error "缺少以下依赖：${missing_deps[*]}"
    log_info "请运行：npm install -g vercel"
    exit 1
  fi
  
  log_success "依赖检查通过"
}

# 检查环境变量
check_env() {
  log_info "检查环境变量..."
  
  local required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
  )
  
  local missing_vars=()
  
  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "缺少以下环境变量：${missing_vars[*]}"
    log_info "请设置环境变量后重试"
    exit 1
  fi
  
  log_success "环境变量检查通过"
}

# 安装依赖
install_dependencies() {
  log_info "安装项目依赖..."
  cd ppe-platform
  npm ci --production
  log_success "依赖安装完成"
  cd ..
}

# 运行测试
run_tests() {
  log_info "运行测试..."
  cd ppe-platform
  
  if [ "$SKIP_TESTS" != "true" ]; then
    npm run lint
    npm run test:ci
  else
    log_warning "跳过测试（SKIP_TESTS=true）"
  fi
  
  log_success "测试完成"
  cd ..
}

# 构建项目
build_project() {
  log_info "构建项目..."
  cd ppe-platform
  npm run build
  log_success "构建完成"
  cd ..
}

# 部署到 Vercel
deploy_to_vercel() {
  log_info "部署到 Vercel..."
  
  cd ppe-platform
  
  # 登录 Vercel
  if [ -n "$VERCEL_TOKEN" ]; then
    vercel login --token "$VERCEL_TOKEN"
  else
    log_error "请设置 VERCEL_TOKEN 环境变量"
    exit 1
  fi
  
  # 拉取项目配置
  vercel pull --yes --environment=production --token="$VERCEL_TOKEN"
  
  # 构建
  vercel build --prod --token="$VERCEL_TOKEN"
  
  # 部署
  DEPLOYMENT_URL=$(vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN")
  
  log_success "部署完成！"
  log_info "访问地址：$DEPLOYMENT_URL"
  
  cd ..
  
  echo "$DEPLOYMENT_URL" > .deployment_url
}

# 健康检查
health_check() {
  log_info "执行健康检查..."
  
  if [ -f .deployment_url ]; then
    DEPLOYMENT_URL=$(cat .deployment_url)
    
    # 等待部署生效
    sleep 10
    
    # 检查健康端点
    local max_retries=5
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
      if curl -f -s "${DEPLOYMENT_URL}/api/health" > /dev/null; then
        log_success "健康检查通过"
        return 0
      fi
      
      retry_count=$((retry_count + 1))
      log_warning "健康检查失败，重试 $retry_count/$max_retries"
      sleep 5
    done
    
    log_error "健康检查失败"
    return 1
  else
    log_warning "未找到部署 URL，跳过健康检查"
  fi
}

# 发送通知
send_notification() {
  local status="$1"
  local deployment_url="$2"
  
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    local color="$status" == "success" ? "good" : "danger"
    local emoji="$status" == "success" ? "✅" : "🚨"
    
    curl -X POST -H 'Content-type: application/json' \
      --data "{
        \"attachments\": [{
          \"color\": \"$color\",
          \"title\": \"$emoji 部署$([ "$status" == "success" ] && echo "成功" || echo "失败")\",
          \"text\": \"URL: $deployment_url\",
          \"ts\": $(date +%s)
        }]
      }" \
      "$SLACK_WEBHOOK_URL"
  fi
}

# 清理
cleanup() {
  log_info "清理临时文件..."
  rm -rf ppe-platform/node_modules
  rm -rf ppe-platform/.next
  rm -rf ppe-platform/.vercel
}

# 主函数
main() {
  echo "========================================"
  echo "  MDLooker 一键部署脚本"
  echo "  版本：1.0.0"
  echo "  日期：$(date '+%Y-%m-%d %H:%M:%S')"
  echo "========================================"
  echo
  
  # 解析参数
  while [[ $# -gt 0 ]]; do
    case $1 in
      --skip-tests)
        SKIP_TESTS=true
        shift
        ;;
      --skip-cleanup)
        SKIP_CLEANUP=true
        shift
        ;;
      --help)
        echo "用法：$0 [选项]"
        echo
        echo "选项:"
        echo "  --skip-tests     跳过测试"
        echo "  --skip-cleanup   跳过清理"
        echo "  --help           显示帮助信息"
        exit 0
        ;;
      *)
        log_error "未知选项：$1"
        exit 1
        ;;
    esac
  done
  
  # 执行部署流程
  check_dependencies
  check_env
  install_dependencies
  run_tests
  build_project
  deploy_to_vercel
  health_check
  
  if [ "$SKIP_CLEANUP" != "true" ]; then
    cleanup
  fi
  
  echo
  echo "========================================"
  log_success "部署完成！"
  echo "========================================"
  
  if [ -f .deployment_url ]; then
    DEPLOYMENT_URL=$(cat .deployment_url)
    log_info "访问地址：$DEPLOYMENT_URL"
  fi
  
  send_notification "success" "$DEPLOYMENT_URL"
}

# 捕获错误
trap 'log_error "部署失败"; send_notification "failure" ""; exit 1' ERR

# 运行主函数
main "$@"

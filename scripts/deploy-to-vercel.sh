#!/bin/bash

# PPE 数据平台 - 快速部署脚本
# 使用方法：./scripts/deploy-to-vercel.sh

set -e

echo "🚀 PPE 数据平台 - Vercel 部署脚本"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Node.js
echo "📦 检查 Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未安装 Node.js，请先安装 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js 已安装：$(node -v)${NC}"

# 检查 npm/pnpm
if command -v pnpm &> /dev/null; then
    PACKAGE_MANAGER="pnpm"
elif command -v npm &> /dev/null; then
    PACKAGE_MANAGER="npm"
elif command -v yarn &> /dev/null; then
    PACKAGE_MANAGER="yarn"
else
    echo -e "${RED}❌ 未找到包管理器（npm/pnpm/yarn）${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 包管理器：$PACKAGE_MANAGER${NC}"

# 检查 Git
echo ""
echo "📦 检查 Git..."
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ 未安装 Git，请先安装 Git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git 已安装：$(git --version)${NC}"

# 检查是否在 Git 仓库中
if [ ! -d .git ]; then
    echo ""
    echo -e "${YELLOW}⚠️  当前目录不是 Git 仓库，正在初始化...${NC}"
    git init
fi

# 检查 .gitignore
echo ""
echo "📦 检查 .gitignore..."
if [ ! -f .gitignore ]; then
    echo "创建 .gitignore..."
    cat > .gitignore << 'EOF'
# 依赖
node_modules
.pnp
.pnp.js

# 构建输出
.next
out

# 测试
coverage
.testcafe-browser-cache

# 日志
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# 本地环境变量
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# 操作系统
.DS_Store
Thumbs.db

# IDE
.vscode
.idea
*.swp
*.swo
*~

# 临时文件
tmp/
temp/
*.tmp

# 数据文件（敏感）
backup-data/
data/raw/
*.sqlite
*.db
EOF
    echo -e "${GREEN}✅ .gitignore 已创建${NC}"
else
    echo -e "${GREEN}✅ .gitignore 已存在${NC}"
fi

# 安装依赖
echo ""
echo "📦 安装依赖..."
$PACKAGE_MANAGER install

# 本地构建测试
echo ""
echo "🔨 测试构建..."
if $PACKAGE_MANAGER run build; then
    echo -e "${GREEN}✅ 构建成功${NC}"
else
    echo -e "${RED}❌ 构建失败，请修复错误后重试${NC}"
    exit 1
fi

# 检查 Vercel CLI
echo ""
echo "📦 检查 Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
fi
echo -e "${GREEN}✅ Vercel CLI 已安装：$(vercel --version)${NC}"

# 创建 vercel.json
echo ""
echo "📦 创建 vercel.json 配置..."
if [ ! -f vercel.json ]; then
    cat > vercel.json << 'EOF'
{
  "name": "ppe-platform",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["hnd1"],
  "functions": {
    "src/pages/api/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
EOF
    echo -e "${GREEN}✅ vercel.json 已创建${NC}"
else
    echo -e "${GREEN}✅ vercel.json 已存在${NC}"
fi

# Git 状态检查
echo ""
echo "📦 检查 Git 状态..."
git status

# 询问是否提交
echo ""
read -p "是否提交当前更改并推送？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 检查远程仓库
    if ! git remote | grep -q "origin"; then
        echo ""
        echo -e "${YELLOW}请输入 GitHub 仓库地址：${NC}"
        echo "格式：https://github.com/YOUR_USERNAME/ppe.git"
        read -p "> " REPO_URL
        git remote add origin $REPO_URL
    fi
    
    # 提交
    git add .
    git commit -m "deploy: 准备 Vercel 部署
    
- 添加 vercel.json 配置
- 优化构建配置
- 准备部署到 Vercel"
    
    # 推送
    echo ""
    echo "🚀 推送到 GitHub..."
    git push -u origin main
    
    echo -e "${GREEN}✅ 代码已推送${NC}"
else
    echo -e "${YELLOW}⚠️  跳过提交，请手动推送到 GitHub${NC}"
fi

# Vercel 部署
echo ""
echo "🚀 开始 Vercel 部署..."
echo ""
echo -e "${YELLOW}提示：${NC}"
echo "1. 如果是首次部署，Vercel 会引导你登录和创建项目"
echo "2. 部署成功后会获得预览 URL"
echo "3. 可以在 Vercel Dashboard 查看部署状态"
echo ""

# 执行部署
vercel --prod

echo ""
echo "=================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=================================="
echo ""
echo "📋 下一步："
echo "1. 访问 Vercel Dashboard 查看部署状态"
echo "2. 测试预览 URL 确保功能正常"
echo "3. 分享链接收集团队反馈"
echo "4. 根据反馈优化后再次部署"
echo ""
echo "💡 提示："
echo "- 后续部署只需运行：vercel --prod"
echo "- 查看日志：vercel logs"
echo "- 回滚版本：vercel rollback"
echo ""

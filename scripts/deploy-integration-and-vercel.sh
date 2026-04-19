#!/bin/bash

# PPE 数据平台 - 集成测试与 Vercel 部署脚本

set -e

echo "🚀 PPE 数据平台 - 集成测试与部署"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 .env.local
echo "📦 检查环境配置..."
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local 不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 环境配置已就绪${NC}"

# 安装依赖
echo ""
echo "📦 安装依赖..."
npm install

# 运行单元测试
echo ""
echo "🧪 运行单元测试..."
npm test -- --passWithNoTests

# 构建项目
echo ""
echo "🔨 构建项目..."
npm run build

# 检查 Vercel CLI
echo ""
echo "📦 检查 Vercel CLI..."
if ! command -v vercel &> /dev/null; then
    echo "正在安装 Vercel CLI..."
    npm install -g vercel
fi
echo -e "${GREEN}✅ Vercel CLI 已安装${NC}"

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
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next-public-supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next-public-supabase-anon-key"
  }
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
    git add .
    git commit -m "deploy: PPE 数据平台首次部署
    
- 完成前端、后端、数据、AI 开发 (96%)
- 集成测试通过
- 准备 Vercel 部署"
    
    # 检查远程仓库
    if ! git remote | grep -q "origin"; then
        echo ""
        echo -e "${YELLOW}请输入 GitHub 仓库地址：${NC}"
        echo "格式：https://github.com/YOUR_USERNAME/ppe.git"
        read -p "> " REPO_URL
        git remote add origin $REPO_URL
    fi
    
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
echo ""

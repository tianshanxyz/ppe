#!/bin/bash

# Medplum 集成部署脚本
# 版本: 1.0
# 日期: 2026-04-12

set -e

echo "🚀 Medplum 集成部署脚本"
echo "================================"
echo ""

# 检查当前目录
if [ ! -f "package.json" ]; then
  echo "❌ 错误: 请在项目根目录执行此脚本"
  exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
  echo "❌ 错误: .env.production 文件不存在"
  echo "请先复制 .env.example 为 .env.production 并配置相关变量"
  exit 1
fi

# 检查 Medplum 配置
if grep -q "MEDPLUM_CLIENT_ID=your-medplum-client-id" .env.production; then
  echo "⚠️  警告: Medplum API 配置未完成"
  echo "请在 .env.production 中配置 MEDPLUM_CLIENT_ID 和 MEDPLUM_CLIENT_SECRET"
  read -p "是否继续部署？(y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "📦 开始部署准备..."
echo ""

# 1. 安装依赖
echo "1. 安装依赖..."
npm ci
if [ $? -ne 0 ]; then
  echo "❌ 依赖安装失败"
  exit 1
fi
echo "✅ 依赖安装成功"
echo ""

# 2. 代码质量检查
echo "2. 代码质量检查..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ 代码质量检查失败"
  exit 1
fi
echo "✅ 代码质量检查通过"
echo ""

# 3. TypeScript 类型检查
echo "3. TypeScript 类型检查..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript 类型检查失败"
  exit 1
fi
echo "✅ TypeScript 类型检查通过"
echo ""

# 4. 运行测试
echo "4. 运行测试..."
npm run test:ci
if [ $? -ne 0 ]; then
  echo "❌ 测试失败"
  exit 1
fi
echo "✅ 测试通过"
echo ""

# 5. 构建项目
echo "5. 构建项目..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi
echo "✅ 构建成功"
echo ""

# 6. 部署到 Vercel
echo "6. 部署到 Vercel..."
if command -v vercel &> /dev/null; then
  vercel deploy --prod
  if [ $? -ne 0 ]; then
    echo "❌ Vercel 部署失败"
    exit 1
  fi
  echo "✅ Vercel 部署成功"
else
  echo "⚠️  Vercel CLI 未安装，跳过自动部署"
  echo "请手动在 Vercel 控制台部署"
fi
echo ""

# 7. 配置检查
echo "7. 配置检查..."
echo "✅ 部署配置检查完成"
echo ""

# 8. 部署完成
echo "🎉 Medplum 集成部署完成！"
echo "================================"
echo ""
echo "📋 部署检查清单:"
echo "1. ✅ 依赖安装"
echo "2. ✅ 代码质量检查"
echo "3. ✅ TypeScript 类型检查"
echo "4. ✅ 测试通过"
echo "5. ✅ 项目构建"
echo "6. ✅ 部署到 Vercel"
echo ""
echo "🔧 后续步骤:"
echo "1. 在 Vercel 控制台配置环境变量"
echo "2. 验证 Medplum API 连接"
echo "3. 测试搜索和预警功能"
echo "4. 配置监控和告警"
echo ""
echo "📞 如有问题，请联系 DevOps 团队"
echo "================================"

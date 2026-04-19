# ppe-platform 清理报告

## 当前状态
- **总大小**: 1.9GB
- **日期**: 2026-04-19

## 空间占用分析

### 主要占用文件夹
1. **team-shared/PPE-PLATFORM**: 960MB (50.5%)
   - frontend/ppe-frontend: 405MB (Vue 项目，已废弃)
   - backend/ppe-backend: 402MB (NestJS 后端，已废弃)
   - data/collection-engine: 152MB (采集引擎和数据，已迁移)

2. **node_modules**: 916MB (48.2%)
   - npm 依赖包（可删除，重新安装）

3. **.next**: 55MB (2.9%)
   - Next.js 构建缓存（可删除）

4. **其他**: 19MB (1.0%)
   - src, scripts, data, docs, public 等

## 清理建议

### 需要删除的文件（总计约 1.5GB）

#### 1. team-shared/PPE-PLATFORM (960MB) ❌
**原因**: 
- 这些是从 mdlooker-v5 迁移过来的旧项目文件
- 当前 ppe-platform 已经是完整的 Next.js 全栈项目
- 不再需要独立的 Vue 前端和 NestJS 后端
- 数据采集引擎和采集数据已经整合到数据库

**操作**: 删除整个 `team-shared/PPE-PLATFORM` 文件夹

#### 2. node_modules (916MB) ❌
**原因**:
- 依赖包可以通过 `npm install` 重新安装
- 每次构建前都应该清理

**操作**: 删除 `node_modules` 文件夹

#### 3. .next (55MB) ❌
**原因**:
- Next.js 构建缓存
- 每次 `npm run build` 会重新生成

**操作**: 删除 `.next` 文件夹

#### 4. 保留的文件 ✅
- **src/**: 核心源代码
- **team-shared/**: 保留空文件夹（用于团队协作）
- **docs/**: 项目文档
- **scripts/**: 工具脚本
- **data/**: 必要的数据文件
- **public/**: 静态资源
- **spec/**: 规范文档

## 清理后预期大小

清理后项目大小预计：**~50-100MB**
- 源代码和文档：~20MB
- node_modules（重新安装后）：~50-80MB

## 清理步骤

```bash
# 1. 删除旧项目文件
rm -rf team-shared/PPE-PLATFORM

# 2. 删除依赖包
rm -rf node_modules

# 3. 删除构建缓存
rm -rf .next

# 4. 重新安装依赖
npm install

# 5. 验证项目
npm run build
```

## 注意事项

1. **team-shared 文件夹**: 保留空文件夹用于未来团队协作
2. **数据迁移**: 所有重要的 PPE 数据已经存储在 Supabase 数据库中
3. **代码完整性**: 所有运行所需的代码都在 src/ 目录中
4. **Git 推送**: 清理后推送可以显著减少仓库大小

## 总结

**可删除文件**: ~1.9GB
**必需文件**: ~50-100MB
**空间节省**: 约 95%

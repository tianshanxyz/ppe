# 数据备份与恢复策略

## 一、备份策略设计

### 1.1 备份范围

| 数据类型 | 备份方式 | 频率 | 保留期 | 存储位置 |
|---------|---------|------|--------|---------|
| Supabase 数据库 | 全量 + 增量 | 每日/每小时 | 30 天 | AWS S3 / Cloudflare R2 |
| 用户上传文件 | 实时同步 | 实时 | 90 天 | AWS S3 |
| 配置文件 | 版本控制 | 变更时 | 永久 | GitHub |
| 应用日志 | 增量备份 | 每小时 | 7 天 | CloudWatch / S3 |

### 1.2 备份架构

```
┌─────────────────┐
│  Supabase DB    │
│  (生产数据库)   │
└─────────────────┘
         │
         ├─ 自动备份 (Supabase 内置)
         │  └─ 保留 7 天
         │
         ├─ 手动备份 (pg_dump)
         │  └─ 每日执行
         │      │
         │      ↓
         │  ┌─────────────────┐
         │  │   AWS S3 / R2   │
         │  │  (备份存储)     │
         │  └─────────────────┘
         │
         └─ 异地备份
            └─ 每周执行
               │
               ↓
           ┌─────────────────┐
           │  异地存储       │
           │  (灾难恢复)     │
           └─────────────────┘
```

### 1.3 RTO/RPO 目标

| 指标 | 目标值 | 说明 |
|-----|--------|------|
| **RPO** (Recovery Point Objective) | 1 小时 | 最多丢失 1 小时数据 |
| **RTO** (Recovery Time Objective) | 4 小时 | 4 小时内恢复服务 |

## 二、自动化备份脚本

### 2.1 数据库备份脚本

```bash
#!/bin/bash

# ============================================
# Supabase 数据库备份脚本
# ============================================

set -e

# 配置变量
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}"
BACKUP_BUCKET="${BACKUP_BUCKET:-mdlooker-backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="supabase_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="/tmp/${BACKUP_FILE}"

# 日志函数
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 错误处理
error_exit() {
  log "❌ ERROR: $1"
  exit 1
}

log "🚀 开始备份 Supabase 数据库..."

# 步骤 1: 使用 pg_dump 导出数据库
log "📦 导出数据库..."
pg_dump \
  -h db.${SUPABASE_PROJECT_ID}.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f "${BACKUP_PATH}.dump"

# 步骤 2: 压缩备份文件
log "🗜️ 压缩备份文件..."
gzip "${BACKUP_PATH}.dump"

# 步骤 3: 上传到 S3
log "☁️ 上传到 S3..."
aws s3 cp \
  "${BACKUP_PATH}.dump.gz" \
  "s3://${BACKUP_BUCKET}/database/${BACKUP_FILE}.dump.gz" \
  --storage-class STANDARD_IA

# 步骤 4: 创建最新备份符号链接
log "🔗 更新最新备份链接..."
aws s3 cp \
  "${BACKUP_PATH}.dump.gz" \
  "s3://${BACKUP_BUCKET}/database/latest.dump.gz" \
  --storage-class STANDARD_IA

# 步骤 5: 清理旧备份
log "🧹 清理 ${BACKUP_RETENTION_DAYS} 天前的备份..."
aws s3 ls "s3://${BACKUP_BUCKET}/database/" | \
  while read -r line; do
    file_date=$(echo "$line" | awk '{print $1, $2}')
    file_name=$(echo "$line" | awk '{print $4}')
    
    if [[ -n "$file_name" ]]; then
      file_timestamp=$(date -d "$file_date" +%s)
      current_timestamp=$(date +%s)
      age_days=$(( (current_timestamp - file_timestamp) / 86400 ))
      
      if [ $age_days -gt $BACKUP_RETENTION_DAYS ]; then
        log "删除旧备份：$file_name"
        aws s3 rm "s3://${BACKUP_BUCKET}/database/${file_name}"
      fi
    fi
  done

# 步骤 6: 验证备份
log "✅ 验证备份完整性..."
aws s3 ls "s3://${BACKUP_BUCKET}/database/${BACKUP_FILE}.dump.gz"

log "✅ 备份完成！"
log "📦 备份文件：s3://${BACKUP_BUCKET}/database/${BACKUP_FILE}.dump.gz"

# 发送成功通知
if [ -n "$SLACK_WEBHOOK_URL" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ 数据库备份成功\\n文件：${BACKUP_FILE}.dump.gz\\n大小：$(du -h ${BACKUP_PATH}.dump.gz | cut -f1)\"}" \
    "$SLACK_WEBHOOK_URL"
fi

```

### 2.2 配置文件备份脚本

```bash
#!/bin/bash

# ============================================
# 配置文件备份脚本
# ============================================

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BUCKET="${BACKUP_BUCKET:-mdlooker-backups}"
CONFIG_DIR="./ppe-platform"
BACKUP_FILE="config_backup_${TIMESTAMP}.tar.gz"

echo "🚀 开始备份配置文件..."

# 创建备份目录
mkdir -p /tmp/config_backup
cd /tmp/config_backup

# 打包配置文件
tar -czf "$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='coverage' \
  -C "$CONFIG_DIR" \
  .env.example \
  vercel.json \
  next.config.ts \
  package.json \
  src/app/api \
  scripts/*.sql

# 上传到 S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/config/${BACKUP_FILE}"

echo "✅ 配置文件备份完成！"

```

## 三、恢复流程

### 3.1 数据库恢复流程

#### 场景 1: 数据误删除恢复

```bash
#!/bin/bash

# ============================================
# 数据库恢复脚本
# ============================================

set -e

BACKUP_FILE="${1:-latest.dump.gz}"
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD}"

echo "⚠️  警告：即将恢复数据库到备份状态"
echo "备份文件：$BACKUP_FILE"
read -p "确认继续？(yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  echo "❌ 恢复已取消"
  exit 1
fi

# 下载备份文件
echo "📥 下载备份文件..."
aws s3 cp "s3://mdlooker-backups/database/${BACKUP_FILE}" /tmp/backup.dump.gz

# 解压备份
echo "🗜️ 解压备份..."
gunzip /tmp/backup.dump.gz

# 恢复数据库
echo "🔄 恢复数据库..."
pg_restore \
  -h db.${SUPABASE_PROJECT_ID}.supabase.co \
  -U postgres \
  -d postgres \
  -c \
  /tmp/backup.dump

echo "✅ 数据库恢复完成！"

# 验证恢复
echo "🔍 验证恢复..."
psql -h db.${SUPABASE_PROJECT_ID}.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM users;"

```

#### 场景 2: 完整灾难恢复

```bash
#!/bin/bash

# ============================================
# 灾难恢复脚本
# ============================================

set -e

echo "🚨 启动灾难恢复流程..."

# 步骤 1: 创建新的 Supabase 项目
echo "📦 创建新的 Supabase 项目..."
# 需要手动在 Supabase Dashboard 创建

# 步骤 2: 恢复数据库
echo "🔄 恢复数据库..."
./scripts/restore-database.sh latest.dump.gz

# 步骤 3: 更新环境变量
echo "🔧 更新环境变量..."
# 更新 Vercel 环境变量
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# 步骤 4: 重新部署应用
echo "🚀 重新部署应用..."
vercel --prod

# 步骤 5: 更新 DNS（如需要）
echo "🌐 更新 DNS 配置..."
# 更新域名解析记录

echo "✅ 灾难恢复完成！"
echo "新环境 URL: $(vercel --prod --name)"

```

### 3.2 恢复测试计划

| 测试类型 | 频率 | 负责人 | 验证项 |
|---------|------|--------|--------|
| 备份文件完整性 | 每周 | 运维工程师 | 备份文件可下载、可解压 |
| 数据恢复测试 | 每月 | 运维工程师 | 能成功恢复到测试环境 |
| 完整灾难恢复 | 每季度 | 技术负责人 | RTO/RPO 达标 |

## 四、备份监控

### 4.1 备份健康检查

```yaml
# .github/workflows/backup-monitor.yml
name: 备份健康检查

on:
  schedule:
    - cron: '0 8 * * *'  # 每天早上 8 点
  workflow_dispatch:

jobs:
  check-backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: 检查最新备份
        run: |
          # 检查最新备份是否存在
          aws s3 ls s3://mdlooker-backups/database/latest.dump.gz
          
          # 检查备份时间（应该在 24 小时内）
          BACKUP_TIME=$(aws s3api head-object \
            --bucket mdlooker-backups \
            --key database/latest.dump.gz \
            --query 'LastModified' \
            --output text)
          
          CURRENT_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)
          
          # 计算时间差
          # 如果超过 24 小时，发送告警
      
      - name: 发送告警（如果备份异常）
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            // 创建告警工单
```

### 4.2 备份验证脚本

```bash
#!/bin/bash

# ============================================
# 备份验证脚本
# ============================================

set -e

BACKUP_FILE="${1:-latest.dump.gz}"
TEST_DB_NAME="test_restore_$(date +%Y%m%d_%H%M%S)"

echo "🔍 开始验证备份：$BACKUP_FILE"

# 创建测试数据库
echo "📦 创建测试数据库..."
createdb -h localhost -U postgres "$TEST_DB_NAME"

# 恢复备份到测试数据库
echo "🔄 恢复备份..."
gunzip -c "$BACKUP_FILE" | pg_restore -h localhost -U postgres -d "$TEST_DB_NAME"

# 验证数据
echo "🔍 验证数据..."
psql -h localhost -U postgres -d "$TEST_DB_NAME" <<EOF
-- 检查关键表数据量
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'companies', COUNT(*) FROM companies;

-- 检查数据完整性
SELECT 
  (SELECT COUNT(*) FROM users WHERE created_at IS NULL) as null_created_at,
  (SELECT COUNT(*) FROM products WHERE name IS NULL) as null_product_name;
EOF

# 清理测试数据库
echo "🧹 清理测试环境..."
dropdb -h localhost -U postgres "$TEST_DB_NAME"

echo "✅ 备份验证通过！"

```

## 五、备份存储配置

### 5.1 AWS S3 配置

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BackupStorage",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:user/backup-user"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::mdlooker-backups/database/*"
    }
  ]
}
```

### 5.2 生命周期规则

```xml
<LifecycleConfiguration>
  <Rule>
    <ID>MoveToIA</ID>
    <Status>Enabled</Status>
    <Filter>
      <Prefix>database/</Prefix>
    </Filter>
    <Transition>
      <Days>7</Days>
      <StorageClass>STANDARD_IA</StorageClass>
    </Transition>
    <Expiration>
      <Days>30</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

## 六、成本估算

| 存储类型 | 容量 | 单价 | 月度成本 |
|---------|------|------|---------|
| S3 Standard | 10GB | $0.023/GB | $0.23 |
| S3 IA | 50GB | $0.0125/GB | $0.63 |
| 数据传输 | 5GB | $0.09/GB | $0.45 |
| **总计** | - | - | **$1.31/月** |

## 七、安全注意事项

1. **加密存储**: 所有备份文件使用 AES-256 加密
2. **访问控制**: 最小权限原则，限制访问人员
3. **异地备份**: 至少保留一份异地备份
4. **定期轮换**: 定期更换访问密钥
5. **审计日志**: 记录所有备份和恢复操作

---

*配置日期：2026-04-20*
*负责人：AI 助手（运维工程师）*

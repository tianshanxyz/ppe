# PPE Platform 数据库初始化脚本

## 数据库创建

```sql
-- 创建数据库
CREATE DATABASE ppe_platform;

-- 创建用户（可选）
CREATE USER ppe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE ppe_platform TO ppe_user;
```

## 基础表结构

### 1. 用户表

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 2. 角色表

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认角色
INSERT INTO roles (name, description, permissions) VALUES
('admin', '系统管理员', '["all:read", "all:write", "all:delete"]'),
('user', '普通用户', '["ppe:read", "regulations:read", "companies:read"]'),
('guest', '访客', '["ppe:read"]');
```

### 3. 权限表

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认权限
INSERT INTO permissions (name, resource, action, description) VALUES
('ppe:read', 'ppe', 'read', '读取 PPE 数据'),
('ppe:write', 'ppe', 'write', '写入 PPE 数据'),
('ppe:delete', 'ppe', 'delete', '删除 PPE 数据'),
('regulations:read', 'regulations', 'read', '读取法规数据'),
('regulations:write', 'regulations', 'write', '写入法规数据'),
('companies:read', 'companies', 'read', '读取企业数据'),
('companies:write', 'companies', 'write', '写入企业数据');
```

### 4. PPE 数据表

```sql
CREATE TABLE ppe_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    model VARCHAR(100),
    category VARCHAR(100),
    certification VARCHAR(100),
    country VARCHAR(100),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_ppe_name ON ppe_products(name);
CREATE INDEX idx_ppe_category ON ppe_products(category);
CREATE INDEX idx_ppe_country ON ppe_products(country);
CREATE INDEX idx_ppe_certification ON ppe_products(certification);
```

### 5. 法规数据表

```sql
CREATE TABLE regulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    jurisdiction VARCHAR(100),
    type VARCHAR(100),
    effective_date DATE,
    expiry_date DATE,
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_regulations_title ON regulations(title);
CREATE INDEX idx_regulations_jurisdiction ON regulations(jurisdiction);
CREATE INDEX idx_regulations_type ON regulations(type);
```

### 6. 企业数据表

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    type VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_country ON companies(country);
CREATE INDEX idx_companies_type ON companies(type);
```

### 7. 预警表

```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    severity VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
```

### 8. 审计日志表

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id UUID,
    ip_address VARCHAR(50),
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

## 数据库连接测试

```bash
# 使用 psql 连接
psql -h localhost -U postgres -d ppe_platform

# 或者使用 TypeORM 自动创建（开发环境）
npm run start:dev
```

## 注意事项

1. 生产环境请使用更安全的密码策略
2. 定期备份数据库
3. 启用数据库连接池
4. 配置适当的超时和重试机制

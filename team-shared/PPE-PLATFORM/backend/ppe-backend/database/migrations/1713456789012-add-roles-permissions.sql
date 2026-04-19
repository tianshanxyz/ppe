-- 迁移文件：添加角色和权限管理表
-- 执行时间：2026-04-18

-- 创建权限表
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 创建用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- 插入默认权限
INSERT INTO permissions (name, resource, action, description) VALUES
-- 用户管理权限
('user:read', 'user', 'read', '查看用户信息'),
('user:write', 'user', 'write', '修改用户信息'),
('user:delete', 'user', 'delete', '删除用户'),
('user:admin', 'user', 'admin', '用户管理权限'),

-- 角色权限
('role:read', 'role', 'read', '查看角色信息'),
('role:write', 'role', 'write', '修改角色信息'),
('role:delete', 'role', 'delete', '删除角色'),

-- PPE 数据权限
('ppe:read', 'ppe', 'read', '查看 PPE 数据'),
('ppe:write', 'ppe', 'write', '修改 PPE 数据'),
('ppe:delete', 'ppe', 'delete', '删除 PPE 数据'),
('ppe:search', 'ppe', 'search', '搜索 PPE 数据'),

-- 法规数据权限
('regulation:read', 'regulation', 'read', '查看法规数据'),
('regulation:write', 'regulation', 'write', '修改法规数据'),
('regulation:delete', 'regulation', 'delete', '删除法规数据'),

-- 企业数据权限
('company:read', 'company', 'read', '查看企业数据'),
('company:write', 'company', 'write', '修改企业数据'),
('company:delete', 'company', 'delete', '删除企业数据'),

-- 预警系统权限
('alert:read', 'alert', 'read', '查看预警信息'),
('alert:write', 'alert', 'write', '修改预警信息'),
('alert:delete', 'alert', 'delete', '删除预警信息')
ON CONFLICT (name) DO NOTHING;

-- 插入默认角色
INSERT INTO roles (name, description) VALUES
('admin', '系统管理员'),
('user', '普通用户'),
('guest', '访客')
ON CONFLICT (name) DO NOTHING;

-- 为 admin 角色分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 为 user 角色分配读权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user' AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 为 guest 角色分配基础读权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'guest' 
  AND p.resource IN ('ppe', 'regulation', 'company')
  AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 更新 users 表，添加角色字段（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

COMMENT ON COLUMN users.role IS '用户角色：admin, user, guest';

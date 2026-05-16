-- MDLooker User & Permission Tables
-- Run this SQL in Supabase SQL Editor

-- 1. Users table
CREATE TABLE IF NOT EXISTS mdlooker_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  company TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'editor', 'user', 'vip')),
  membership TEXT NOT NULL DEFAULT 'free' CHECK (membership IN ('free', 'professional', 'enterprise')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Quotas table
CREATE TABLE IF NOT EXISTS mdlooker_quotas (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES mdlooker_users(id) ON DELETE CASCADE,
  user_role TEXT NOT NULL DEFAULT 'guest',
  metric TEXT NOT NULL CHECK (metric IN ('searches', 'downloads', 'trackerProducts')),
  count INTEGER NOT NULL DEFAULT 0,
  last_reset TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 year',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, metric)
);

-- 3. Permission log table
CREATE TABLE IF NOT EXISTS mdlooker_permission_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  user_role TEXT NOT NULL DEFAULT 'guest',
  action TEXT NOT NULL CHECK (action IN ('search', 'download', 'tracker_add', 'tracker_remove', 'quota_exceeded', 'quota_reset', 'role_change')),
  resource TEXT NOT NULL DEFAULT '',
  allowed BOOLEAN NOT NULL DEFAULT true,
  reason TEXT NOT NULL DEFAULT '',
  quota_before INTEGER,
  quota_after INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Articles table
CREATE TABLE IF NOT EXISTS mdlooker_articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_zh TEXT DEFAULT '',
  content TEXT NOT NULL,
  content_zh TEXT DEFAULT '',
  author_id TEXT NOT NULL REFERENCES mdlooker_users(id),
  author_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
  category TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_comment TEXT DEFAULT ''
);

-- 5. Content changes table
CREATE TABLE IF NOT EXISTS mdlooker_content_changes (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'company')),
  target_id TEXT NOT NULL,
  target_name TEXT NOT NULL DEFAULT '',
  field_name TEXT NOT NULL,
  old_value JSONB DEFAULT 'null',
  new_value JSONB DEFAULT 'null',
  submitted_by TEXT NOT NULL REFERENCES mdlooker_users(id),
  submitted_by_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'rolled_back')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  review_comment TEXT DEFAULT '',
  rollback_id TEXT
);

-- 6. Audit log table
CREATE TABLE IF NOT EXISTS mdlooker_audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  change_id TEXT,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'company', 'article')),
  target_id TEXT NOT NULL,
  field_name TEXT DEFAULT '',
  old_value JSONB DEFAULT 'null',
  new_value JSONB DEFAULT 'null',
  action TEXT NOT NULL CHECK (action IN ('approved', 'rolled_back', 'published')),
  performed_by TEXT NOT NULL,
  performed_by_name TEXT NOT NULL DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotas_user_metric ON mdlooker_quotas(user_id, metric);
CREATE INDEX IF NOT EXISTS idx_perm_log_user ON mdlooker_permission_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_status ON mdlooker_articles(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_changes_status ON mdlooker_content_changes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON mdlooker_audit_log(target_type, target_id);

-- Disable RLS for service role access (we use service role key)
ALTER TABLE mdlooker_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdlooker_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdlooker_permission_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdlooker_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdlooker_content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdlooker_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON mdlooker_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mdlooker_quotas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mdlooker_permission_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mdlooker_articles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mdlooker_content_changes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON mdlooker_audit_log FOR ALL USING (true) WITH CHECK (true);

-- Insert admin user (password: freeman@h-guardian.com)
INSERT INTO mdlooker_users (id, email, password_hash, name, company, role, membership, created_at)
VALUES (
  'admin_freeman',
  'freeman@h-guardian.com',
  '$2b$12$Desa/pgMYKOwh8lmDk/mJeWDbB2bAPfZeAlDvnVTUHw9W1IUeHErm',
  'Freeman',
  'H-Guardian',
  'admin',
  'enterprise',
  NOW()
) ON CONFLICT (id) DO NOTHING;
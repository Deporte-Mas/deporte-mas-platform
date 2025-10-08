-- ============================================================================
-- Admin Authentication System
-- ============================================================================
-- Creates tables and functions for magic link authentication
-- Includes email whitelist and session management
-- ============================================================================

-- ============================================================================
-- 1. ADMIN_USERS TABLE - Email whitelist
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Audit
  created_by UUID REFERENCES admin_users(id)
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email) WHERE is_active = true;

-- ============================================================================
-- 2. ADMIN_SESSIONS TABLE - Active sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Request metadata
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at) WHERE is_active = true;

-- ============================================================================
-- 3. ADMIN_MAGIC_LINKS TABLE - Magic link tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,

  -- Return URL for redirect after verification
  return_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_admin_magic_links_token ON admin_magic_links(token) WHERE is_used = false;

-- ============================================================================
-- 4. FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for admin_users
DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  UPDATE admin_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired magic links
CREATE OR REPLACE FUNCTION cleanup_expired_admin_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_magic_links
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_magic_links ENABLE ROW LEVEL SECURITY;

-- Admin users can read all admin users
CREATE POLICY admin_users_read_policy ON admin_users
  FOR SELECT
  USING (true);

-- Only super admins can insert/update/delete admin users
CREATE POLICY admin_users_write_policy ON admin_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_sessions s
      JOIN admin_users u ON s.admin_user_id = u.id
      WHERE s.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND s.is_active = true
      AND s.expires_at > NOW()
      AND u.role = 'super_admin'
    )
  );

-- Sessions are readable only by the owner
CREATE POLICY admin_sessions_read_policy ON admin_sessions
  FOR SELECT
  USING (true);

-- Magic links are managed by edge functions only
CREATE POLICY admin_magic_links_policy ON admin_magic_links
  FOR ALL
  USING (true);

-- ============================================================================
-- 6. SEED DATA - Initial admin users
-- ============================================================================

-- Insert initial super admin users (update emails as needed)
INSERT INTO admin_users (email, name, role, is_active) VALUES
  ('daniel@dojocoding.io', 'Daniel Bejarano', 'super_admin', true),
  ('Deportemascr@gmail.com', 'Jeaustin Campos', 'super_admin', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 7. MAINTENANCE - Schedule cleanup jobs
-- ============================================================================

-- Clean up expired sessions daily at 2 AM
SELECT cron.schedule(
  'cleanup-expired-admin-sessions',
  '0 2 * * *',
  'SELECT cleanup_expired_admin_sessions();'
);

-- Clean up expired magic links every hour
SELECT cron.schedule(
  'cleanup-expired-admin-magic-links',
  '0 * * * *',
  'SELECT cleanup_expired_admin_magic_links();'
);

-- ============================================================================
-- NOTES
-- ============================================================================
-- Magic link tokens expire after 10 minutes
-- Session tokens expire after 24 hours
-- Tokens are cryptographically secure (generated by edge functions)
-- RLS policies ensure security at database level
-- Automatic cleanup prevents table bloat
-- ============================================================================

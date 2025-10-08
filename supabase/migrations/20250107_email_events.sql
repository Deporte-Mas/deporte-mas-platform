-- ============================================================================
-- Email Events Tracking Migration
-- ============================================================================
-- Tracks Resend email events for delivery monitoring and debugging
-- ============================================================================

-- ============================================================================
-- 1. CREATE EMAIL EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'email.sent',
    'email.delivered',
    'email.delivery_delayed',
    'email.complained',
    'email.bounced',
    'email.opened',
    'email.clicked',
    'email.failed'
  )),
  resend_email_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_email_id) WHERE resend_email_id IS NOT NULL;

-- ============================================================================
-- 3. ADD MISSING INDEXES TO USERS TABLE (IF NOT EXISTS)
-- ============================================================================

-- These should already exist from previous migrations, but adding for safety
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own email events
CREATE POLICY "Users can view own email events" ON email_events
  FOR SELECT USING (
    auth.uid() = user_id OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Service role can insert/update (for webhooks)
CREATE POLICY "Service role can manage email events" ON email_events
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 5. GRANTS
-- ============================================================================

GRANT SELECT ON email_events TO authenticated;
GRANT ALL ON email_events TO service_role;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON TABLE email_events IS 'Tracks Resend email delivery events for monitoring and debugging';
COMMENT ON COLUMN email_events.event_type IS 'Resend webhook event type';
COMMENT ON COLUMN email_events.resend_email_id IS 'Resend email ID for tracking';
COMMENT ON COLUMN email_events.metadata IS 'Additional event data from Resend webhook';

-- ============================================================================
-- DeporteMás Platform - Subscription Architecture Migration
-- ============================================================================
-- Implements optimal subscription architecture with Stripe integration
-- Creates subscription cache and webhook event tracking
-- ============================================================================

-- ============================================================================
-- 1. CREATE SUBSCRIPTION CACHE TABLE
-- ============================================================================

-- Minimal subscription cache for fast access control
CREATE TABLE IF NOT EXISTS subscription_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Essential cached fields for access control
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Sync metadata for reliability
  stripe_updated_at TIMESTAMPTZ NOT NULL,
  last_webhook_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. CREATE STRIPE EVENTS TABLE
-- ============================================================================

-- Store webhook events for idempotency and debugging
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate from is_active_subscriber (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active_subscriber') THEN
    -- For users with stripe_customer_id but no active subscription cache
    INSERT INTO subscription_cache (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      status,
      current_period_start,
      current_period_end,
      stripe_updated_at
    )
    SELECT
      u.id,
      COALESCE(u.stripe_subscription_id, 'migration_' || u.id), -- Safe migration ID
      u.stripe_customer_id,
      CASE
        WHEN u.is_active_subscriber = true THEN 'active'
        ELSE 'canceled'
      END,
      COALESCE(u.subscription_started_at, u.created_at),
      CASE
        WHEN u.is_active_subscriber = true THEN NOW() + INTERVAL '30 days' -- Default 30 days
        ELSE NOW() - INTERVAL '1 day'
      END,
      NOW()
    FROM users u
    WHERE u.stripe_customer_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM subscription_cache sc
      WHERE sc.user_id = u.id
    );
  END IF;
END $$;

-- ============================================================================
-- 4. UPDATE RLS POLICIES - USE CACHE FOR ACCESS CONTROL
-- ============================================================================

-- Update video access policy to use subscription cache
DROP POLICY IF EXISTS "Videos require subscription access" ON videos;
CREATE POLICY "Videos require subscription access" ON videos
  FOR SELECT USING (
    CASE
      WHEN is_public = true THEN true
      WHEN requires_subscription = true THEN
        EXISTS (
          SELECT 1 FROM subscription_cache
          WHERE user_id = auth.uid()
          AND status IN ('active', 'trialing')
          AND current_period_end > NOW()
        )
      ELSE true
    END
  );

-- Update course access policy
DROP POLICY IF EXISTS "Courses require subscription access" ON courses;
CREATE POLICY "Courses require subscription access" ON courses
  FOR SELECT USING (
    CASE
      WHEN is_public = true THEN true
      WHEN requires_subscription = true THEN
        EXISTS (
          SELECT 1 FROM subscription_cache
          WHERE user_id = auth.uid()
          AND status IN ('active', 'trialing')
          AND current_period_end > NOW()
        )
      ELSE true
    END
  );

-- Update chat policy
DROP POLICY IF EXISTS "Chat requires active subscription" ON chat_messages;
DROP POLICY IF EXISTS "Chat requires active Stripe subscription" ON chat_messages;
CREATE POLICY "Chat requires active subscription" ON chat_messages
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM subscription_cache
      WHERE user_id = auth.uid()
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
    )
  );

-- Update giveaway policy
DROP POLICY IF EXISTS "Giveaways require active subscription" ON giveaway_entries;
DROP POLICY IF EXISTS "Giveaways require active Stripe subscription" ON giveaway_entries;
CREATE POLICY "Giveaways require active subscription" ON giveaway_entries
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM subscription_cache
      WHERE user_id = auth.uid()
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
    )
  );

-- ============================================================================
-- 5. CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Index for fast access control checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_cache_user_active
ON subscription_cache(user_id)
WHERE status IN ('active', 'trialing') AND current_period_end > NOW();

-- Index for Stripe integration
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_cache_stripe_subscription
ON subscription_cache(stripe_subscription_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscription_cache_stripe_customer
ON subscription_cache(stripe_customer_id);

-- Index for webhook processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_events_unprocessed
ON stripe_events(created_at)
WHERE processed = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stripe_events_type
ON stripe_events(type, created_at);

-- ============================================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get user subscription status (simplified)
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  user_id UUID,
  stripe_customer_id TEXT,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.user_id,
    sc.stripe_customer_id,
    sc.status,
    sc.current_period_end,
    (sc.status IN ('active', 'trialing') AND sc.current_period_end > NOW()) as is_active
  FROM subscription_cache sc
  WHERE sc.user_id = COALESCE(get_user_subscription_status.user_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription (for Edge Functions)
CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  is_active BOOLEAN := false;
BEGIN
  SELECT (status IN ('active', 'trialing') AND current_period_end > NOW())
  INTO is_active
  FROM subscription_cache
  WHERE subscription_cache.user_id = has_active_subscription.user_id;

  RETURN COALESCE(is_active, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update subscription cache (called by webhooks)
CREATE OR REPLACE FUNCTION update_subscription_cache(
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMPTZ,
  p_current_period_end TIMESTAMPTZ,
  p_cancel_at_period_end BOOLEAN DEFAULT false,
  p_stripe_updated_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by stripe_customer_id
  SELECT id INTO target_user_id
  FROM users
  WHERE stripe_customer_id = p_stripe_customer_id;

  IF target_user_id IS NOT NULL THEN
    -- Upsert subscription cache
    INSERT INTO subscription_cache (
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      stripe_updated_at,
      last_webhook_at
    )
    VALUES (
      target_user_id,
      p_stripe_subscription_id,
      p_stripe_customer_id,
      p_status,
      p_current_period_start,
      p_current_period_end,
      p_cancel_at_period_end,
      p_stripe_updated_at,
      NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_start = EXCLUDED.current_period_start,
      current_period_end = EXCLUDED.current_period_end,
      cancel_at_period_end = EXCLUDED.cancel_at_period_end,
      stripe_updated_at = EXCLUDED.stripe_updated_at,
      last_webhook_at = EXCLUDED.last_webhook_at,
      updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscription_cache_updated_at ON subscription_cache;
CREATE TRIGGER update_subscription_cache_updated_at
  BEFORE UPDATE ON subscription_cache
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. RLS POLICIES FOR NEW TABLES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE subscription_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription cache
CREATE POLICY "Users can view own subscription cache" ON subscription_cache
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all data
CREATE POLICY "Service role can manage subscription cache" ON subscription_cache
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage stripe events" ON stripe_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 9. ANALYTICS VIEWS
-- ============================================================================

-- Subscription metrics view
CREATE OR REPLACE VIEW subscription_metrics AS
SELECT
  COUNT(*) as total_subscriptions,
  COUNT(*) FILTER (WHERE status = 'active') as active_subscriptions,
  COUNT(*) FILTER (WHERE status = 'trialing') as trial_subscriptions,
  COUNT(*) FILTER (WHERE status = 'past_due') as past_due_subscriptions,
  COUNT(*) FILTER (WHERE status = 'canceled') as canceled_subscriptions,
  COUNT(*) FILTER (WHERE status IN ('active', 'trialing') AND current_period_end > NOW()) as currently_active
FROM subscription_cache;

-- User engagement with subscription status
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT
  u.id,
  u.email,
  sc.status as subscription_status,
  sc.current_period_end,
  (sc.status IN ('active', 'trialing') AND sc.current_period_end > NOW()) as is_currently_active,
  u.total_points_earned,
  COUNT(DISTINCT sv.stream_id) as streams_watched,
  COUNT(DISTINCT COALESCE(up.video_id, up.lesson_id)) as content_viewed,
  SUM(up.watch_time) as total_watch_time,
  COUNT(DISTINCT cm.id) as chat_messages_sent,
  COUNT(DISTINCT pv.poll_id) as polls_participated,
  COUNT(DISTINCT ge.giveaway_id) as giveaways_entered
FROM users u
LEFT JOIN subscription_cache sc ON u.id = sc.user_id
LEFT JOIN stream_viewers sv ON u.id = sv.user_id
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id AND cm.is_deleted = false
LEFT JOIN poll_votes pv ON u.id = pv.user_id
LEFT JOIN giveaway_entries ge ON u.id = ge.user_id
GROUP BY u.id, u.email, sc.status, sc.current_period_end, u.total_points_earned;

-- ============================================================================
-- 10. REMOVE OLD SUBSCRIPTION FIELDS AND TABLES
-- ============================================================================

-- Remove the temporary simplified field (now replaced by subscription_cache)
ALTER TABLE users DROP COLUMN IF EXISTS is_active_subscriber;

-- Also remove any remaining old subscription fields that might exist
ALTER TABLE users DROP COLUMN IF EXISTS subscription_status;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE users DROP COLUMN IF EXISTS plan_type;
ALTER TABLE users DROP COLUMN IF EXISTS subscription_ends_at;
ALTER TABLE users DROP COLUMN IF EXISTS stripe_subscription_id;

-- Keep these fields as they're still useful:
-- - stripe_customer_id (needed for Stripe integration)
-- - subscription_started_at (useful for analytics)

-- Drop old complex tables (if they exist)
-- Drop policies first
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage payments" ON payments;

-- Drop triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

-- Drop indexes
DROP INDEX IF EXISTS idx_subscriptions_stripe_subscription_id;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_status;
DROP INDEX IF EXISTS idx_payments_stripe_invoice_id;
DROP INDEX IF EXISTS idx_payments_user_id;
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_users_subscription_status;

-- Drop the complex tables (if they exist)
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payments CASCADE;

-- ============================================================================
-- 11. PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT ON public.subscription_cache TO authenticated;
GRANT SELECT ON public.stripe_events TO authenticated;
GRANT SELECT ON public.subscription_metrics TO authenticated;
GRANT SELECT ON public.user_engagement_summary TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_cache TO authenticated;

-- Remove permissions for dropped tables
REVOKE ALL ON subscriptions FROM authenticated, anon;
REVOKE ALL ON payments FROM authenticated, anon;

-- ============================================================================
-- 12. VERIFICATION FUNCTION
-- ============================================================================

-- Function to verify the implementation was successful
CREATE OR REPLACE FUNCTION verify_optimal_subscription_architecture()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  table_count INTEGER;
  column_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Check if new tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('subscription_cache', 'stripe_events');

  IF table_count = 2 THEN
    result := result || 'OK: New subscription tables created. ';
  ELSE
    result := result || 'ERROR: Missing new subscription tables. ';
  END IF;

  -- Check if old tables are removed
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'payments');

  IF table_count = 0 THEN
    result := result || 'OK: Old subscription tables removed. ';
  ELSE
    result := result || 'WARNING: Old subscription tables still exist. ';
  END IF;

  -- Check if old columns are removed from users table
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('is_active_subscriber', 'subscription_status', 'subscription_tier', 'plan_type', 'subscription_ends_at', 'stripe_subscription_id');

  IF column_count = 0 THEN
    result := result || 'OK: Old subscription columns removed from users table. ';
  ELSE
    result := result || 'WARNING: Old subscription columns still exist in users table. ';
  END IF;

  -- Check if helper functions exist
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_subscription_status', 'has_active_subscription', 'update_subscription_cache');

  IF function_count = 3 THEN
    result := result || 'OK: Helper functions created. ';
  ELSE
    result := result || 'ERROR: Missing helper functions. ';
  END IF;

  -- Check if essential indexes exist
  SELECT COUNT(*) INTO table_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND tablename = 'subscription_cache'
  AND indexname = 'idx_subscription_cache_user_active';

  IF table_count = 1 THEN
    result := result || 'OK: Performance indexes created. ';
  ELSE
    result := result || 'WARNING: Performance indexes missing. ';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Run verification
SELECT verify_optimal_subscription_architecture() as implementation_status;

-- ============================================================================
-- COMPLETION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Optimal subscription architecture implemented';
  RAISE NOTICE 'Created: subscription_cache table for fast access control';
  RAISE NOTICE 'Created: stripe_events table for webhook reliability';
  RAISE NOTICE 'Updated: All RLS policies to use subscription cache';
  RAISE NOTICE 'Added: Helper functions for subscription management';
  RAISE NOTICE 'Removed: Old complex subscription and payment tables';
  RAISE NOTICE 'Cleaned: Users table of unnecessary subscription fields';
  RAISE NOTICE 'Next: Update webhook handler and Edge Functions to use new system';
  RAISE NOTICE 'Architecture: Smart hybrid with minimal cache + maximum Stripe leverage';
END $$;
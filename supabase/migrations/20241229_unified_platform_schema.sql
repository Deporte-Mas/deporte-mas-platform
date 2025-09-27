-- ============================================================================
-- DeporteMás Platform - Unified Database Schema Migration
-- ============================================================================
-- Consolidates all migrations into a single comprehensive schema
-- Creates complete platform with integrated Web3 capabilities
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================================
-- 1. CORE USERS TABLE
-- ============================================================================
-- Create users table integrated with Supabase Auth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Basic Profile
  name TEXT,
  phone TEXT,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  country TEXT,

  -- Subscription Management
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive', -- active, canceled, past_due, trialing
  subscription_tier TEXT DEFAULT 'free', -- free, premium
  plan_type TEXT DEFAULT 'monthly', -- monthly, annual
  subscription_started_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Web3 Integration
  wallet_address TEXT UNIQUE,
  wallet_provider TEXT DEFAULT 'cavos',
  wallet_created_at TIMESTAMPTZ,

  -- Points Tracking (synced from blockchain)
  total_points_earned INTEGER DEFAULT 0,
  total_points_spent INTEGER DEFAULT 0,

  -- User Preferences
  team_badges TEXT[], -- Array of team IDs user supports
  preferred_language TEXT DEFAULT 'es',
  notification_preferences JSONB DEFAULT '{}',

  -- Social Integration
  facebook_user_id TEXT,
  facebook_group_member BOOLEAN DEFAULT false,

  -- System Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe Integration
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Subscription Status
  status TEXT NOT NULL, -- active, canceled, past_due, incomplete, trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Billing Information
  price_amount INTEGER NOT NULL, -- Amount in colones (CRC)
  price_currency TEXT DEFAULT 'CRC',
  billing_interval TEXT, -- month, year

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. TEAMS TABLE - Sports teams for badges
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT, -- CR, LDA, etc.
  logo_url TEXT,
  sport TEXT DEFAULT 'football',
  country TEXT DEFAULT 'Costa Rica',
  league TEXT,

  -- Badge Configuration
  is_active BOOLEAN DEFAULT true,
  badge_color TEXT,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. STREAMS TABLE - Live streaming management
-- ============================================================================
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Stream Status
  status TEXT DEFAULT 'scheduled', -- scheduled, live, ended, archived
  scheduled_start TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,

  -- RTMP Configuration
  stream_key TEXT UNIQUE,
  rtmp_url TEXT,
  playback_url TEXT,

  -- VOD Conversion
  vod_url TEXT,
  vod_duration INTEGER, -- Duration in seconds
  vod_available BOOLEAN DEFAULT false,
  mux_asset_id TEXT,

  -- Analytics
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  chat_messages_count INTEGER DEFAULT 0,
  average_watch_time INTEGER DEFAULT 0,

  -- Content Metadata
  panelists TEXT[], -- Array of panelist names
  topics TEXT[], -- Array of discussion topics
  category TEXT, -- match_analysis, interview, q_and_a, etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. CHAT_MESSAGES TABLE - Real-time stream chat
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Message Content
  content TEXT NOT NULL,
  type TEXT DEFAULT 'message', -- message, announcement, poll, system

  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID REFERENCES users(id),
  deleted_reason TEXT,
  is_pinned BOOLEAN DEFAULT false,

  -- Engagement Features
  reactions JSONB DEFAULT '{}', -- {emoji: count} mapping
  reply_to UUID REFERENCES chat_messages(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. VIDEOS TABLE - Simple Mux video hosting
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Mux Integration (this is all we need for video hosting)
  mux_asset_id TEXT UNIQUE,
  mux_playback_id TEXT,
  duration INTEGER, -- Duration in seconds

  -- Simple status tracking
  status TEXT DEFAULT 'processing', -- processing, ready, error

  -- Simple access control
  is_public BOOLEAN DEFAULT false,
  requires_subscription BOOLEAN DEFAULT true,

  -- Analytics (simplified)
  view_count INTEGER DEFAULT 0,

  -- Relations
  stream_id UUID REFERENCES streams(id), -- If converted from live stream

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. COURSES TABLE - Course definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,

  -- Simple access control
  is_published BOOLEAN DEFAULT false,
  requires_subscription BOOLEAN DEFAULT true,

  -- Ordering
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. COURSE_MODULES TABLE - Course sections/chapters
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,

  -- Ordering within course
  order_index INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_id, order_index)
);

-- ============================================================================
-- 10. COURSE_LESSONS TABLE - Individual lessons in modules
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id), -- Link to video content

  title TEXT NOT NULL,
  description TEXT,

  -- Ordering within module
  order_index INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(module_id, order_index)
);

-- ============================================================================
-- 11. POINTS_LEDGER TABLE - Point transaction history
-- ============================================================================
CREATE TABLE IF NOT EXISTS points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Transaction Details
  amount INTEGER NOT NULL, -- Positive for credit, negative for debit
  blockchain_balance_after INTEGER, -- Balance on blockchain after transaction

  -- Transaction Classification
  transaction_type TEXT NOT NULL, -- yield, engagement, spend, refund, admin
  category TEXT, -- stream_watch, chat, poll, giveaway_entry, content_unlock

  -- Web3 Integration
  blockchain_tx_hash TEXT UNIQUE,
  contract_address TEXT,

  -- References
  reference_type TEXT, -- stream, content, giveaway
  reference_id UUID,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. ENGAGEMENT_ACTIVITIES TABLE - User activity tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS engagement_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Activity Classification
  activity_type TEXT NOT NULL, -- stream_watch, chat, poll, share, content_view
  activity_category TEXT,

  -- Point Rewards
  points_earned INTEGER DEFAULT 0,
  daily_limit INTEGER, -- Daily limit for this activity type
  current_daily_count INTEGER DEFAULT 1,

  -- References
  reference_type TEXT,
  reference_id UUID,

  -- Tracking Data
  duration INTEGER, -- For time-based activities (seconds)
  completion_percentage INTEGER, -- For content consumption
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. STREAM_VIEWERS TABLE - Live viewer analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Session Tracking
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  total_watch_time INTEGER DEFAULT 0, -- Seconds

  -- Engagement During Stream
  chat_messages_sent INTEGER DEFAULT 0,
  reactions_given INTEGER DEFAULT 0,

  -- Analytics
  peak_concurrent_position INTEGER, -- Position in peak viewer list

  UNIQUE(stream_id, user_id, joined_at)
);

-- ============================================================================
-- 14. GIVEAWAYS TABLE - Prize management
-- ============================================================================
CREATE TABLE IF NOT EXISTS giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,

  -- Prize Information
  prize_type TEXT NOT NULL, -- physical, nft, points, experience
  prize_details JSONB NOT NULL,
  prize_value INTEGER, -- Estimated value in colones

  -- Giveaway Status
  status TEXT DEFAULT 'draft', -- draft, active, ended, completed
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,

  -- Entry Configuration
  entry_requirements JSONB DEFAULT '{}', -- {min_loyalty_tier: 1, subscription_required: true}
  base_entries INTEGER DEFAULT 1, -- Free entries for eligible users
  points_per_entry INTEGER DEFAULT 100, -- Cost for additional entries
  max_entries_per_user INTEGER DEFAULT 10,

  -- Winner Selection
  number_of_winners INTEGER DEFAULT 1,
  winner_user_ids UUID[],
  selection_method TEXT DEFAULT 'random', -- random, lottery
  selection_tx_hash TEXT, -- Blockchain verification

  -- Analytics
  total_entries INTEGER DEFAULT 0,
  unique_participants INTEGER DEFAULT 0,
  total_points_spent INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 15. GIVEAWAY_ENTRIES TABLE - Entry tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Entry Calculation
  entry_count INTEGER DEFAULT 1,
  bonus_entries INTEGER DEFAULT 0, -- From activities or membership duration
  membership_duration_multiplier DECIMAL DEFAULT 1.0,
  total_entries INTEGER GENERATED ALWAYS AS
    ((entry_count + bonus_entries) * membership_duration_multiplier) STORED,

  -- Cost Tracking
  points_spent INTEGER DEFAULT 0,
  entry_method TEXT, -- automatic, points, activity_bonus

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(giveaway_id, user_id)
);

-- ============================================================================
-- 16. POLLS TABLE - Community voting
-- ============================================================================
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,

  -- Poll Configuration
  type TEXT NOT NULL, -- multiple_choice, yes_no, rating, ranking
  options JSONB NOT NULL, -- [{id: "1", text: "Option A", image_url: "..."}]

  -- Status and Timing
  status TEXT DEFAULT 'draft', -- draft, active, closed, results
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  -- Context
  stream_id UUID REFERENCES streams(id), -- If poll is during stream
  video_id UUID REFERENCES videos(id), -- If poll is about a video
  course_id UUID REFERENCES courses(id), -- If poll is about a course

  -- Results
  results JSONB DEFAULT '{}', -- {option_id: vote_count}
  total_votes INTEGER DEFAULT 0,

  -- Settings
  allow_multiple_selection BOOLEAN DEFAULT false,
  show_results_live BOOLEAN DEFAULT false,
  anonymous_voting BOOLEAN DEFAULT false,
  points_reward INTEGER DEFAULT 25, -- Points for participation

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 17. POLL_VOTES TABLE - Vote tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Vote Data
  selected_options TEXT[], -- Array of option IDs
  comment TEXT, -- Optional comment with vote

  -- Metadata
  voted_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(poll_id, user_id)
);

-- ============================================================================
-- 18. USER_PROGRESS TABLE - Video and lesson progress tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Content References (can track either videos or lessons)
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,

  -- Progress Tracking
  progress_percentage INTEGER DEFAULT 0, -- 0-100
  watch_time INTEGER DEFAULT 0, -- Total seconds watched
  last_position INTEGER DEFAULT 0, -- Last position in seconds

  -- Completion Status
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  -- Session Tracking
  session_count INTEGER DEFAULT 1,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Either video_id OR lesson_id must be set, not both
  CHECK ((video_id IS NOT NULL AND lesson_id IS NULL) OR (video_id IS NULL AND lesson_id IS NOT NULL)),
  UNIQUE(user_id, video_id, lesson_id)
);

-- ============================================================================
-- 19. NOTIFICATIONS TABLE - Push/email notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Notification Content
  type TEXT NOT NULL, -- stream_start, giveaway_win, points_earned, content_available
  title TEXT NOT NULL,
  body TEXT,

  -- Action and Data
  action_url TEXT, -- Deep link for mobile app
  metadata JSONB DEFAULT '{}',

  -- Status Tracking
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery Status
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Priority and Expiry
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 20. ADMIN_ACTIONS TABLE - Audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id),

  -- Action Details
  action_type TEXT NOT NULL, -- user_ban, content_moderate, giveaway_create
  target_type TEXT, -- user, content, stream, giveaway
  target_id UUID,

  -- Action Description
  description TEXT,
  reason TEXT,
  severity TEXT DEFAULT 'normal', -- low, normal, high, critical

  -- Results
  success BOOLEAN DEFAULT true,
  result_data JSONB DEFAULT '{}',

  -- Audit Trail
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- User optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_subscription_status ON users(subscription_status) WHERE subscription_status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_wallet_address ON users(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Subscription optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Payment optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_stripe_invoice_id ON payments(stripe_invoice_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);

-- Video optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_status ON videos(status, created_at) WHERE status = 'ready';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_mux_asset ON videos(mux_asset_id) WHERE mux_asset_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_stream ON videos(stream_id) WHERE stream_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_search ON videos USING gin(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- Course optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published ON courses(is_published, created_at) WHERE is_published = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_search ON courses USING gin(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_modules_course ON course_modules(course_id, order_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id, order_index);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_lessons_video ON course_lessons(video_id) WHERE video_id IS NOT NULL;

-- Streaming optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_streams_status_start ON streams(status, scheduled_start) WHERE status IN ('scheduled', 'live');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_stream_time ON chat_messages(stream_id, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stream_viewers_stream_user ON stream_viewers(stream_id, user_id);

-- Points optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_user_date ON points_ledger(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_type ON points_ledger(transaction_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_points_ledger_tx_hash ON points_ledger(blockchain_tx_hash) WHERE blockchain_tx_hash IS NOT NULL;

-- Giveaway optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_giveaways_status_end ON giveaways(status, ends_at) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_giveaway_entries_user ON giveaway_entries(user_id, giveaway_id);

-- Engagement optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_engagement_user_type ON engagement_activities(user_id, activity_type, created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_video ON user_progress(user_id, video_id) WHERE video_id IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_lesson ON user_progress(user_id, lesson_id) WHERE lesson_id IS NOT NULL;

-- Poll optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_status ON polls(status, ends_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_poll_votes_poll_user ON poll_votes(poll_id, user_id);

-- ============================================================================
-- AUTOMATED FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_streams_updated_at ON streams;
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_modules_updated_at ON course_modules;
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON course_lessons;
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON course_lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_giveaways_updated_at ON giveaways;
CREATE TRIGGER update_giveaways_updated_at BEFORE UPDATE ON giveaways
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_giveaway_entries_updated_at ON giveaway_entries;
CREATE TRIGGER update_giveaway_entries_updated_at BEFORE UPDATE ON giveaway_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_polls_updated_at ON polls;
CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTH INTEGRATION FUNCTIONS
-- ============================================================================

-- Function to automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  subscription_status TEXT,
  plan_type TEXT,
  current_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.subscription_status,
    u.plan_type,
    s.current_period_end
  FROM users u
  LEFT JOIN subscriptions s ON u.stripe_subscription_id = s.stripe_subscription_id
  WHERE u.id = COALESCE(user_id, auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
  user_name TEXT DEFAULT NULL,
  user_phone TEXT DEFAULT NULL,
  user_country TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  updated_user users%ROWTYPE;
BEGIN
  UPDATE users SET
    name = COALESCE(user_name, name),
    phone = COALESCE(user_phone, phone),
    country = COALESCE(user_country, country),
    updated_at = NOW()
  WHERE id = auth.uid()
  RETURNING * INTO updated_user;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found or unauthorized';
  END IF;

  RETURN json_build_object(
    'id', updated_user.id,
    'email', updated_user.email,
    'name', updated_user.name,
    'phone', updated_user.phone,
    'country', updated_user.country,
    'subscription_status', updated_user.subscription_status,
    'plan_type', updated_user.plan_type,
    'updated_at', updated_user.updated_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment stream chat count
CREATE OR REPLACE FUNCTION increment_chat_count(stream_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE streams
  SET chat_messages_count = chat_messages_count + 1,
      updated_at = NOW()
  WHERE id = stream_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER POLICIES
-- ============================================================================

-- Users can manage their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- SUBSCRIPTION POLICIES - STRIPE-BASED ACCESS CONTROL
-- ============================================================================

-- Video access control (PRIMARY ACCESS CONTROL)
CREATE POLICY "Videos require subscription access" ON videos
  FOR SELECT USING (
    CASE
      WHEN is_public = true THEN true
      WHEN requires_subscription = true THEN
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND subscription_status = 'active'
          AND subscription_ends_at > NOW()
        )
      ELSE true
    END
  );

-- Course access control
CREATE POLICY "Courses require subscription access" ON courses
  FOR SELECT USING (
    CASE
      WHEN is_public = true THEN true
      WHEN requires_subscription = true THEN
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND subscription_status = 'active'
          AND subscription_ends_at > NOW()
        )
      ELSE true
    END
  );

-- Chat requires active Stripe subscription
CREATE POLICY "Chat requires active Stripe subscription" ON chat_messages
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND subscription_status = 'active'
      AND subscription_ends_at > NOW()
    )
  );

-- Giveaway participation requires Stripe subscription
CREATE POLICY "Giveaways require active Stripe subscription" ON giveaway_entries
  FOR INSERT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND subscription_status = 'active'
      AND subscription_ends_at > NOW()
    )
  );

-- ============================================================================
-- USER DATA PRIVACY POLICIES
-- ============================================================================

-- Users can only view their own data
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own data" ON points_ledger
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own data" ON engagement_activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own data" ON user_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own data" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own data" ON stream_viewers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own data" ON giveaway_entries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own data" ON poll_votes
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- PUBLIC READ ACCESS POLICIES
-- ============================================================================

-- Public read access for non-sensitive data
CREATE POLICY "Public read access" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON streams
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON videos
  FOR SELECT USING (status = 'ready');

CREATE POLICY "Public read access" ON courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public read access" ON course_modules
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON course_lessons
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON giveaways
  FOR SELECT USING (status = 'active');

CREATE POLICY "Public read access" ON polls
  FOR SELECT USING (status IN ('active', 'results'));

-- ============================================================================
-- SERVICE ROLE POLICIES
-- ============================================================================

-- Service role can access all data for backend operations
CREATE POLICY "Service role can manage users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access" ON points_ledger
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access" ON engagement_activities
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role access" ON notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- ADMIN POLICIES
-- ============================================================================

-- Admin access policies
CREATE POLICY "Admin access" ON admin_actions
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

-- Admins can manage content
CREATE POLICY "Admin video management" ON videos
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

CREATE POLICY "Admin course management" ON courses
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

CREATE POLICY "Admin course module management" ON course_modules
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

CREATE POLICY "Admin course lesson management" ON course_lessons
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

CREATE POLICY "Admin stream management" ON streams
  FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'service_role')
  );

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert default teams
INSERT INTO teams (name, short_name, sport, country, league, is_active, display_order)
VALUES
  ('Selección Nacional de Costa Rica', 'CR', 'football', 'Costa Rica', 'CONCACAF', true, 1),
  ('Liga Deportiva Alajuelense', 'LDA', 'football', 'Costa Rica', 'Primera División', true, 2),
  ('Deportivo Saprissa', 'SAPRISSA', 'football', 'Costa Rica', 'Primera División', true, 3),
  ('Club Sport Cartaginés', 'CARTAGO', 'football', 'Costa Rica', 'Primera División', true, 4),
  ('Club Sport Herediano', 'HEREDIANO', 'football', 'Costa Rica', 'Primera División', true, 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- User engagement summary view
CREATE OR REPLACE VIEW user_engagement_summary AS
SELECT
  u.id,
  u.email,
  u.subscription_status,
  u.subscription_tier,
  u.total_points_earned,
  COUNT(DISTINCT sv.stream_id) as streams_watched,
  COUNT(DISTINCT COALESCE(up.video_id, up.lesson_id)) as content_viewed,
  SUM(up.watch_time) as total_watch_time,
  COUNT(DISTINCT cm.id) as chat_messages_sent,
  COUNT(DISTINCT pv.poll_id) as polls_participated,
  COUNT(DISTINCT ge.giveaway_id) as giveaways_entered
FROM users u
LEFT JOIN stream_viewers sv ON u.id = sv.user_id
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN chat_messages cm ON u.id = cm.user_id AND cm.is_deleted = false
LEFT JOIN poll_votes pv ON u.id = pv.user_id
LEFT JOIN giveaway_entries ge ON u.id = ge.user_id
WHERE u.subscription_status = 'active'
GROUP BY u.id, u.email, u.subscription_status, u.subscription_tier, u.total_points_earned;

-- Video performance view
CREATE OR REPLACE VIEW video_performance AS
SELECT
  v.id,
  v.title,
  v.description,
  v.duration,
  v.view_count,
  v.status,
  v.is_public,
  v.requires_subscription,
  COUNT(up.id) as unique_viewers,
  AVG(up.progress_percentage) as avg_completion_percentage,
  SUM(up.watch_time) as total_watch_time_all_users
FROM videos v
LEFT JOIN user_progress up ON v.id = up.video_id
WHERE v.status = 'ready'
GROUP BY v.id, v.title, v.description, v.duration, v.view_count, v.status, v.is_public, v.requires_subscription;

-- Course performance view
CREATE OR REPLACE VIEW course_performance AS
SELECT
  c.id,
  c.title,
  c.description,
  c.is_published,
  c.is_public,
  c.requires_subscription,
  COUNT(DISTINCT cl.id) as total_lessons,
  COUNT(DISTINCT up.lesson_id) as lessons_with_progress,
  COUNT(DISTINCT up.user_id) as unique_students,
  AVG(up.progress_percentage) as avg_lesson_completion,
  SUM(up.watch_time) as total_course_watch_time
FROM courses c
LEFT JOIN course_modules cm ON c.id = cm.course_id
LEFT JOIN course_lessons cl ON cm.id = cl.module_id
LEFT JOIN user_progress up ON cl.id = up.lesson_id
WHERE c.is_published = true
GROUP BY c.id, c.title, c.description, c.is_published, c.is_public, c.requires_subscription;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT ON public.teams TO anon, authenticated;
GRANT SELECT ON public.streams TO anon, authenticated;
GRANT SELECT ON public.videos TO anon, authenticated;
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT SELECT ON public.course_modules TO anon, authenticated;
GRANT SELECT ON public.course_lessons TO anon, authenticated;
GRANT SELECT ON public.giveaways TO anon, authenticated;
GRANT SELECT ON public.polls TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_chat_count TO authenticated;

-- ============================================================================
-- COMPLETION
-- ============================================================================

COMMENT ON SCHEMA public IS 'DeporteMás Platform - Unified schema with integrated Web3 capabilities';
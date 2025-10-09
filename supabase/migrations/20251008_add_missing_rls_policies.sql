-- ============================================================================
-- Add Missing RLS Policies
-- Date: 2025-10-08
-- Purpose: Add critical missing INSERT/UPDATE policies for user-facing tables
-- ============================================================================

-- ============================================================================
-- 1. USER_PROGRESS - Allow users to track their own progress
-- ============================================================================

-- Allow users to insert their own progress records
CREATE POLICY "Users can create own progress" ON user_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to update their own progress
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (user_id = auth.uid());

COMMENT ON POLICY "Users can create own progress" ON user_progress IS
  'Allows authenticated users to create progress tracking records for videos and lessons they watch';

COMMENT ON POLICY "Users can update own progress" ON user_progress IS
  'Allows users to update their watch time, completion status, and resume positions';

-- ============================================================================
-- 2. CHAT_MESSAGES - Allow users to read stream chat
-- ============================================================================

-- Allow all authenticated users to read chat messages
CREATE POLICY "Users can read chat messages" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Users can read chat messages" ON chat_messages IS
  'Allows authenticated users to view stream chat messages';

-- ============================================================================
-- 3. ENGAGEMENT_ACTIVITIES - Allow users to log their own activities
-- ============================================================================

-- Allow users to insert their own engagement activities
CREATE POLICY "Users can log own activities" ON engagement_activities
  FOR INSERT WITH CHECK (user_id = auth.uid());

COMMENT ON POLICY "Users can log own activities" ON engagement_activities IS
  'Allows users to log their own engagement activities (views, shares, etc.)';

-- ============================================================================
-- 4. NOTIFICATIONS - Allow users to mark notifications as read
-- ============================================================================

-- Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

COMMENT ON POLICY "Users can update own notifications" ON notifications IS
  'Allows users to update their notifications, primarily to mark them as read';

-- ============================================================================
-- 5. STREAM_VIEWERS - Allow users to join stream viewer list
-- ============================================================================

-- Check if policy already exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'stream_viewers'
    AND policyname = 'Users can join streams'
  ) THEN
    CREATE POLICY "Users can join streams" ON stream_viewers
      FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        joined_at <= NOW()
      );
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of policies added:
-- ✅ user_progress: INSERT + UPDATE policies (users can track progress)
-- ✅ chat_messages: SELECT policy (users can read chat)
-- ✅ engagement_activities: INSERT policy (users can log activities)
-- ✅ notifications: UPDATE policy (users can mark as read)
-- ✅ stream_viewers: INSERT policy (users can join streams)

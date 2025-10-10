-- ============================================================================
-- Course & Video Architecture Enhancements
-- Date: 2025-10-08
-- Purpose: Add course types, module enhancements, and video source tracking
-- ============================================================================

-- ============================================================================
-- 1. COURSES TABLE - Add course type and host
-- ============================================================================

-- Add course_type to categorize different content types
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'educational'
CHECK (course_type IN ('live_show', 'documentary', 'miniseries', 'educational', 'interactive'));

COMMENT ON COLUMN courses.course_type IS 'Type of course: live_show (episodic), documentary (one-off), miniseries (limited series), educational (lessons), interactive (live events)';

-- Add host_name for tracking content creators/hosts
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS host_name TEXT;

COMMENT ON COLUMN courses.host_name IS 'Name of the host or content creator (e.g., "Pablo Izaguirre", "Kenneth Paniagua")';

-- Optional: Add metadata JSONB for advanced features (can be populated later)
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::JSONB;

COMMENT ON COLUMN courses.metadata IS 'Optional metadata for advanced features like schedule, season number, etc.';

-- ============================================================================
-- 2. COURSE_MODULES TABLE - Add thumbnail, text content, and direct video link
-- ============================================================================

-- Add thumbnail for module/episode visual representation
ALTER TABLE course_modules
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN course_modules.thumbnail_url IS 'Thumbnail image for the module/episode';

-- Add text content for educational modules or context
ALTER TABLE course_modules
ADD COLUMN IF NOT EXISTS content_text TEXT;

COMMENT ON COLUMN course_modules.content_text IS 'Text content for the module (markdown or plain text) - can be used alongside video or standalone';

-- Add direct video link (simpler than going through lessons table)
ALTER TABLE course_modules
ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES videos(id) ON DELETE SET NULL;

COMMENT ON COLUMN course_modules.video_id IS 'Direct link to video (simpler than lesson indirection) - one module = one video';

-- Optional: Add aired_at for tracking when episodes originally aired
ALTER TABLE course_modules
ADD COLUMN IF NOT EXISTS aired_at TIMESTAMPTZ;

COMMENT ON COLUMN course_modules.aired_at IS 'When this episode/module originally aired (for live shows)';

-- ============================================================================
-- 3. VIDEOS TABLE - Add source type tracking
-- ============================================================================

-- Add source_type to track where videos came from
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload'
CHECK (source_type IN ('upload', 'livestream_vod', 'external'));

COMMENT ON COLUMN videos.source_type IS 'Source of the video: upload (direct admin upload), livestream_vod (recording from live stream), external (linked from elsewhere)';

-- ============================================================================
-- 4. STREAMS TABLE - Link streams to courses
-- ============================================================================

-- Add course_id to link streams to their course/show
ALTER TABLE streams
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;

COMMENT ON COLUMN streams.course_id IS 'Link to course/show this stream belongs to (e.g., "El Show de Pablo Izaguirre")';

-- ============================================================================
-- 5. INDEXES for performance
-- ============================================================================

-- Index for finding courses by type
CREATE INDEX IF NOT EXISTS idx_courses_course_type ON courses(course_type);

-- Index for finding modules by video
CREATE INDEX IF NOT EXISTS idx_course_modules_video_id ON course_modules(video_id);

-- Index for finding videos by source type
CREATE INDEX IF NOT EXISTS idx_videos_source_type ON videos(source_type);

-- Index for finding videos by stream
CREATE INDEX IF NOT EXISTS idx_videos_stream_id ON videos(stream_id);

-- Index for finding streams by course
CREATE INDEX IF NOT EXISTS idx_streams_course_id ON streams(course_id);

-- ============================================================================
-- 6. UPDATE updated_at trigger for new columns
-- ============================================================================

-- Ensure updated_at is triggered when new columns change
-- (This assumes the trigger already exists from previous migrations)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration adds:
-- ✅ Course types (live_show, documentary, miniseries, educational, interactive)
-- ✅ Course host tracking
-- ✅ Module thumbnails
-- ✅ Module text content (for educational content)
-- ✅ Direct video links in modules (simpler architecture)
-- ✅ Episode air dates
-- ✅ Video source tracking (upload vs livestream VOD)
-- ✅ Stream to course linking
-- ✅ Performance indexes

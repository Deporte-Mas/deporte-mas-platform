-- ============================================================================
-- Add function to increment video view count
-- ============================================================================

-- Function to atomically increment video view count
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = video_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_video_views(UUID) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION increment_video_views IS 'Atomically increments the view count for a video';

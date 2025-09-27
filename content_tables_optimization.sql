-- ============================================================================
-- CONTENT TABLES OPTIMIZATION ANALYSIS & IMPROVEMENTS
-- ============================================================================

-- CURRENT ISSUES IDENTIFIED:
-- 1. Missing indexes for content_collections and media_assets
-- 2. No composite indexes for common query patterns
-- 3. Missing indexes for foreign key relationships
-- 4. No specialized indexes for content discovery
-- 5. Missing unique constraints where needed

-- ============================================================================
-- IMPROVED CONTENT TABLE
-- ============================================================================
-- Current content table is well-structured but missing some optimizations

-- ADDITIONAL INDEXES NEEDED:
-- Stream relationship index (for VOD conversion tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_stream_id
ON content(stream_id) WHERE stream_id IS NOT NULL;

-- Mux asset tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_mux_asset
ON content(mux_asset_id) WHERE mux_asset_id IS NOT NULL;

-- Featured content ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_featured
ON content(featured_order, published_at DESC) WHERE featured = true AND visibility = 'published';

-- Upload status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_upload_status
ON content(upload_status, created_at) WHERE upload_status IN ('processing', 'failed');

-- Analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_analytics
ON content(view_count DESC, completion_rate DESC) WHERE visibility = 'published';

-- Points-based content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_points
ON content(points_cost, is_premium) WHERE points_cost > 0 OR is_premium = true;

-- Panelist search (for content featuring specific people)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_panelists
ON content USING gin(panelists) WHERE visibility = 'published';

-- Tags search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_tags
ON content USING gin(tags) WHERE visibility = 'published';

-- ============================================================================
-- IMPROVED CONTENT_COLLECTIONS TABLE
-- ============================================================================
-- Current table is good but missing optimization

-- MISSING INDEXES:
-- Collection type and featured status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_type_featured
ON content_collections(type, is_featured, order_index);

-- Premium collections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_premium
ON content_collections(is_premium, points_cost) WHERE is_premium = true OR points_cost > 0;

-- Collection ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collections_order
ON content_collections(order_index, created_at) WHERE is_featured = true;

-- ============================================================================
-- IMPROVED CONTENT_COLLECTION_ITEMS TABLE
-- ============================================================================
-- Current table structure is good but missing some indexes

-- MISSING INDEXES:
-- Content lookup (find all collections containing specific content)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_items_content
ON content_collection_items(content_id, order_index);

-- Collection ordering (for proper playlist ordering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_items_order
ON content_collection_items(collection_id, order_index);

-- Recent additions (for "recently added to collection" queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collection_items_recent
ON content_collection_items(added_at DESC);

-- ============================================================================
-- IMPROVED MEDIA_ASSETS TABLE
-- ============================================================================
-- Current table missing critical indexes

-- MISSING INDEXES:
-- Content relationship (critical for content management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_content
ON media_assets(content_id, type) WHERE content_id IS NOT NULL;

-- Provider and status tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_provider_status
ON media_assets(storage_provider, status);

-- Processing status monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_processing
ON media_assets(status, created_at) WHERE status = 'processing';

-- Asset type and size (for storage management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_type_size
ON media_assets(type, file_size) WHERE file_size IS NOT NULL;

-- User uploads tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_user
ON media_assets(user_id, created_at) WHERE user_id IS NOT NULL;

-- Provider asset lookup (for external asset management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_provider_id
ON media_assets(storage_provider, provider_asset_id) WHERE provider_asset_id IS NOT NULL;

-- ============================================================================
-- ADDITIONAL OPTIMIZATIONS
-- ============================================================================

-- 1. ADD MISSING UNIQUE CONSTRAINTS
-- Mux asset should be unique per content
ALTER TABLE content ADD CONSTRAINT content_mux_asset_unique
UNIQUE (mux_asset_id) WHERE mux_asset_id IS NOT NULL;

-- Provider asset ID should be unique per provider
ALTER TABLE media_assets ADD CONSTRAINT media_provider_asset_unique
UNIQUE (storage_provider, provider_asset_id) WHERE provider_asset_id IS NOT NULL;

-- 2. ADD CHECK CONSTRAINTS FOR DATA INTEGRITY
-- Content duration should be positive
ALTER TABLE content ADD CONSTRAINT content_duration_positive
CHECK (duration IS NULL OR duration > 0);

-- Points cost should be non-negative
ALTER TABLE content ADD CONSTRAINT content_points_cost_valid
CHECK (points_cost >= 0);

-- View count should be non-negative
ALTER TABLE content ADD CONSTRAINT content_view_count_valid
CHECK (view_count >= 0);

-- Collection order should be non-negative
ALTER TABLE content_collections ADD CONSTRAINT collection_order_valid
CHECK (order_index >= 0);

-- Collection item order should be non-negative
ALTER TABLE content_collection_items ADD CONSTRAINT collection_item_order_valid
CHECK (order_index >= 0);

-- Media file size should be positive
ALTER TABLE media_assets ADD CONSTRAINT media_file_size_positive
CHECK (file_size IS NULL OR file_size > 0);

-- ============================================================================
-- PERFORMANCE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Enhanced content performance view with better metrics
CREATE OR REPLACE VIEW content_performance_enhanced AS
SELECT
  c.id,
  c.title,
  c.type,
  c.category,
  c.is_premium,
  c.points_cost,
  c.view_count,
  c.average_watch_time,
  c.completion_rate,
  c.duration,
  -- Enhanced metrics
  CASE
    WHEN c.duration > 0 THEN (c.average_watch_time::DECIMAL / c.duration * 100)
    ELSE 0
  END as engagement_percentage,
  COUNT(up.id) as unique_viewers,
  AVG(up.progress_percentage) as avg_completion_percentage,
  SUM(up.watch_time) as total_watch_time_all_users,
  COUNT(CASE WHEN up.completed = true THEN 1 END) as completed_views,
  -- Collection membership
  COUNT(cci.collection_id) as collection_count,
  -- Asset information
  COUNT(ma.id) as asset_count,
  SUM(ma.file_size) as total_file_size
FROM content c
LEFT JOIN user_progress up ON c.id = up.content_id
LEFT JOIN content_collection_items cci ON c.id = cci.content_id
LEFT JOIN media_assets ma ON c.id = ma.content_id
WHERE c.visibility = 'published'
GROUP BY c.id, c.title, c.type, c.category, c.is_premium, c.points_cost,
         c.view_count, c.average_watch_time, c.completion_rate, c.duration;

-- Collection analytics view
CREATE OR REPLACE VIEW collection_analytics AS
SELECT
  cc.id,
  cc.title,
  cc.type,
  cc.is_premium,
  cc.points_cost,
  COUNT(cci.content_id) as content_count,
  AVG(c.view_count) as avg_content_views,
  SUM(c.view_count) as total_collection_views,
  AVG(c.completion_rate) as avg_completion_rate,
  SUM(c.duration) as total_duration,
  COUNT(CASE WHEN c.is_premium = true THEN 1 END) as premium_content_count
FROM content_collections cc
LEFT JOIN content_collection_items cci ON cc.id = cci.collection_id
LEFT JOIN content c ON cci.content_id = c.id AND c.visibility = 'published'
GROUP BY cc.id, cc.title, cc.type, cc.is_premium, cc.points_cost;

-- ============================================================================
-- QUERY OPTIMIZATION EXAMPLES
-- ============================================================================

-- Example: Optimized content discovery query
/*
-- BEFORE (slow):
SELECT * FROM content WHERE type = 'vod' AND is_premium = false ORDER BY published_at DESC;

-- AFTER (fast with idx_content_type_category):
SELECT * FROM content WHERE visibility = 'published' AND type = 'vod' AND is_premium = false ORDER BY published_at DESC;
*/

-- Example: Optimized collection content query
/*
-- BEFORE (slow):
SELECT c.* FROM content c
JOIN content_collection_items cci ON c.id = cci.content_id
WHERE cci.collection_id = $1
ORDER BY cci.order_index;

-- AFTER (fast with idx_collection_items_order):
-- Same query but uses the composite index for optimal performance
*/

-- Example: Optimized featured content query
/*
-- BEFORE (slow):
SELECT * FROM content WHERE featured = true AND visibility = 'published' ORDER BY featured_order, published_at DESC;

-- AFTER (fast with idx_content_featured):
-- Same query but uses the specialized index
*/

-- ============================================================================
-- MAINTENANCE RECOMMENDATIONS
-- ============================================================================

-- 1. Regular VACUUM and ANALYZE for large tables
-- Schedule: Weekly for content tables, daily for high-frequency tables

-- 2. Monitor index usage
-- Check pg_stat_user_indexes to ensure indexes are being used

-- 3. Content archival strategy
-- Consider partitioning content table by published_at for very large datasets

-- 4. Media cleanup
-- Regular cleanup of orphaned media_assets (no content_id)

-- 5. Performance monitoring
-- Monitor slow queries involving content search and collection management
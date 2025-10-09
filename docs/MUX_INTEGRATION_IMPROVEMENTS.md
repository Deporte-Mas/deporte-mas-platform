# Mux Integration Improvements - October 2025

## 📋 Overview

This document summarizes the improvements made to the Mux video integration based on the latest Mux documentation and best practices review.

## 🎯 Problems Solved

### 1. Video Upload Linking Issue (CRITICAL)

**Problem:**
- When admin uploaded a video, a record was created in the database
- Mux processed the upload and sent webhook `video.upload.asset_created`
- Webhook had no way to know which video record to update
- Result: Videos stuck in "uploading" status forever

**Solution:**
- Use Mux's `passthrough` parameter to pass `video.id` during upload
- Webhook receives `passthrough` and uses it to find the correct video record
- Also added `meta.external_id` for redundancy and better tracking

**Files Changed:**
- `supabase/functions/admin-upload-video/index.ts` - Pass video.id via passthrough
- `supabase/functions/_shared/mux.ts` - Extract passthrough in webhook handler

### 2. Livestream VOD Not Captured

**Problem:**
- Mux automatically creates VOD when livestream ends
- VOD existed in Mux but not in our database
- No way for users to access the recording

**Solution:**
- Enhanced `handleLiveStreamDisconnected()` to create video records
- Extracts asset details from Mux (playback_id, duration, thumbnail)
- Links video to stream via `stream_id` foreign key
- Sets `source_type: 'livestream_vod'` for tracking

**Files Changed:**
- `supabase/functions/_shared/mux.ts` - Auto-create video from VOD

### 3. Limited Course Architecture

**Problem:**
- Basic course structure couldn't differentiate content types
- No way to organize live shows vs documentaries vs educational content
- Modules couldn't have direct video links or text content

**Solution:**
- Database migration adding:
  - `course_type` enum (live_show, documentary, miniseries, educational, interactive)
  - `host_name` for content creators
  - Module thumbnails, text content, direct video links
  - Video source tracking
  - Stream-to-course linking

**Files Changed:**
- `supabase/migrations/20251008_enhance_courses_architecture.sql` - New migration
- `deporte-mas-web/src/lib/admin-api.ts` - Updated TypeScript interfaces

## 📊 Key Findings from Mux Documentation

### Passthrough Parameter
- **Max Length:** 255 characters
- **Use Case:** Pass internal IDs to link assets back to your database
- **Availability:** Included in all webhook events related to the asset
- **Best Practice:** Use for reliable webhook-to-database linking

### Meta Object (New Feature)
- **Fields Available:**
  - `meta.external_id` - Link to external system (128 chars)
  - `meta.title` - Human-readable title (512 chars)
  - `meta.creator_id` - Track content creators (128 chars)
- **Use Case:** Structured metadata for better organization
- **Best Practice:** Use alongside passthrough for redundancy

### Livestream VOD Creation
- **Automatic:** Mux creates VOD asset automatically when stream ends
- **Asset ID:** Included in `video.live_stream.disconnected` webhook
- **Availability:** VOD is immediately playable after stream ends
- **No Processing Delay:** Asset is ready instantly (already encoded during stream)

## 🚀 Implementation Details

### Updated Interfaces

```typescript
// Mux Upload Request with Passthrough
interface MuxUploadRequest {
  cors_origin: string;
  new_asset_settings: {
    playback_policy: string[];
    video_quality: string;
    test?: boolean;
    passthrough?: string;  // 🆕 NEW
    meta?: {  // 🆕 NEW
      external_id?: string;
      title?: string;
      creator_id?: string;
    };
  };
}

// Course with Type and Host
interface Course {
  course_type: 'live_show' | 'documentary' | 'miniseries' | 'educational' | 'interactive';  // 🆕 NEW
  host_name?: string;  // 🆕 NEW
  metadata?: Record<string, any>;  // 🆕 NEW
  // ... other fields
}

// Course Module with Direct Video Link
interface CourseModule {
  thumbnail_url?: string;  // 🆕 NEW
  content_text?: string;  // 🆕 NEW - For educational content or context
  video_id?: string;  // 🆕 NEW - Direct link to video
  aired_at?: string;  // 🆕 NEW - When episode aired
  // ... other fields
}

// Video with Source Tracking
interface Video {
  source_type?: 'upload' | 'livestream_vod' | 'external';  // 🆕 NEW
  // ... other fields
}
```

### Upload Flow (Before vs After)

**Before:**
```
1. Admin uploads video
2. Create video record (id: "abc-123")
3. Create Mux upload
4. Upload completes → Webhook arrives
5. ❌ Webhook can't find video record
6. ❌ Video stuck in "uploading" status
```

**After:**
```
1. Admin uploads video
2. Create video record (id: "abc-123")
3. Create Mux upload with passthrough: "abc-123"
4. Upload completes → Webhook arrives with passthrough: "abc-123"
5. ✅ Webhook updates video WHERE id = "abc-123"
6. ✅ Video status updated to "processing" → "ready"
```

### Livestream Flow (Before vs After)

**Before:**
```
1. Stream starts → connected webhook
2. Stream ends → disconnected webhook
3. Mux creates VOD automatically
4. ❌ VOD exists in Mux but not in database
5. ❌ Users can't access recording
```

**After:**
```
1. Stream starts → connected webhook
2. Stream ends → disconnected webhook (includes asset_id)
3. ✅ Fetch asset details from Mux
4. ✅ Create video record with source_type: 'livestream_vod'
5. ✅ Users can watch recording immediately
```

## 📁 Files Modified

1. **supabase/functions/_shared/mux.ts**
   - Added passthrough/meta to type interfaces
   - Fixed handleUploadAssetCreated to use passthrough
   - Enhanced handleLiveStreamDisconnected to create videos

2. **supabase/functions/admin-upload-video/index.ts**
   - Reordered to create video record first
   - Added passthrough and meta to upload request

3. **supabase/migrations/20251008_enhance_courses_architecture.sql** (NEW)
   - Database schema enhancements for course architecture

4. **deporte-mas-web/src/lib/admin-api.ts**
   - Updated all TypeScript interfaces

## ✅ Architecture Validation

Our planned architecture **aligns perfectly** with Mux best practices:

### ✅ Direct Uploads
- Client uploads directly to Mux (efficient, no backend bottleneck)
- Passthrough parameter for reliable linking
- Meta fields for better organization

### ✅ Livestreaming
- Automatic VOD creation confirmed
- Asset ID available immediately
- No additional processing needed

### ✅ Webhook Handling
- Proper HMAC-SHA256 signature verification
- Event routing matches Mux event lifecycle
- Passthrough enables direct database updates

### ✅ Content Organization
- Mux handles video storage/streaming
- Our database handles course/module organization
- Clear separation of concerns

## 🧪 Testing Guide

### Test 1: Video Upload with Passthrough
```bash
# 1. Upload video via admin panel
# 2. Check edge function logs for passthrough
# Expected: "passthrough: <video-id>"

# 3. Wait for webhook
# Expected: "Linking asset X to video Y"

# 4. Check video status in database
# Expected: status changed from "uploading" → "processing" → "ready"
```

### Test 2: Livestream VOD Creation
```bash
# 1. Create livestream via admin panel
# 2. Connect to stream with OBS/similar
# 3. Stream for a few seconds
# 4. Disconnect

# 5. Check webhook logs
# Expected: "Creating video record from livestream VOD asset X"

# 6. Check videos table
# Expected: New video with source_type='livestream_vod' and stream_id set
```

### Test 3: Database Migration
```bash
# Run migration
supabase migration up

# Verify new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('courses', 'course_modules', 'videos', 'streams')
AND column_name IN ('course_type', 'host_name', 'thumbnail_url', 'content_text', 'video_id', 'source_type', 'course_id');
```

## 🎓 Best Practices Applied

1. **Passthrough for Linking** ✅
   - Never rely on timestamps or guessing to link webhooks
   - Always pass internal IDs via passthrough

2. **Meta for Organization** ✅
   - Use structured meta fields for searchability
   - external_id for system integration
   - title for human-readable identification

3. **Direct Uploads** ✅
   - Client uploads directly to Mux (no backend proxy)
   - Reduces server load and improves performance
   - Better user experience with progress tracking

4. **Automatic VOD** ✅
   - Leverage Mux's automatic VOD creation
   - No need for manual conversion
   - Instant availability after stream ends

5. **Webhook Reliability** ✅
   - Verify signatures (HMAC-SHA256)
   - Use passthrough for idempotency
   - Return 200 even on processing errors (prevent retries)

## 📚 References

- [Mux Direct Upload Documentation](https://docs.mux.com/guides/video/upload-files-directly)
- [Mux Webhook Verification](https://docs.mux.com/guides/system/verify-webhook-signatures)
- [Mux Live Stream to VOD](https://docs.mux.com/guides/video/stream-live-video)
- [Mux Asset Metadata](https://docs.mux.com/guides/video/add-metadata-to-your-videos)

## 🔜 Next Steps

1. **Run Database Migration**
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy mux-webhook
   supabase functions deploy admin-upload-video
   ```

3. **Test Video Upload Flow**
   - Upload test video
   - Verify passthrough linking
   - Confirm webhook processing

4. **Build Admin UI**
   - Course creation with type selector
   - Module editor with video picker
   - Thumbnail upload for courses/modules

---

**Status**: ✅ Complete - Ready for Deployment
**Date**: 2025-10-08

# Course & Video Architecture Plan
**Status**: ✅ Implementation Complete - Ready for Testing
**Date**: 2025-10-08
**Updated**: 2025-10-08

## 🎯 Project Goal

Enhance the admin panel to properly manage and organize all DeporteMás content through a simplified course structure that supports:

1. **Live Shows** (El Show de Pablo Izaguirre, Alajuelense+, etc.)
2. **Documentales Originales** (Kenneth Paniagua, Pablo Izaguirre, etc.)
3. **Miniseries Temáticas** (Italia 90, Corea-Japón 2002, etc.)
4. **Cursos Educativos** (Mentalidad Deportiva, Formación de Jugadores, etc.)
5. **Contenido Live Interactivo** (Q&As, After Shows, Retos, etc.)

## 📊 Current State Analysis

### What We Have
✅ **Video Infrastructure**
- Mux integration for video hosting
- Direct upload capability
- Webhook handling for video processing
- Admin video upload UI
- Video library management

✅ **Livestream Infrastructure**
- Stream initialization with Mux
- RTMP streaming support
- VOD conversion (Mux creates recording when stream ends)
- Stream management in database

✅ **Basic Course Structure**
- `courses` table (title, description, thumbnail)
- `course_modules` table (title, description, order)
- `course_lessons` table (title, description, video link)
- Basic CourseManagement UI (list view only)

### What's Missing
❌ **Content Organization**
- No way to categorize courses by type (show vs documentary vs course)
- Cannot distinguish between episodic content (live shows) and one-off content
- No metadata for hosts, schedules, etc.

❌ **Module Flexibility**
- Modules can only link to videos via lessons (indirect)
- No support for text/markdown content in modules
- No thumbnails for modules/episodes
- Cannot have a module with just text or text + video

❌ **Live → VOD Workflow**
- Livestream VODs exist but no clear path to add them to courses
- Manual process unclear for admins
- No linking between streams and courses

❌ **Admin UX**
- No course creation workflow
- No module editor
- No way to build out course content
- No preview of how content will appear

## 🧠 Core Architectural Insight

**Everything is a Course:**

```
Course = Content Container
├─ "El Show de Pablo Izaguirre" = Course (type: live_show)
├─ "Documental Kenneth Paniagua" = Course (type: documentary)
├─ "Italia 90" = Course (type: miniseries)
├─ "Mentalidad Deportiva" = Course (type: educational)
└─ "Q&A Sessions" = Course (type: interactive)

Module = Episode/Chapter/Lesson
├─ Can contain VIDEO (link to videos table)
├─ Can contain TEXT (markdown/plain text)
├─ Can contain BOTH (video + context text)
└─ Has thumbnail, description, order

Videos Table = Raw Media Assets (just storage)
Streams Table = Live events that create VODs
```

## 📋 Simplified Database Schema Plan

### Principle: Keep It Simple, Avoid Over-Engineering

**Changes Needed (Minimal):**

```sql
-- 1. Enhance COURSES table
ALTER TABLE courses ADD COLUMN course_type TEXT DEFAULT 'educational';
-- Values: 'live_show', 'documentary', 'miniseries', 'educational', 'interactive'

ALTER TABLE courses ADD COLUMN host_name TEXT;
-- Simple text field: "Pablo Izaguirre" or "Kenneth Paniagua"

-- Optional metadata for advanced use (can add later):
-- ALTER TABLE courses ADD COLUMN metadata JSONB DEFAULT '{}';
-- { schedule: "weekly_thursday_8pm", season: 1, etc. }

-- 2. Enhance COURSE_MODULES table
ALTER TABLE course_modules ADD COLUMN thumbnail_url TEXT;
-- Episode/chapter thumbnail

ALTER TABLE course_modules ADD COLUMN content_text TEXT;
-- For text-based content (plain text or markdown)

ALTER TABLE course_modules ADD COLUMN video_id UUID REFERENCES videos(id);
-- Direct video link (simpler than going through lessons)

-- Optional metadata:
-- ALTER TABLE course_modules ADD COLUMN aired_at TIMESTAMPTZ;
-- When episode originally aired (for live shows)

-- 3. Optional: Add source tracking to VIDEOS table
ALTER TABLE videos ADD COLUMN source_type TEXT;
-- Values: 'livestream_vod', 'upload', 'external'
-- Just for tracking/filtering, not critical

-- 4. Optional: Link streams to courses
ALTER TABLE streams ADD COLUMN course_id UUID REFERENCES courses(id);
-- If creating stream for a specific show, link it upfront
```

**What We're NOT Adding:**
- ❌ Complex lesson system (keeping it simple: 1 module = 1 content piece)
- ❌ Multiple lesson types
- ❌ Automated workflows (manual is fine for MVP)
- ❌ Rich metadata tracking everywhere
- ❌ Tags, categories, advanced filtering (can add later)

## 🎨 Admin Panel Workflows

### Workflow 1: Create Live Show Container (One-Time Setup)

**Goal:** Create a show like "El Show de Pablo Izaguirre" that will have episodes added over time.

```
Admin → Courses → Create New Course

Form:
├─ Type: [Dropdown] Live Show ▼
├─ Title: "El Show de Pablo Izaguirre"
├─ Description: "Programa de análisis, debate y entrevistas..."
├─ Host: "Pablo Izaguirre"
├─ Thumbnail: [Upload image]
└─ [Save]

Result: Empty course created, ready to receive episodes
```

### Workflow 2: Add Episode After Livestream (Manual)

**The Reality:**
1. Stream happens → stored in `streams` table
2. Mux automatically creates VOD → `video.live_stream.disconnected` webhook
3. VOD is available in Video Library
4. **Admin manually adds it to the show**

```
Admin → Video Library → [Sees new VOD from last night's stream]

Admin → Courses → "El Show de Pablo Izaguirre" → Add Module

Form:
├─ Module Title: "Episodio 15: Post Clásico Nacional"
├─ Thumbnail: [Upload or use video thumbnail]
├─ Video: [Dropdown showing Video Library] → Select the VOD
├─ Context (optional): [Textarea]
│   "En este episodio analizamos el clásico con Roy Myers..."
└─ [Save]

Result: Episode 15 added to course, users can watch it
Time: ~1 minute
```

### Workflow 3: Create Documentary/Educational Course

**Goal:** Create structured content with chapters/modules

```
Admin → Courses → Create New Course

Step 1: Basic Info
├─ Type: Documentary
├─ Title: "Documental Kenneth Paniagua"
├─ Description: "La historia de una leyenda..."
├─ Host: "DeporteMás Originals"
├─ Thumbnail: [Upload]
└─ [Save & Add Modules]

Step 2: Add Modules (Chapters)

Module 1:
├─ Title: "Los Inicios"
├─ Thumbnail: [Upload]
├─ Video: [Select from library or leave empty]
├─ Content Text: [Textarea]
│   "Kenneth Paniagua nació en San José..."
│   [Can add context even if there's a video]
└─ [Save]

Module 2:
├─ Title: "La Carrera Profesional"
├─ Video: [Select main documentary video]
├─ Content Text: [Optional context]
└─ [Save]

Module 3:
├─ Title: "Reflexiones Finales"
├─ Video: [Empty - just text]
├─ Content Text: [Interview transcript or summary]
└─ [Save]

Result: Complete documentary course with mixed content
```

### Workflow 4: Educational Course with Lessons

```
Admin → Courses → Create New Course

Type: Educational Course
Title: "Mentalidad Deportiva"

Modules:
├─ Module 1: "Fundamentos"
│   ├─ Content Text: [Theory, concepts, definitions]
│   └─ Video: [Optional explainer video]
│
├─ Module 2: "Ejercicios Prácticos"
│   ├─ Content Text: [Exercise instructions]
│   └─ Video: [Demonstration video]
│
└─ Module 3: "Aplicación Real"
    ├─ Video: [Case study video]
    └─ Content Text: [Analysis and takeaways]
```

## 🛠️ Implementation Plan (Simplified)

### Phase 1: Database Schema (1 file)

**File:** `supabase/migrations/20251008_enhance_courses_simple.sql`

```sql
-- Add 2 columns to courses (course_type, host_name)
-- Add 3 columns to course_modules (thumbnail_url, content_text, video_id)
-- Add 1 column to videos (source_type) - optional
-- Add 1 column to streams (course_id) - optional
```

### Phase 2: Update Type Definitions & API

**File:** `deporte-mas-web/src/lib/admin-api.ts`

```typescript
// Update Course interface
export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  course_type: 'live_show' | 'documentary' | 'miniseries' | 'educational' | 'interactive';
  host_name?: string;
  is_published: boolean;
  requires_subscription: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  module_count?: number;
  lesson_count?: number;
}

// Update CourseModule interface
export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  content_text?: string; // NEW
  video_id?: string; // NEW - direct link
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Add new functions
export async function uploadCourseThumbnail(file: File): Promise<string>;
export async function updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule>;
export async function reorderModules(courseId: string, moduleIds: string[]): Promise<void>;
```

### Phase 3: Enhance CourseManagement Page

**File:** `deporte-mas-web/src/pages/admin/CourseManagement.tsx`

**Add:**
1. Create Course Dialog
   - Course type selector dropdown
   - Basic form fields
   - Thumbnail upload

2. Course Detail View
   - Show modules list
   - Add module button
   - Edit/delete module buttons
   - Reorder modules (drag-drop or up/down arrows)

3. Module Editor Dialog
   - Title input
   - Thumbnail upload
   - Video selector (dropdown from Video Library)
   - Text area for content
   - Save/cancel buttons

### Phase 4: Create Supporting Components (if needed)

**Potential new components:**
- `ThumbnailUploader.tsx` - Reusable image upload
- `VideoSelector.tsx` - Dropdown to pick from Video Library
- `ModuleList.tsx` - Display and manage course modules

**Keep it simple - inline components in CourseManagement are fine for MVP**

### Phase 5: Optional Enhancements (Future)

**NOT for initial implementation:**
- Automated VOD→Course flow
- Markdown editor (plain textarea is fine)
- Course builder wizard (simple forms work)
- Advanced metadata
- Tags and filtering
- Analytics integration

## 📁 File Changes Summary

### New Files (1-2)
1. ✅ `supabase/migrations/20251008_enhance_courses_simple.sql` - Database changes
2. ❓ `deporte-mas-web/src/components/ModuleEditor.tsx` - If we extract it

### Modified Files (2-3)
1. ✅ `deporte-mas-web/src/lib/admin-api.ts` - Update types, add functions
2. ✅ `deporte-mas-web/src/pages/admin/CourseManagement.tsx` - Main UI enhancements
3. ❓ Supporting components (if needed)

### Not Changing
- ❌ Mux integration (already working)
- ❌ Video upload flow (already working)
- ❌ Livestream infrastructure (already working)
- ❌ Webhook handlers (already working)

## ✅ Mux Documentation Review - COMPLETE

### Findings Validated:

1. **Mux Passthrough Parameters** ✅ IMPLEMENTED
   - Mux DOES support `passthrough` field (max 255 chars)
   - Mux ALSO supports structured `meta` object with `external_id`, `title`, `creator_id`
   - We now pass `video.id` via both `passthrough` and `meta.external_id`
   - Webhooks receive this data, enabling direct video record linking

2. **VOD from Livestream** ✅ IMPLEMENTED
   - Mux DOES automatically create VOD asset when stream ends
   - The `video.live_stream.disconnected` webhook includes `asset_id`
   - We now create video records from livestream VODs automatically
   - Status is set based on asset readiness

3. **Asset Organization in Mux**
   - Mux provides `meta.title`, `meta.external_id`, `meta.creator_id` for organization
   - We use these fields to link back to our database
   - Our course structure remains the primary organization layer for users

4. **Webhook Event Lifecycle** ✅ VERIFIED
   - **Uploads**: `video.upload.asset_created` → `video.asset.ready` (or `video.asset.errored`)
   - **Livestreams**: `video.live_stream.connected` → `video.live_stream.disconnected` (VOD created)
   - **Additional events available**: `video.live_stream.active`, `video.live_stream.idle`, `video.live_stream.recording`

### Implementation Complete:

✅ **Passthrough linking** - Upload webhooks now use `passthrough` to find correct video record
✅ **Meta fields** - Using `meta.external_id` and `meta.title` for better tracking
✅ **Automatic VOD creation** - Livestream disconnection now creates video records
✅ **Database schema** - Migration created with all planned enhancements
✅ **TypeScript types** - All interfaces updated with new fields

## 🎯 Decision Points

### Keep Simple vs Add Features

**Current Stance: KEEP IT SIMPLE**

| Feature | Decision | Rationale |
|---------|----------|-----------|
| Course types | ✅ Add | Core requirement for organization |
| Module thumbnails | ✅ Add | Visual, important for UX |
| Module text content | ✅ Add | Needed for educational courses |
| Direct video link in modules | ✅ Add | Simpler than lesson indirection |
| Automated VOD→Course | ❌ Skip | Manual is fine, 1-min process |
| Markdown editor | ❌ Skip | Plain textarea works for MVP |
| Complex metadata | ❌ Skip | Can add later if needed |
| Tags/categories | ❌ Skip | Course type is enough |
| Course builder wizard | ❌ Skip | Simple forms are clearer |

### Architecture Philosophy

**Principle 1: Use What We Have**
- Mux handles video storage/streaming ✅
- Database handles organization ✅
- Don't duplicate work ✅

**Principle 2: Manual > Automated (for MVP)**
- Admin takes 1 minute to add episode manually
- Saves weeks of automation development
- Can always add automation later

**Principle 3: Flat > Nested**
- 1 module = 1 piece of content
- Not: module → lessons → content
- Simpler to build, easier to use

**Principle 4: Flexible > Rigid**
- Module can have video OR text OR both
- Not: strict content types
- Adapts to different use cases

## 📝 Next Steps

1. **Fetch Mux Documentation** ⏳
   - Direct upload API reference
   - Livestream VOD documentation
   - Webhook events reference
   - Best practices for content management

2. **Validate Architecture Against Mux Features**
   - Confirm our assumptions
   - Identify any missed opportunities
   - Ensure we're following best practices

3. **Finalize Implementation Plan**
   - Update based on Mux findings
   - Create detailed task breakdown
   - Estimate effort

4. **Get Approval to Proceed**
   - Review simplified plan
   - Confirm scope
   - Begin implementation

## 💡 Key Insights So Far

1. **Courses are the organizing principle** - Not videos, not streams. Courses contain everything.

2. **Live shows are episodic courses** - "El Show de Pablo" is a course that gets new modules (episodes) over time.

3. **VODs are just videos in the library** - They get linked to course modules manually by admin.

4. **Keep modules simple** - One module = one content piece. Not a container of containers.

5. **Manual workflow is fine** - Admin spending 1 minute to add an episode is totally acceptable vs weeks of automation.

6. **Text content is important** - Educational courses and context around videos both need text support.

---

## 🚀 Implementation Summary

### Files Modified

1. **[supabase/functions/_shared/mux.ts](../supabase/functions/_shared/mux.ts)**
   - Added `passthrough` and `meta` fields to `MuxUploadRequest` interface
   - Added `passthrough` and `meta` fields to `MuxAsset` interface
   - Added `asset_id` and `passthrough` to `MuxLiveStream` interface
   - Fixed `handleUploadAssetCreated()` to use passthrough for video linking
   - Enhanced `handleLiveStreamDisconnected()` to create video records from VOD assets

2. **[supabase/functions/admin-upload-video/index.ts](../supabase/functions/admin-upload-video/index.ts)**
   - Reordered to create video record BEFORE Mux upload
   - Added `passthrough: video.id` to Mux upload request
   - Added `meta.external_id` and `meta.title` for better tracking

3. **[supabase/migrations/20251008_enhance_courses_architecture.sql](../supabase/migrations/20251008_enhance_courses_architecture.sql)** (NEW)
   - Added `course_type` enum to courses table
   - Added `host_name` to courses table
   - Added `metadata` JSONB to courses table
   - Added `thumbnail_url`, `content_text`, `video_id`, `aired_at` to course_modules
   - Added `source_type` to videos table
   - Added `course_id` to streams table
   - Created performance indexes

4. **[deporte-mas-web/src/lib/admin-api.ts](../deporte-mas-web/src/lib/admin-api.ts)**
   - Updated `Course` interface with `course_type`, `host_name`, `metadata`
   - Updated `CourseModule` interface with `thumbnail_url`, `content_text`, `video_id`, `aired_at`
   - Updated `Video` interface with `source_type`
   - Updated `Stream` interface with `course_id`

### Key Improvements

1. **🔗 Reliable Video Linking**
   - Before: Webhook couldn't find which video record to update
   - After: Passthrough parameter ensures direct linking via video.id

2. **📹 Automatic VOD Creation**
   - Before: Livestream VODs existed in Mux but not in database
   - After: Video records automatically created when livestream ends

3. **🎬 Course Architecture**
   - Before: Basic course structure without content type differentiation
   - After: Full support for live shows, documentaries, educational content, etc.

4. **📊 Better Tracking**
   - Before: No way to distinguish upload source
   - After: `source_type` field tracks uploads vs livestream VODs

### Next Steps (Admin UI)

The backend is now ready. Next phase:

1. **Course Management UI** ([CourseManagement.tsx](../deporte-mas-web/src/pages/admin/CourseManagement.tsx))
   - Add course creation dialog with type selector
   - Build module editor with video selector
   - Add thumbnail upload for courses and modules
   - Implement drag-and-drop module reordering

2. **Video Library Enhancements**
   - Add source type filter (upload vs VOD)
   - Show stream link for VOD videos
   - Enable quick-add to course/module

3. **Stream Management**
   - Add course selector when creating streams
   - Show VOD creation status after stream ends

### Testing Checklist

- [ ] Upload new video and verify passthrough linking works
- [ ] Check webhook logs to confirm video.id is received
- [ ] Create livestream and verify VOD video is created automatically
- [ ] Run database migration on development environment
- [ ] Verify TypeScript types compile without errors
- [ ] Test course creation with new fields
- [ ] Verify indexes improve query performance

---

**Status**: ✅ Backend Implementation Complete - Ready for Admin UI Development

**Last Updated**: 2025-10-08

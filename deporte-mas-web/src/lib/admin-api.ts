import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalCourses: number;
  totalVideos: number;
  totalStreams: number;
  liveStreams: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  country?: string;
  stripe_customer_id?: string;
  created_at: string;
  last_active_at?: string;
  // Note: subscription_status moved to subscription_cache table
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  course_type: 'live_show' | 'documentary' | 'miniseries' | 'educational' | 'interactive';
  host_name?: string;
  metadata?: Record<string, any>;
  is_published: boolean;
  requires_subscription: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  module_count?: number;
  lesson_count?: number;
}

export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  content_text?: string;
  video_id?: string;
  aired_at?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  module_id: string;
  video_id?: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  mux_asset_id?: string;
  mux_playback_id?: string;
  duration?: number;
  status: string;
  is_public: boolean;
  requires_subscription: boolean;
  view_count: number;
  stream_id?: string;
  source_type?: 'upload' | 'livestream_vod' | 'external';
  created_at: string;
  updated_at: string;
}

export interface Stream {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  status: string;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  stream_key?: string;
  rtmp_url?: string;
  playback_url?: string;
  vod_url?: string;
  vod_available: boolean;
  mux_asset_id?: string;
  peak_viewers: number;
  total_viewers: number;
  category?: string;
  course_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DASHBOARD
// ============================================================================

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get active subscriptions (from subscription_cache table)
    const { count: activeSubscriptions } = await supabase
      .from('subscription_cache')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'trialing'])
      .gte('current_period_end', new Date().toISOString());

    // Get total courses
    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // Get total videos
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ready');

    // Get total streams
    const { count: totalStreams } = await supabase
      .from('streams')
      .select('*', { count: 'exact', head: true });

    // Get live streams
    const { count: liveStreams } = await supabase
      .from('streams')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live');

    return {
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      monthlyRevenue: 0, // Will be calculated from Stripe or subscriptions table
      totalCourses: totalCourses || 0,
      totalVideos: totalVideos || 0,
      totalStreams: totalStreams || 0,
      liveStreams: liveStreams || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// ============================================================================
// USERS
// ============================================================================

export async function fetchUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

export async function searchUsers(query: string): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

// ============================================================================
// COURSES
// ============================================================================

export async function fetchCourses(): Promise<Course[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_modules (count)
      `)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function createCourse(course: Partial<Course>): Promise<Course> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([course])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

export async function updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
}

export async function deleteCourse(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
}

export async function fetchCourseModules(courseId: string): Promise<CourseModule[]> {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching course modules:', error);
    throw error;
  }
}

export async function createCourseModule(module: Partial<CourseModule>): Promise<CourseModule> {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .insert([module])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating course module:', error);
    throw error;
  }
}

export async function updateCourseModule(id: string, updates: Partial<CourseModule>): Promise<CourseModule> {
  try {
    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating course module:', error);
    throw error;
  }
}

export async function deleteCourseModule(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting course module:', error);
    throw error;
  }
}

export async function reorderCourseModules(courseId: string, moduleIds: string[]): Promise<void> {
  try {
    // Update order_index for each module
    const updates = moduleIds.map((id, index) =>
      supabase
        .from('course_modules')
        .update({ order_index: index })
        .eq('id', id)
        .eq('course_id', courseId)
    );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error reordering course modules:', error);
    throw error;
  }
}

export async function fetchCourseLessons(moduleId: string): Promise<CourseLesson[]> {
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching course lessons:', error);
    throw error;
  }
}

export async function createCourseLesson(lesson: Partial<CourseLesson>): Promise<CourseLesson> {
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .insert([lesson])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating course lesson:', error);
    throw error;
  }
}

// ============================================================================
// VIDEOS
// ============================================================================

export async function fetchVideos(): Promise<Video[]> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
}

export async function createVideo(video: Partial<Video>): Promise<Video> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([video])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

export async function updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
}

export async function deleteVideo(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
}

export interface VideoUploadInitResponse {
  video_id: string;
  upload_url: string;
  upload_id: string;
  video: Video;
}

// ============================================================================
// STORAGE / UPLOADS
// ============================================================================

export async function uploadThumbnail(file: File): Promise<string> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `thumbnails/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    throw error;
  }
}

export async function initializeVideoUpload(videoData: {
  title: string;
  description?: string;
  is_public?: boolean;
  requires_subscription?: boolean;
}): Promise<VideoUploadInitResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-upload-video`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initialize upload');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error initializing video upload:', error);
    throw error;
  }
}

export async function uploadVideoFile(uploadUrl: string, file: File): Promise<void> {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to upload video file');
    }
  } catch (error) {
    console.error('Error uploading video file:', error);
    throw error;
  }
}

// ============================================================================
// STREAMS
// ============================================================================

export async function fetchStreams(): Promise<Stream[]> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .select('*')
      .order('scheduled_start', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching streams:', error);
    throw error;
  }
}

export async function createStream(stream: Partial<Stream>): Promise<Stream> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .insert([stream])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating stream:', error);
    throw error;
  }
}

export async function updateStream(id: string, updates: Partial<Stream>): Promise<Stream> {
  try {
    const { data, error } = await supabase
      .from('streams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating stream:', error);
    throw error;
  }
}

export async function deleteStream(id: string): Promise<void> {
  try {
    const { error} = await supabase
      .from('streams')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting stream:', error);
    throw error;
  }
}

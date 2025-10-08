/**
 * Admin Upload Video Edge Function
 *
 * Creates a Mux direct upload URL and video record for admin video uploads
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  requireRole,
  type AuthContext
} from "../_shared/auth.ts";
import { MuxService } from "../_shared/mux.ts";

// Types
interface VideoUploadRequest {
  title: string;
  description?: string;
  is_public?: boolean;
  requires_subscription?: boolean;
}

interface VideoUploadResponse {
  video_id: string;
  upload_url: string;
  upload_id: string;
  video: {
    id: string;
    title: string;
    description?: string;
    status: string;
    is_public: boolean;
    requires_subscription: boolean;
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  return await withAuth(req, async (context: AuthContext) => {
    const { user, supabase } = context;

    // Check admin permissions
    if (!requireRole(context, 'admin')) {
      return createErrorResponse('Admin access required', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    try {
      // Parse request body
      const body: VideoUploadRequest = await req.json();

      // Validate required fields
      if (!body.title || body.title.trim() === '') {
        return createErrorResponse('Title is required', 400, 'INVALID_REQUEST');
      }

      // Create Mux direct upload
      const muxService = new MuxService();
      const upload = await muxService.createDirectUpload({
        cors_origin: Deno.env.get('FRONTEND_URL') || '*',
        new_asset_settings: {
          playback_policy: ['public'],
          video_quality: 'plus',
          test: Deno.env.get('VITE_DEV_MODE') === 'true'
        }
      });

      if (!upload) {
        return createErrorResponse(
          'Failed to create Mux upload',
          500,
          'MUX_UPLOAD_FAILED'
        );
      }

      // Create video record in database with 'uploading' status
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .insert({
          title: body.title.trim(),
          description: body.description?.trim() || null,
          status: 'uploading',
          is_public: body.is_public ?? false,
          requires_subscription: body.requires_subscription ?? true,
          // Note: mux_asset_id will be set by webhook when upload completes
        })
        .select()
        .single();

      if (videoError) {
        console.error('Failed to create video record:', videoError);
        return createErrorResponse(
          'Failed to create video record',
          500,
          'VIDEO_CREATION_FAILED'
        );
      }

      // Record admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'video_upload_initiated',
          target_type: 'video',
          target_id: video.id,
          description: `Initiated upload for video: ${body.title}`,
          success: true
        });

      // Return upload URL and video details
      const response: VideoUploadResponse = {
        video_id: video.id,
        upload_url: upload.url,
        upload_id: upload.id,
        video: {
          id: video.id,
          title: video.title,
          description: video.description,
          status: video.status,
          is_public: video.is_public,
          requires_subscription: video.requires_subscription,
          created_at: video.created_at
        }
      };

      return createSuccessResponse(
        response,
        'Video upload initialized. Use the upload_url to upload your video file.'
      );

    } catch (error) {
      console.error('Admin upload video error:', error);
      return createErrorResponse(
        'Failed to initialize video upload',
        500,
        'UPLOAD_INITIALIZATION_ERROR'
      );
    }
  });
});

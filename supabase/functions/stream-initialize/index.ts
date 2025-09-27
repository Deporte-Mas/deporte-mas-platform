/**
 * Stream Initialize Edge Function
 *
 * Generates RTMP credentials and creates stream record with Mux integration
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  withAuth,
  createSuccessResponse,
  createErrorResponse,
  requireRole,
  type AuthContext
} from "../_shared/auth.ts";
import { MuxService, generateStreamKey } from "../_shared/mux.ts";
import { ValidationService, StreamInitializeSchema } from "../_shared/validation.ts";

// Types
interface StreamInitializeResponse {
  stream: {
    id: string;
    title: string;
    description?: string;
    scheduled_start: string;
    status: string;
    stream_key: string;
    rtmp_url: string;
    playback_url?: string;
    panelists: string[];
    category: string;
    topics: string[];
  };
  mux: {
    stream_id: string;
    playback_id?: string;
  };
  instructions: {
    rtmp_server: string;
    stream_key: string;
    software_settings: string;
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
      // Parse and validate request body
      const body = await req.json();
      const validation = ValidationService.validate(StreamInitializeSchema, body);

      if (!validation.success) {
        return ValidationService.createValidationResponse(validation.errors!);
      }

      const streamData = validation.data!;

      // Generate unique stream key
      const streamKey = generateStreamKey();

      // Create Mux live stream
      const muxService = new MuxService();
      const muxStream = await muxService.createLiveStream({
        playbook_policy: ['public'],
        new_asset_settings: {
          playback_policy: ['public']
        }
      });

      let muxStreamId = '';
      let playbackId = '';
      let rtmpUrl = '';
      let playbackUrl = '';

      if (muxStream) {
        muxStreamId = muxStream.id;
        playbackId = muxStream.playback_ids?.[0]?.id || '';
        rtmpUrl = muxStream.rtmp?.url || '';
        playbackUrl = playbackId ? `https://stream.mux.com/${playbackId}.m3u8` : '';
      }

      // Create stream record in database
      const { data: stream, error: streamError } = await supabase
        .from('streams')
        .insert({
          title: streamData.title,
          description: streamData.description,
          scheduled_start: streamData.scheduled_start,
          status: 'scheduled',
          stream_key: streamKey,
          rtmp_url: rtmpUrl,
          playback_url: playbackUrl,
          panelists: streamData.panelists,
          category: streamData.category,
          topics: streamData.topics || [],
          mux_asset_id: muxStreamId
        })
        .select()
        .single();

      if (streamError) {
        console.error('Failed to create stream record:', streamError);
        return createErrorResponse('Failed to create stream', 500, 'STREAM_CREATION_FAILED');
      }

      // Record admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: 'stream_create',
          target_type: 'stream',
          target_id: stream.id,
          description: `Created stream: ${streamData.title}`,
          success: true
        });

      const response: StreamInitializeResponse = {
        stream: {
          id: stream.id,
          title: stream.title,
          description: stream.description,
          scheduled_start: stream.scheduled_start,
          status: stream.status,
          stream_key: streamKey,
          rtmp_url: rtmpUrl,
          playback_url: playbackUrl,
          panelists: stream.panelists,
          category: stream.category,
          topics: stream.topics
        },
        mux: {
          stream_id: muxStreamId,
          playback_id: playbackId
        },
        instructions: {
          rtmp_server: rtmpUrl,
          stream_key: streamKey,
          software_settings: 'Configure your streaming software with the RTMP server URL and stream key. Recommended settings: 1080p30, 3500 kbps bitrate, H.264 codec.'
        }
      };

      return createSuccessResponse(response, 'Stream initialized successfully');

    } catch (error) {
      console.error('Stream initialization error:', error);
      return createErrorResponse('Failed to initialize stream', 500, 'STREAM_INITIALIZATION_ERROR');
    }
  });
});
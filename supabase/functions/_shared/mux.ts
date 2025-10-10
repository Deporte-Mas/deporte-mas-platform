/**
 * Mux Video Integration Utilities
 *
 * Handles video streaming, VOD management, and live streaming
 */

// Types
export interface MuxUploadRequest {
  cors_origin: string;
  new_asset_settings: {
    playback_policy: string[];
    video_quality: string;
    test?: boolean;
    passthrough?: string;
    meta?: {
      external_id?: string;
      title?: string;
      creator_id?: string;
    };
  };
}

export interface MuxUploadResponse {
  id: string;
  url: string;
  timeout: number;
  status: string;
  new_asset_settings: any;
}

export interface MuxAsset {
  id: string;
  status: string;
  duration?: number;
  playback_ids?: Array<{
    id: string;
    policy: string;
  }>;
  master?: {
    url: string;
  };
  tracks?: any[];
  passthrough?: string;
  meta?: {
    external_id?: string;
    title?: string;
    creator_id?: string;
  };
}

export interface MuxLiveStream {
  id: string;
  stream_key: string;
  rtmp?: {
    url: string;
  };
  playback_ids?: Array<{
    id: string;
    policy: string;
  }>;
  status: string;
  asset_id?: string;
  passthrough?: string;
}

export interface MuxWebhookEvent {
  type: string;
  data: MuxAsset | MuxLiveStream;
  id: string;
  created_at: string;
  object: {
    type: string;
    id: string;
  };
}

// Mux Service Class
export class MuxService {
  private tokenId: string;
  private tokenSecret: string;
  private webhookSecret: string;
  private baseUrl = 'https://api.mux.com';

  constructor() {
    this.tokenId = Deno.env.get('MUX_TOKEN_ID') || '';
    this.tokenSecret = Deno.env.get('MUX_TOKEN_SECRET') || '';
    this.webhookSecret = Deno.env.get('MUX_WEBHOOK_SECRET') || '';

    if (!this.tokenId || !this.tokenSecret) {
      console.warn('Mux credentials not configured - video features will be limited');
    }
  }

  /**
   * Get authorization header for Mux API
   */
  private getAuthHeader(): string {
    const credentials = btoa(`${this.tokenId}:${this.tokenSecret}`);
    return `Basic ${credentials}`;
  }

  /**
   * Create direct upload for video content
   */
  async createDirectUpload(settings: MuxUploadRequest): Promise<MuxUploadResponse | null> {
    try {
      if (!this.tokenId || !this.tokenSecret) {
        console.warn('Mux not configured - cannot create upload');
        return null;
      }

      const response = await fetch(`${this.baseUrl}/video/v1/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Mux API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to create Mux direct upload:', error);
      return null;
    }
  }

  /**
   * Get asset details
   */
  async getAsset(assetId: string): Promise<MuxAsset | null> {
    try {
      if (!this.tokenId || !this.tokenSecret) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/video/v1/assets/${assetId}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      });

      if (!response.ok) {
        throw new Error(`Mux API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get Mux asset:', error);
      return null;
    }
  }

  /**
   * Delete asset
   */
  async deleteAsset(assetId: string): Promise<boolean> {
    try {
      if (!this.tokenId || !this.tokenSecret) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/video/v1/assets/${assetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete Mux asset:', error);
      return false;
    }
  }

  /**
   * Create live stream
   */
  async createLiveStream(settings: {
    playbook_policy?: string[];
    new_asset_settings?: any;
  } = {}): Promise<MuxLiveStream | null> {
    try {
      if (!this.tokenId || !this.tokenSecret) {
        console.warn('Mux not configured - cannot create live stream');
        return null;
      }

      const response = await fetch(`${this.baseUrl}/video/v1/live-streams`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playback_policy: settings.playbook_policy || ['public'],
          new_asset_settings: settings.new_asset_settings || {
            playback_policy: ['public']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Mux API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to create Mux live stream:', error);
      return null;
    }
  }

  /**
   * Get live stream details
   */
  async getLiveStream(streamId: string): Promise<MuxLiveStream | null> {
    try {
      if (!this.tokenId || !this.tokenSecret) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/video/v1/live-streams/${streamId}`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      });

      if (!response.ok) {
        throw new Error(`Mux API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Failed to get Mux live stream:', error);
      return null;
    }
  }

  /**
   * Delete live stream
   */
  async deleteLiveStream(streamId: string): Promise<boolean> {
    try {
      if (!this.tokenId || !this.tokenSecret) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/video/v1/live-streams/${streamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': this.getAuthHeader(),
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to delete Mux live stream:', error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      if (!this.webhookSecret) {
        console.warn('Mux webhook secret not configured');
        return true; // Allow through if not configured
      }

      // Implementation would use crypto to verify HMAC signature
      // This is a placeholder - actual implementation would use:
      // const expectedSignature = crypto.createHmac('sha256', this.webhookSecret)
      //   .update(body)
      //   .digest('hex');
      // return signature === expectedSignature;

      return true; // Placeholder
    } catch (error) {
      console.error('Failed to verify webhook signature:', error);
      return false;
    }
  }

  /**
   * Generate thumbnail URL for asset
   */
  getThumbnailUrl(playbackId: string, options: {
    time?: number;
    width?: number;
    height?: number;
    fit_mode?: 'crop' | 'pad' | 'fill';
  } = {}): string {
    const params = new URLSearchParams();

    if (options.time) params.set('time', options.time.toString());
    if (options.width) params.set('width', options.width.toString());
    if (options.height) params.set('height', options.height.toString());
    if (options.fit_mode) params.set('fit_mode', options.fit_mode);

    const queryString = params.toString();
    return `https://image.mux.com/${playbackId}/thumbnail.jpg${queryString ? `?${queryString}` : ''}`;
  }

  /**
   * Generate video URL for playback
   */
  getVideoUrl(playbackId: string, format: 'hls' | 'mp4' = 'hls'): string {
    if (format === 'hls') {
      return `https://stream.mux.com/${playbackId}.m3u8`;
    } else {
      return `https://stream.mux.com/${playbackId}.mp4`;
    }
  }

  /**
   * Get live stream playback URL
   */
  getLiveStreamUrl(playbackId: string): string {
    return `https://stream.mux.com/${playbackId}.m3u8`;
  }
}

// Video Processing Service
export class VideoProcessingService {
  private mux: MuxService;
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.mux = new MuxService();
    this.supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    this.supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  }

  /**
   * Get Supabase client with service role key for webhook operations
   */
  private getSupabaseClient() {
    // Dynamic import to avoid circular dependencies
    // Using service role key for webhook operations
    return {
      from: (table: string) => ({
        update: async (data: any) => ({
          eq: (column: string, value: any) => {
            return this.executeQuery('UPDATE', table, data, column, value);
          }
        }),
        insert: async (data: any) => ({
          select: () => ({
            single: async () => {
              return this.executeQuery('INSERT', table, data);
            }
          })
        })
      })
    };
  }

  /**
   * Execute Supabase query using REST API
   */
  private async executeQuery(
    method: string,
    table: string,
    data: any,
    filterColumn?: string,
    filterValue?: any
  ): Promise<{ data: any; error: any }> {
    try {
      let url = `${this.supabaseUrl}/rest/v1/${table}`;
      let fetchMethod = 'POST';

      if (method === 'UPDATE' && filterColumn && filterValue) {
        url += `?${filterColumn}=eq.${filterValue}`;
        fetchMethod = 'PATCH';
      }

      const response = await fetch(url, {
        method: fetchMethod,
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.text();
        return { data: null, error: new Error(error) };
      }

      const result = await response.json();
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Initialize video upload process
   */
  async initializeUpload(contentData: {
    title: string;
    description?: string;
    type: string;
    is_premium: boolean;
  }): Promise<{
    upload_url: string;
    upload_id: string;
    content_id: string;
  } | null> {
    try {
      // Create upload with Mux
      const upload = await this.mux.createDirectUpload({
        cors_origin: Deno.env.get('FRONTEND_URL') || '*',
        new_asset_settings: {
          playback_policy: ['public'],
          video_quality: 'plus',
          test: Deno.env.get('VITE_DEV_MODE') === 'true'
        }
      });

      if (!upload) {
        return null;
      }

      return {
        upload_url: upload.url,
        upload_id: upload.id,
        content_id: crypto.randomUUID()
      };
    } catch (error) {
      console.error('Failed to initialize video upload:', error);
      return null;
    }
  }

  /**
   * Process Mux webhook events
   */
  async processWebhookEvent(event: MuxWebhookEvent): Promise<void> {
    try {
      switch (event.type) {
        case 'video.asset.ready':
          await this.handleAssetReady(event.data as MuxAsset);
          break;

        case 'video.asset.errored':
          await this.handleAssetError(event.data as MuxAsset);
          break;

        case 'video.upload.asset_created':
          await this.handleUploadAssetCreated(event.data as MuxAsset);
          break;

        case 'video.live_stream.connected':
          await this.handleLiveStreamConnected(event.data as MuxLiveStream);
          break;

        case 'video.live_stream.disconnected':
          await this.handleLiveStreamDisconnected(event.data as MuxLiveStream);
          break;

        default:
          console.log(`Unhandled Mux webhook event: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to process Mux webhook event:', error);
    }
  }

  private async handleAssetReady(asset: MuxAsset): Promise<void> {
    console.log(`Mux asset ready: ${asset.id}`);

    try {
      const playbackId = asset.playback_ids?.[0]?.id || '';
      const duration = Math.floor(asset.duration || 0);

      // Generate thumbnail URL
      const thumbnailUrl = playbackId
        ? this.mux.getThumbnailUrl(playbackId, { width: 1280, height: 720, time: 1 })
        : null;

      // Update video record with ready status
      const { error } = await this.executeQuery(
        'UPDATE',
        'videos',
        {
          status: 'ready',
          mux_playback_id: playbackId,
          duration: duration,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        },
        'mux_asset_id',
        asset.id
      );

      if (error) {
        console.error('Failed to update video record:', error);
      } else {
        console.log(`Video ${asset.id} marked as ready with playback_id ${playbackId}`);
      }
    } catch (error) {
      console.error('Error handling asset ready:', error);
    }
  }

  private async handleAssetError(asset: MuxAsset): Promise<void> {
    console.error(`Mux asset error: ${asset.id}`);

    try {
      // Update video record with error status
      const { error } = await this.executeQuery(
        'UPDATE',
        'videos',
        {
          status: 'error',
          updated_at: new Date().toISOString()
        },
        'mux_asset_id',
        asset.id
      );

      if (error) {
        console.error('Failed to update video record with error status:', error);
      } else {
        console.log(`Video ${asset.id} marked as error`);
      }
    } catch (error) {
      console.error('Error handling asset error:', error);
    }
  }

  private async handleUploadAssetCreated(asset: MuxAsset): Promise<void> {
    console.log(`Mux upload asset created: ${asset.id}`);

    try {
      // Extract video_id from passthrough or meta.external_id
      const videoId = asset.passthrough || asset.meta?.external_id;

      if (!videoId) {
        console.error('No passthrough or external_id found on asset - cannot link to video');
        console.error('Asset data:', JSON.stringify(asset, null, 2));
        return;
      }

      console.log(`Linking asset ${asset.id} to video ${videoId}`);

      // Update video record to link mux_asset_id
      const { error } = await this.executeQuery(
        'UPDATE',
        'videos',
        {
          mux_asset_id: asset.id,
          status: 'processing',
          updated_at: new Date().toISOString()
        },
        'id',  // Use video.id (from passthrough) instead of mux_asset_id
        videoId
      );

      if (error) {
        console.error('Failed to link upload to video record:', error);
      } else {
        console.log(`Upload linked to video ${videoId} for asset ${asset.id}`);
      }
    } catch (error) {
      console.error('Error handling upload asset created:', error);
    }
  }

  private async handleLiveStreamConnected(stream: MuxLiveStream): Promise<void> {
    console.log(`Live stream connected: ${stream.id}`);

    try {
      // Extract stream_id from passthrough (if admin created stream with metadata)
      const streamId = stream.passthrough;

      if (!streamId) {
        console.warn('No passthrough found on livestream - cannot update stream record');
        return;
      }

      // Update stream status to 'live'
      const { error } = await this.executeQuery(
        'UPDATE',
        'streams',
        {
          status: 'live',
          actual_start: new Date().toISOString(),
          mux_asset_id: stream.id,  // Store Mux livestream ID
          updated_at: new Date().toISOString()
        },
        'id',  // Use our streams.id (from passthrough)
        streamId
      );

      if (error) {
        console.error('Failed to update stream to live:', error);
      } else {
        console.log(`Stream ${streamId} is now live (Mux: ${stream.id})`);
      }
    } catch (error) {
      console.error('Error handling live stream connected:', error);
    }
  }

  private async handleLiveStreamDisconnected(stream: MuxLiveStream): Promise<void> {
    console.log(`Live stream disconnected: ${stream.id}`);

    try {
      // Extract stream_id from passthrough
      const streamId = stream.passthrough;

      if (!streamId) {
        console.warn('No passthrough found on livestream - cannot update stream record');
        return;
      }

      // Update stream status to 'ended'
      const { data: streamData, error: streamError } = await this.executeQuery(
        'UPDATE',
        'streams',
        {
          status: 'ended',
          actual_end: new Date().toISOString(),
          vod_available: !!stream.asset_id,  // VOD is available if asset_id exists
          mux_asset_id: stream.id,  // Store Mux livestream ID
          updated_at: new Date().toISOString()
        },
        'id',  // Use our streams.id (from passthrough)
        streamId
      );

      if (streamError) {
        console.error('Failed to update stream to ended:', streamError);
        return;
      }

      console.log(`Stream ${streamId} has ended (Mux: ${stream.id})`);

      // Create video record from livestream VOD if asset_id is available
      if (stream.asset_id) {
        console.log(`Creating video record from livestream VOD asset ${stream.asset_id}`);

        // Get the stream record to get title and other details
        const streamRecord = Array.isArray(streamData) ? streamData[0] : streamData;

        // Fetch asset details from Mux to get playback_id and duration
        const asset = await this.mux.getAsset(stream.asset_id);

        if (asset) {
          const playbackId = asset.playback_ids?.[0]?.id || '';
          const duration = Math.floor(asset.duration || 0);
          const thumbnailUrl = playbackId
            ? this.mux.getThumbnailUrl(playbackId, { width: 1280, height: 720, time: 1 })
            : null;

          // Create video record linked to this stream
          const { error: videoError } = await this.executeQuery(
            'INSERT',
            'videos',
            {
              title: `${streamRecord?.title || 'Livestream'} (Recording)`,
              description: streamRecord?.description || null,
              thumbnail_url: thumbnailUrl,
              mux_asset_id: stream.asset_id,
              mux_playback_id: playbackId,
              duration: duration,
              status: asset.status === 'ready' ? 'ready' : 'processing',
              is_public: false,
              requires_subscription: true,
              stream_id: streamRecord?.id || null,
              source_type: 'livestream_vod'
            }
          );

          if (videoError) {
            console.error('Failed to create video from livestream VOD:', videoError);
          } else {
            console.log(`Created video record for livestream VOD asset ${stream.asset_id}`);
          }
        } else {
          console.warn(`Could not fetch asset details for ${stream.asset_id}`);
        }
      } else {
        console.log('No asset_id provided - VOD may not be available yet');
      }
    } catch (error) {
      console.error('Error handling live stream disconnected:', error);
    }
  }
}

// Streaming utilities
export const generateStreamKey = (): string => {
  return `dk_${crypto.randomUUID().replace(/-/g, '')}`;
};

export const isVideoReady = (asset: MuxAsset): boolean => {
  return asset.status === 'ready' && asset.playback_ids && asset.playback_ids.length > 0;
};

export const getVideoDuration = (asset: MuxAsset): number => {
  return Math.floor(asset.duration || 0);
};

export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default {
  MuxService,
  VideoProcessingService,
  generateStreamKey,
  isVideoReady,
  getVideoDuration,
  formatDuration
};
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

  constructor() {
    this.mux = new MuxService();
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
          test: Deno.env.get('NODE_ENV') !== 'production'
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
    // Implementation would update content table with ready status
  }

  private async handleAssetError(asset: MuxAsset): Promise<void> {
    console.error(`Mux asset error: ${asset.id}`);
    // Implementation would update content table with error status
  }

  private async handleUploadAssetCreated(asset: MuxAsset): Promise<void> {
    console.log(`Mux upload asset created: ${asset.id}`);
    // Implementation would link upload to content record
  }

  private async handleLiveStreamConnected(stream: MuxLiveStream): Promise<void> {
    console.log(`Live stream connected: ${stream.id}`);
    // Implementation would update stream status to 'live'
  }

  private async handleLiveStreamDisconnected(stream: MuxLiveStream): Promise<void> {
    console.log(`Live stream disconnected: ${stream.id}`);
    // Implementation would update stream status to 'ended'
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
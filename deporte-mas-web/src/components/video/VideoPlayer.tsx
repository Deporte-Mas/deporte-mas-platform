import React, { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { supabase } from '@/lib/supabase';

interface VideoPlayerProps {
  videoId?: string;
  playbackId?: string;
  title?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  playbackId: providedPlaybackId,
  title,
  autoPlay = false,
  className = '',
  onEnded,
}) => {
  const [playbackId, setPlaybackId] = useState<string | null>(providedPlaybackId || null);
  const [loading, setLoading] = useState(!providedPlaybackId);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccessAndLoadVideo = async () => {
      try {
        // Check if user has active subscription
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Please sign in to watch videos');
          setLoading(false);
          return;
        }

        // Get user subscription status
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', session.user.id)
          .single();

        if (userError) {
          throw userError;
        }

        const hasActiveSubscription = user?.subscription_status === 'active';
        setHasAccess(hasActiveSubscription);

        if (!hasActiveSubscription) {
          setError('Active subscription required to watch videos');
          setLoading(false);
          return;
        }

        // If we need to fetch video details
        if (videoId && !providedPlaybackId) {
          const { data: video, error: videoError } = await supabase
            .from('videos')
            .select('mux_playback_id, status, requires_subscription')
            .eq('id', videoId)
            .single();

          if (videoError) {
            throw videoError;
          }

          if (!video) {
            throw new Error('Video not found');
          }

          if (video.status !== 'ready') {
            setError('Video is still processing. Please check back later.');
            setLoading(false);
            return;
          }

          if (!video.mux_playback_id) {
            throw new Error('Video playback not available');
          }

          setPlaybackId(video.mux_playback_id);

          // Track video view - increment view count
          await supabase.rpc('increment_video_views', { video_id: videoId });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading video:', err);
        setError(err instanceof Error ? err.message : 'Failed to load video');
        setLoading(false);
      }
    };

    checkAccessAndLoadVideo();
  }, [videoId, providedPlaybackId]);

  const handleEnded = () => {
    if (onEnded) {
      onEnded();
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!playbackId) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-white p-8">
          <p>No video available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MuxPlayer
        playbackId={playbackId}
        metadata={{
          video_title: title || 'DeporteMás Video',
        }}
        streamType="on-demand"
        autoPlay={autoPlay}
        onEnded={handleEnded}
        className="w-full"
      />
    </div>
  );
};

export default VideoPlayer;

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchVideos, type Video } from '@/lib/admin-api';
import { Video as VideoIcon, Plus, Upload, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const data = await fetchVideos();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Processing
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Video Management</h2>
          <p className="text-muted-foreground">
            Upload and manage videos ({videos.length} total)
          </p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Video
        </Button>
      </div>

      {/* Videos Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg truncate">{video.title}</CardTitle>
                {getStatusBadge(video.status)}
              </div>
              {video.description && (
                <CardDescription className="line-clamp-2">
                  {video.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center">
                  <VideoIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Duration: {formatDuration(video.duration)}</span>
                <span>{video.view_count} views</span>
              </div>

              {video.requires_subscription && (
                <Badge variant="outline" className="w-full justify-center">
                  Requires Subscription
                </Badge>
              )}

              {video.mux_playback_id && (
                <div className="text-xs text-gray-500">
                  Mux ID: {video.mux_playback_id.slice(0, 12)}...
                </div>
              )}

              <div className="text-xs text-gray-500">
                Uploaded: {new Date(video.created_at).toLocaleDateString('en-US')}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <VideoIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No videos yet. Upload your first video!</p>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoManagement;

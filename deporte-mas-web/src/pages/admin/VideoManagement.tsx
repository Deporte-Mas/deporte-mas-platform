import React, { useEffect, useState, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { fetchVideos, initializeVideoUpload, uploadVideoFile, type Video } from '@/lib/admin-api';
import { Video as VideoIcon, Plus, Upload, Clock, CheckCircle, AlertCircle, Loader2, Play, Trash2, Radio, Link as LinkIcon } from 'lucide-react';

const VideoManagement: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      if (!formData.file) {
        throw new Error('Please select a video file');
      }

      if (!formData.title.trim()) {
        throw new Error('Please enter a video title');
      }

      // Step 1: Initialize upload with backend
      setUploadProgress(10);
      const uploadInit = await initializeVideoUpload({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        is_public: false,
        requires_subscription: true,
      });

      // Step 2: Upload file directly to Mux
      setUploadProgress(30);
      await uploadVideoFile(uploadInit.upload_url, formData.file);

      // Step 3: Upload complete
      setUploadProgress(100);

      // Reset form and close dialog
      setFormData({ title: '', description: '', file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadDialogOpen(false);

      // Reload videos list
      await loadVideos();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadLoading(false);
      setUploadProgress(0);
    }
  };

  const handlePreviewVideo = (video: Video) => {
    setPreviewVideo(video);
    setPreviewDialogOpen(true);
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
      case 'uploading':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Upload className="w-3 h-3 mr-1" />
            Uploading
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

  const getSourceTypeBadge = (sourceType?: string) => {
    switch (sourceType) {
      case 'livestream_vod':
        return (
          <Badge variant="outline" className="text-xs">
            <Radio className="w-3 h-3 mr-1" />
            Livestream VOD
          </Badge>
        );
      case 'external':
        return (
          <Badge variant="outline" className="text-xs">
            <LinkIcon className="w-3 h-3 mr-1" />
            External
          </Badge>
        );
      case 'upload':
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <Upload className="w-3 h-3 mr-1" />
            Upload
          </Badge>
        );
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
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Video Management</h2>
          <p className="text-gray-500 mt-1">
            Upload and manage videos ({videos.length} total)
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Video</DialogTitle>
              <DialogDescription>
                Upload a new video to the platform. The video will be processed by Mux.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Video title"
                  required
                  disabled={uploadLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Video description"
                  rows={3}
                  disabled={uploadLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Video File *</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  required
                  disabled={uploadLoading}
                />
                {formData.file && (
                  <p className="text-sm text-gray-500">
                    Selected: {formData.file.name} ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              {uploadError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {uploadError}
                </div>
              )}
              {uploadLoading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {uploadProgress < 30 ? 'Initializing upload...' : 'Uploading video to Mux...'}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadDialogOpen(false)}
                  disabled={uploadLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadLoading}>
                  {uploadLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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

              <div className="flex flex-wrap gap-2">
                {getSourceTypeBadge(video.source_type)}
                {video.requires_subscription && (
                  <Badge variant="outline" className="text-xs">
                    Requires Subscription
                  </Badge>
                )}
              </div>

              {video.mux_playback_id && (
                <div className="text-xs text-gray-500">
                  Mux ID: {video.mux_playback_id.slice(0, 12)}...
                </div>
              )}

              <div className="text-xs text-gray-500">
                Uploaded: {new Date(video.created_at).toLocaleDateString('en-US')}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handlePreviewVideo(video)}
                  disabled={video.status !== 'ready' || !video.mux_playback_id}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <VideoIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No videos yet. Upload your first video!</p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title}</DialogTitle>
            {previewVideo?.description && (
              <DialogDescription>{previewVideo.description}</DialogDescription>
            )}
          </DialogHeader>
          {previewVideo?.mux_playback_id ? (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <MuxPlayer
                  playbackId={previewVideo.mux_playback_id}
                  metadata={{
                    video_title: previewVideo.title,
                  }}
                  streamType="on-demand"
                  className="w-full h-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>{' '}
                  {getStatusBadge(previewVideo.status)}
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>{' '}
                  {formatDuration(previewVideo.duration)}
                </div>
                <div>
                  <span className="text-gray-500">Views:</span>{' '}
                  {previewVideo.view_count}
                </div>
                <div>
                  <span className="text-gray-500">Uploaded:</span>{' '}
                  {new Date(previewVideo.created_at).toLocaleDateString('en-US')}
                </div>
                {previewVideo.mux_playback_id && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Playback ID:</span>{' '}
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {previewVideo.mux_playback_id}
                    </code>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <VideoIcon className="w-12 h-12 mx-auto mb-2" />
                <p>No preview available</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoManagement;

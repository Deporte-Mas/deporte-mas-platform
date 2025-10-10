import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ThumbnailUploader from './ThumbnailUploader';
import { fetchVideos, createCourseModule, updateCourseModule, type CourseModule, type Video } from '@/lib/admin-api';
import { Loader2, Save, Video as VideoIcon, FileText } from 'lucide-react';

interface ModuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  module?: CourseModule;
  onSuccess: () => void;
  nextOrderIndex: number;
}

const ModuleEditor: React.FC<ModuleEditorProps> = ({
  open,
  onOpenChange,
  courseId,
  module,
  onSuccess,
  nextOrderIndex,
}) => {
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    video_id: '',
    content_text: '',
    aired_at: '',
  });

  useEffect(() => {
    if (open) {
      loadVideos();

      // Populate form if editing existing module
      if (module) {
        setFormData({
          title: module.title || '',
          description: module.description || '',
          thumbnail_url: module.thumbnail_url || '',
          video_id: module.video_id || '',
          content_text: module.content_text || '',
          aired_at: module.aired_at ? new Date(module.aired_at).toISOString().split('T')[0] : '',
        });
      } else {
        // Reset form for new module
        setFormData({
          title: '',
          description: '',
          thumbnail_url: '',
          video_id: '',
          content_text: '',
          aired_at: '',
        });
      }
    }
  }, [open, module]);

  const loadVideos = async () => {
    setLoadingVideos(true);
    try {
      const data = await fetchVideos();
      // Filter to only show ready videos
      const readyVideos = data.filter(v => v.status === 'ready');
      setVideos(readyVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const moduleData = {
        course_id: courseId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        video_id: formData.video_id || undefined,
        content_text: formData.content_text.trim() || undefined,
        aired_at: formData.aired_at ? new Date(formData.aired_at).toISOString() : undefined,
        order_index: module ? module.order_index : nextOrderIndex,
      };

      if (module) {
        // Update existing module
        await updateCourseModule(module.id, moduleData);
      } else {
        // Create new module
        await createCourseModule(moduleData);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving module:', error);
      alert('Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const selectedVideo = videos.find(v => v.id === formData.video_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {module ? 'Edit Module' : 'Add New Module'}
          </DialogTitle>
          <DialogDescription>
            {module
              ? 'Update the module details below.'
              : 'Add a new module, episode, or lesson to this course.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Module Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Episodio 15: Post Clásico Nacional"
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief summary of this module..."
              rows={2}
              disabled={saving}
            />
          </div>

          <ThumbnailUploader
            label="Module Thumbnail"
            onUpload={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
            currentUrl={formData.thumbnail_url}
          />

          <div className="space-y-2">
            <Label htmlFor="video_id">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4" />
                Video (Optional)
              </div>
            </Label>
            <Select
              value={formData.video_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, video_id: value }))}
              disabled={saving || loadingVideos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingVideos ? "Loading videos..." : "Select a video (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  <em>No video (text-only module)</em>
                </SelectItem>
                {videos.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="truncate">{video.title}</span>
                      {video.source_type === 'livestream_vod' && (
                        <span className="ml-2 text-xs text-gray-500">VOD</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVideo && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  {selectedVideo.thumbnail_url && (
                    <img
                      src={selectedVideo.thumbnail_url}
                      alt={selectedVideo.title}
                      className="w-16 h-9 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{selectedVideo.title}</div>
                    <div className="text-gray-500">
                      {selectedVideo.duration && `${Math.floor(selectedVideo.duration / 60)}:${(selectedVideo.duration % 60).toString().padStart(2, '0')}`}
                      {selectedVideo.source_type && ` • ${selectedVideo.source_type}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content_text">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Text Content (Optional)
              </div>
            </Label>
            <Textarea
              id="content_text"
              value={formData.content_text}
              onChange={(e) => setFormData(prev => ({ ...prev, content_text: e.target.value }))}
              placeholder="Additional text content, context, or educational material..."
              rows={6}
              disabled={saving}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Add educational content, context, or use this for text-only modules
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aired_at">Aired Date (Optional)</Label>
            <Input
              id="aired_at"
              type="date"
              value={formData.aired_at}
              onChange={(e) => setFormData(prev => ({ ...prev, aired_at: e.target.value }))}
              disabled={saving}
            />
            <p className="text-xs text-gray-500">
              For live shows, set when this episode originally aired
            </p>
          </div>

          {!formData.video_id && !formData.content_text && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              ⚠️ Note: This module has neither video nor text content. Consider adding at least one.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {module ? 'Update Module' : 'Add Module'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleEditor;

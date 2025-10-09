import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import ThumbnailUploader from '@/components/admin/ThumbnailUploader';
import { fetchCourses, createCourse, updateCourse, type Course } from '@/lib/admin-api';
import { BookOpen, Plus, Eye, EyeOff, Loader2, Tv, Film, Library, GraduationCap, Gamepad2, Edit } from 'lucide-react';

const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_type: 'educational' as Course['course_type'],
    host_name: '',
    thumbnail_url: '',
    is_published: false,
    requires_subscription: true,
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCourses(data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await createCourse({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        course_type: formData.course_type,
        host_name: formData.host_name.trim() || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        is_published: formData.is_published,
        requires_subscription: formData.requires_subscription,
        display_order: courses.length, // Add to end
      });

      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        course_type: 'educational',
        host_name: '',
        thumbnail_url: '',
        is_published: false,
        requires_subscription: true,
      });
      setCreateDialogOpen(false);

      // Reload courses
      await loadCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Failed to create course');
    } finally {
      setCreating(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      course_type: course.course_type,
      host_name: course.host_name || '',
      thumbnail_url: course.thumbnail_url || '',
      is_published: course.is_published,
      requires_subscription: course.requires_subscription,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setCreating(true);

    try {
      await updateCourse(editingCourse.id, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        course_type: formData.course_type,
        host_name: formData.host_name.trim() || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        is_published: formData.is_published,
        requires_subscription: formData.requires_subscription,
      });

      // Reset and close
      setEditDialogOpen(false);
      setEditingCourse(null);

      // Reload courses
      await loadCourses();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course');
    } finally {
      setCreating(false);
    }
  };

  const getCourseTypeIcon = (type: Course['course_type']) => {
    switch (type) {
      case 'live_show': return <Tv className="w-4 h-4" />;
      case 'documentary': return <Film className="w-4 h-4" />;
      case 'miniseries': return <Library className="w-4 h-4" />;
      case 'educational': return <GraduationCap className="w-4 h-4" />;
      case 'interactive': return <Gamepad2 className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getCourseTypeLabel = (type: Course['course_type']) => {
    switch (type) {
      case 'live_show': return 'Live Show';
      case 'documentary': return 'Documentary';
      case 'miniseries': return 'Miniseries';
      case 'educational': return 'Educational';
      case 'interactive': return 'Interactive';
      default: return type;
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Course Management</h2>
          <p className="text-muted-foreground">
            Create and manage courses ({courses.length} total)
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Create a new course, live show, documentary, or educational series.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., El Show de Pablo Izaguirre"
                  required
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course_type">Course Type *</Label>
                <Select
                  value={formData.course_type}
                  onValueChange={(value: Course['course_type']) => setFormData(prev => ({ ...prev, course_type: value }))}
                  disabled={creating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live_show">
                      <div className="flex items-center">
                        <Tv className="w-4 h-4 mr-2" />
                        Live Show (Episodic)
                      </div>
                    </SelectItem>
                    <SelectItem value="documentary">
                      <div className="flex items-center">
                        <Film className="w-4 h-4 mr-2" />
                        Documentary
                      </div>
                    </SelectItem>
                    <SelectItem value="miniseries">
                      <div className="flex items-center">
                        <Library className="w-4 h-4 mr-2" />
                        Miniseries
                      </div>
                    </SelectItem>
                    <SelectItem value="educational">
                      <div className="flex items-center">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Educational Course
                      </div>
                    </SelectItem>
                    <SelectItem value="interactive">
                      <div className="flex items-center">
                        <Gamepad2 className="w-4 h-4 mr-2" />
                        Interactive Content
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="host_name">Host / Creator</Label>
                <Input
                  id="host_name"
                  value={formData.host_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, host_name: e.target.value }))}
                  placeholder="e.g., Pablo Izaguirre"
                  disabled={creating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the course..."
                  rows={3}
                  disabled={creating}
                />
              </div>

              <ThumbnailUploader
                label="Course Thumbnail"
                onUpload={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
                currentUrl={formData.thumbnail_url}
              />

              <div className="flex items-center justify-between">
                <Label htmlFor="is_published">Publish Immediately</Label>
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                  disabled={creating}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="requires_subscription">Requires Subscription</Label>
                <Switch
                  id="requires_subscription"
                  checked={formData.requires_subscription}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_subscription: checked }))}
                  disabled={creating}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Courses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getCourseTypeIcon(course.course_type)}
                  <span className="truncate">{course.title}</span>
                </CardTitle>
                <Badge variant={course.is_published ? 'default' : 'secondary'}>
                  {course.is_published ? (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Published
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Draft
                    </>
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {getCourseTypeLabel(course.course_type)}
                </Badge>
                {course.host_name && (
                  <Badge variant="outline" className="text-xs">
                    {course.host_name}
                  </Badge>
                )}
              </div>
              {course.description && (
                <CardDescription className="line-clamp-2 mt-2">
                  {course.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-32 object-cover rounded-md"
                />
              )}

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{course.module_count || 0} modules</span>
                <span>{course.lesson_count || 0} lessons</span>
              </div>

              {course.requires_subscription && (
                <Badge variant="outline" className="w-full justify-center">
                  Requires Subscription
                </Badge>
              )}

              <div className="text-xs text-gray-500">
                Created: {new Date(course.created_at).toLocaleDateString('en-US')}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEditCourse(course)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/admin/courses/${course.id}`)}
                >
                  Modules
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course details below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCourse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., El Show de Pablo Izaguirre"
                required
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-course_type">Course Type *</Label>
              <Select
                value={formData.course_type}
                onValueChange={(value: Course['course_type']) => setFormData(prev => ({ ...prev, course_type: value }))}
                disabled={creating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live_show">
                    <div className="flex items-center">
                      <Tv className="w-4 h-4 mr-2" />
                      Live Show (Episodic)
                    </div>
                  </SelectItem>
                  <SelectItem value="documentary">
                    <div className="flex items-center">
                      <Film className="w-4 h-4 mr-2" />
                      Documentary
                    </div>
                  </SelectItem>
                  <SelectItem value="miniseries">
                    <div className="flex items-center">
                      <Library className="w-4 h-4 mr-2" />
                      Miniseries
                    </div>
                  </SelectItem>
                  <SelectItem value="educational">
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Educational Course
                    </div>
                  </SelectItem>
                  <SelectItem value="interactive">
                    <div className="flex items-center">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      Interactive Content
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-host_name">Host / Creator</Label>
              <Input
                id="edit-host_name"
                value={formData.host_name}
                onChange={(e) => setFormData(prev => ({ ...prev, host_name: e.target.value }))}
                placeholder="e.g., Pablo Izaguirre"
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the course..."
                rows={3}
                disabled={creating}
              />
            </div>

            <ThumbnailUploader
              label="Course Thumbnail"
              onUpload={(url) => setFormData(prev => ({ ...prev, thumbnail_url: url }))}
              currentUrl={formData.thumbnail_url}
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-is_published">Publish Immediately</Label>
              <Switch
                id="edit-is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                disabled={creating}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="edit-requires_subscription">Requires Subscription</Label>
              <Switch
                id="edit-requires_subscription"
                checked={formData.requires_subscription}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_subscription: checked }))}
                disabled={creating}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Course
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No courses yet. Create your first course!</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CourseManagement;

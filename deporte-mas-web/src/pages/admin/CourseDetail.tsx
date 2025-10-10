import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ModuleEditor from '@/components/admin/ModuleEditor';
import {
  fetchCourses,
  fetchCourseModules,
  deleteCourseModule,
  type Course,
  type CourseModule,
} from '@/lib/admin-api';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Video as VideoIcon,
  FileText,
  Calendar,
  GripVertical,
} from 'lucide-react';

const CourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleEditorOpen, setModuleEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | undefined>();

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    if (!courseId) return;

    setLoading(true);
    try {
      // Load course details
      const courses = await fetchCourses();
      const foundCourse = courses.find(c => c.id === courseId);
      setCourse(foundCourse || null);

      // Load modules
      const modulesData = await fetchCourseModules(courseId);
      setModules(modulesData);
    } catch (error) {
      console.error('Error loading course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = () => {
    setEditingModule(undefined);
    setModuleEditorOpen(true);
  };

  const handleEditModule = (module: CourseModule) => {
    setEditingModule(module);
    setModuleEditorOpen(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCourseModule(moduleId);
      await loadCourseData();
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module');
    }
  };

  const handleModuleSuccess = async () => {
    await loadCourseData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Button>
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              Course not found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Course Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              {course.description && (
                <CardDescription className="mt-2">
                  {course.description}
                </CardDescription>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline">
                  {course.course_type?.replace('_', ' ').toUpperCase()}
                </Badge>
                {course.host_name && (
                  <Badge variant="outline">
                    Host: {course.host_name}
                  </Badge>
                )}
                <Badge variant={course.is_published ? 'default' : 'secondary'}>
                  {course.is_published ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>
            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-32 h-18 object-cover rounded-lg"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {modules.length} module{modules.length !== 1 ? 's' : ''}
            </div>
            <Button onClick={() => navigate(`/admin/courses/${courseId}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Course
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modules Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Modules & Episodes</h3>
          <Button onClick={handleAddModule}>
            <Plus className="mr-2 h-4 w-4" />
            Add Module
          </Button>
        </div>

        {modules.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">No modules yet. Add your first module!</p>
                <Button onClick={handleAddModule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Module
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {modules.map((module, index) => (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <GripVertical className="w-5 h-5" />
                      <span className="text-sm font-medium">#{index + 1}</span>
                    </div>

                    {module.thumbnail_url && (
                      <img
                        src={module.thumbnail_url}
                        alt={module.title}
                        className="w-24 h-14 object-cover rounded"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{module.title}</h4>
                      {module.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {module.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {module.video_id && (
                          <Badge variant="outline" className="text-xs">
                            <VideoIcon className="w-3 h-3 mr-1" />
                            Has Video
                          </Badge>
                        )}
                        {module.content_text && (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Has Text
                          </Badge>
                        )}
                        {module.aired_at && (
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(module.aired_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditModule(module)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteModule(module.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Module Editor Dialog */}
      <ModuleEditor
        open={moduleEditorOpen}
        onOpenChange={setModuleEditorOpen}
        courseId={courseId!}
        module={editingModule}
        onSuccess={handleModuleSuccess}
        nextOrderIndex={modules.length}
      />
    </div>
  );
};

export default CourseDetail;

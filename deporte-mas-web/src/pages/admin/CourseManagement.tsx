import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchCourses, type Course } from '@/lib/admin-api';
import { BookOpen, Plus, Eye, EyeOff } from 'lucide-react';

const CourseManagement: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Courses Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{course.title}</CardTitle>
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
              {course.description && (
                <CardDescription className="line-clamp-2">
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
                <Button size="sm" variant="outline" className="flex-1">
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Modules
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="mb-4">No courses yet. Create your first course!</p>
              <Button>
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

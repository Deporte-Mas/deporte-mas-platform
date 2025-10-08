import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { fetchDashboardStats, type DashboardStats } from '@/lib/admin-api';
import { Users, CreditCard, DollarSign, BookOpen, Video, Radio, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      description: 'Registered users',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      description: 'Currently active',
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats?.monthlyRevenue || 0}`,
      description: 'Current month',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Total Courses',
      value: stats?.totalCourses || 0,
      description: 'Published courses',
      icon: BookOpen,
      color: 'text-purple-600',
    },
    {
      title: 'Total Videos',
      value: stats?.totalVideos || 0,
      description: 'Ready videos',
      icon: Video,
      color: 'text-pink-600',
    },
    {
      title: 'Live Streams',
      value: `${stats?.liveStreams || 0} / ${stats?.totalStreams || 0}`,
      description: 'Live / Total streams',
      icon: Radio,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of Deporte+ platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Create and manage content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => navigate('/admin/courses')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Course
            </Button>
            <Button
              onClick={() => navigate('/admin/videos')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
            <Button
              onClick={() => navigate('/admin/livestreams')}
              className="w-full justify-start"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Schedule Livestream
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>
              Key platform statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Conversion Rate</span>
              <span className="text-sm font-medium">
                {stats?.activeSubscriptions && stats?.totalUsers
                  ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg. Revenue per User</span>
              <span className="text-sm font-medium">
                ${stats?.activeSubscriptions
                  ? Math.round((stats.monthlyRevenue || 0) / stats.activeSubscriptions)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Content Items</span>
              <span className="text-sm font-medium">
                {(stats?.totalCourses || 0) + (stats?.totalVideos || 0) + (stats?.totalStreams || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

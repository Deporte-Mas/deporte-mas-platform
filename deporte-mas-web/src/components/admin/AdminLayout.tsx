import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Video,
  Radio,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Courses', href: '/admin/courses', icon: BookOpen },
  { name: 'Videos', href: '/admin/videos', icon: Video },
  { name: 'Livestreams', href: '/admin/livestreams', icon: Radio },
];

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="text-white hover:text-white hover:bg-transparent"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {navigation.find(item => item.href === location.pathname)?.name || 'Admin'}
            </h1>
            <div className="text-sm text-gray-500">
              Deporte+ Admin
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const SidebarContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/auth/login');
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Deporte+ Admin</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 p-4 space-y-3">
        {user && (
          <div className="text-xs text-gray-600">
            <p className="font-medium">{user.name || user.email}</p>
            <p className="text-gray-500">{user.role}</p>
          </div>
        )}
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
        <p className="text-xs text-gray-500">
          © 2025 Deporte+ Club
        </p>
      </div>
    </div>
  );
};

export default AdminLayout;

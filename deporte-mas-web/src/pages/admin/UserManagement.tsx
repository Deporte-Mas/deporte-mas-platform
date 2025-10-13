import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchUsers, searchUsers, type User } from '@/lib/admin-api';
import { Mail, Calendar, CreditCard, Search } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      loadUsers();
      return;
    }

    try {
      const data = await searchUsers(query);
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Active' : 'Inactive';
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
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h2>
        <p className="text-gray-500 mt-1">
          Manage registered users ({users.length} total)
        </p>
      </div>

      {/* Search */}
      <div className="relative bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search by email or name..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-white border-gray-300"
        />
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">
                  {user.name || 'No name'}
                </CardTitle>
                <Badge className={getStatusColor(user.subscription_status)}>
                  {getStatusText(user.subscription_status)}
                </Badge>
              </div>
              <CardDescription className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Registered: {new Date(user.created_at).toLocaleDateString('en-US')}
              </div>

              {user.subscription_status === 'active' && (
                <div className="flex items-center text-sm text-green-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Active Subscriber
                </div>
              )}

              {user.phone && (
                <div className="text-sm text-gray-600">
                  <strong>Phone:</strong> {user.phone}
                </div>
              )}

              {user.country && (
                <div className="text-sm text-gray-600">
                  <strong>Country:</strong> {user.country}
                </div>
              )}

              {user.stripe_customer_id && (
                <div className="text-xs text-gray-500">
                  <strong>Stripe ID:</strong> {user.stripe_customer_id.slice(0, 20)}...
                </div>
              )}

              {user.last_active_at && (
                <div className="text-xs text-gray-500">
                  Last active: {new Date(user.last_active_at).toLocaleDateString('en-US')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No users found.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;

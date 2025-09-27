import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { admin } from '@/lib/supabase';
import type { UserWithSubscription } from '@/lib/supabase';
import { Mail, Calendar, CreditCard } from 'lucide-react';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const allUsers = await admin.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Activa' : 'Inactiva';
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Usuarios</h2>
        <p className="text-muted-foreground">
          Gestión de usuarios registrados ({users.length} total)
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {user.name || 'Sin nombre'}
                </CardTitle>
                <Badge className={getStatusColor(user.is_active_subscriber)}>
                  {getStatusText(user.is_active_subscriber)}
                </Badge>
              </div>
              <CardDescription className="flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Registrado: {new Date(user.created_at).toLocaleDateString('es-ES')}
              </div>

              {user.is_active_subscriber && user.subscription_started_at && (
                <div className="flex items-center text-sm text-green-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Suscriptor desde: {new Date(user.subscription_started_at).toLocaleDateString('es-ES')}
                </div>
              )}

              {user.phone && (
                <div className="text-sm text-gray-600">
                  <strong>Teléfono:</strong> {user.phone}
                </div>
              )}

              {user.country && (
                <div className="text-sm text-gray-600">
                  <strong>País:</strong> {user.country}
                </div>
              )}

              {user.stripe_customer_id && (
                <div className="text-xs text-gray-500">
                  <strong>Stripe ID:</strong> {user.stripe_customer_id.slice(0, 20)}...
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay usuarios registrados aún.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;
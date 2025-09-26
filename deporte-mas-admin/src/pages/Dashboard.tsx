import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { admin } from '@/lib/supabase';
import type { AdminStats } from '@/lib/supabase';
import { Users, CreditCard, DollarSign, XCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const adminStats = await admin.getStats();
        setStats(adminStats);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
      title: 'Total Usuarios',
      value: stats?.totalUsers || 0,
      description: 'Usuarios registrados',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Suscripciones Activas',
      value: stats?.activeSubscriptions || 0,
      description: 'Suscripciones actualmente activas',
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      title: 'Ingresos del Mes',
      value: `$${stats?.monthlyRevenue || 0}`,
      description: 'Ingresos del mes actual',
      icon: DollarSign,
      color: 'text-emerald-600',
    },
    {
      title: 'Cancelaciones',
      value: stats?.cancelledSubscriptions || 0,
      description: 'Suscripciones canceladas',
      icon: XCircle,
      color: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen de la actividad de Deporte+ Club
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Additional Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
            <CardDescription>
              Estadísticas clave del negocio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Tasa de Conversión</span>
              <span className="text-sm font-medium">
                {stats?.activeSubscriptions && stats?.totalUsers
                  ? Math.round((stats.activeSubscriptions / stats.totalUsers) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ingresos Promedio por Usuario</span>
              <span className="text-sm font-medium">
                ${stats?.activeSubscriptions
                  ? Math.round((stats.monthlyRevenue || 0) / stats.activeSubscriptions)
                  : 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tasa de Cancelación</span>
              <span className="text-sm font-medium text-red-600">
                {stats?.cancelledSubscriptions && stats?.activeSubscriptions
                  ? Math.round((stats.cancelledSubscriptions / (stats.activeSubscriptions + stats.cancelledSubscriptions)) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestión administrativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Usa el menú lateral para navegar a las diferentes secciones:
            </p>
            <ul className="text-sm space-y-2">
              <li>• <strong>Usuarios:</strong> Gestionar cuentas de usuario</li>
              <li>• <strong>Suscripciones:</strong> Ver y gestionar suscripciones</li>
              <li>• <strong>Pagos:</strong> Historial de transacciones</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
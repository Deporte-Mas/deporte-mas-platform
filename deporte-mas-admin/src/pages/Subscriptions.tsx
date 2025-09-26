import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subscriptions } from '@/lib/supabase';
import type { Subscription } from '@/types';
import { CreditCard, Calendar, User } from 'lucide-react';

const Subscriptions: React.FC = () => {
  const [subscriptionList, setSubscriptionList] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const allSubscriptions = await subscriptions.getAll();
        setSubscriptionList(allSubscriptions);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'unpaid':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'cancelled':
        return 'Cancelada';
      case 'past_due':
        return 'Pago Pendiente';
      case 'unpaid':
        return 'Sin Pagar';
      case 'inactive':
        return 'Inactiva';
      default:
        return status;
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
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Suscripciones</h2>
        <p className="text-muted-foreground">
          Gestión de suscripciones activas y historial ({subscriptionList.length} total)
        </p>
      </div>

      {/* Subscriptions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subscriptionList.map((subscription) => (
          <Card key={subscription.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  {subscription.plan_type === 'annual' ? 'Plan Anual' : 'Plan Mensual'}
                </CardTitle>
                <Badge className={getStatusColor(subscription.status)}>
                  {getStatusText(subscription.status)}
                </Badge>
              </div>
              <CardDescription>
                ID: {subscription.stripe_subscription_id.slice(0, 20)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <User className="w-4 h-4 mr-2" />
                Cliente: {subscription.stripe_customer_id.slice(0, 20)}...
              </div>

              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                Creada: {new Date(subscription.created_at).toLocaleDateString('es-ES')}
              </div>

              {subscription.current_period_start && (
                <div className="text-sm text-gray-600">
                  <strong>Período Actual:</strong><br />
                  {new Date(subscription.current_period_start).toLocaleDateString('es-ES')} - {' '}
                  {new Date(subscription.current_period_end).toLocaleDateString('es-ES')}
                </div>
              )}

              {subscription.cancelled_at && (
                <div className="text-sm text-red-600">
                  <strong>Cancelada:</strong> {new Date(subscription.cancelled_at).toLocaleDateString('es-ES')}
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="text-xs text-gray-500">
                  <strong>Última actualización:</strong><br />
                  {new Date(subscription.updated_at).toLocaleString('es-ES')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {subscriptionList.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay suscripciones registradas aún.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Subscriptions;
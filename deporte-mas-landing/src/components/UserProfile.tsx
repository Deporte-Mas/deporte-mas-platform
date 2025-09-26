import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, CreditCard, Calendar, LogOut } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">
            Debes iniciar sesión para ver tu perfil
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'inactive':
        return 'Inactiva';
      default:
        return 'Desconocido';
    }
  };

  const getPlanText = (planType: string) => {
    return planType === 'annual' ? 'Plan Anual' : 'Plan Mensual';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-xl">
                {user.name || 'Usuario'}
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Información de Suscripción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado:</span>
            <Badge className={getStatusColor(user.subscription_status)}>
              {getStatusText(user.subscription_status)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan:</span>
            <span className="text-sm text-gray-600">
              {getPlanText(user.plan_type)}
            </span>
          </div>

          {user.stripe_customer_id && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">ID de Cliente:</span>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                {user.stripe_customer_id.slice(0, 20)}...
              </code>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Miembro desde:</span>
            <span className="text-sm text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(user.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones de Cuenta</CardTitle>
          <CardDescription>
            Gestiona tu suscripción y configuración de cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {user.subscription_status === 'active' && (
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              Gestionar Suscripción
            </Button>
          )}

          {user.subscription_status === 'inactive' && (
            <Button className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              Activar Suscripción
            </Button>
          )}

          <Button variant="outline" className="w-full justify-start">
            <User className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600 text-center">
            ¿Necesitas ayuda? Contáctanos por{' '}
            <a href="#" className="text-primary hover:underline">
              WhatsApp
            </a>{' '}
            o{' '}
            <a href="mailto:soporte@deporteplus.com" className="text-primary hover:underline">
              email
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
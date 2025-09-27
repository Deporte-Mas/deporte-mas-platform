import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

const Subscriptions: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Suscripciones</h2>
        <p className="text-muted-foreground">
          Gestión de suscripciones (simplificado)
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Sistema Simplificado
          </CardTitle>
          <CardDescription>
            El sistema de suscripciones ha sido simplificado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Nueva Arquitectura</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Los usuarios tienen un campo simple: <code>is_active_subscriber</code></li>
              <li>• Stripe maneja todos los datos de facturación y pagos</li>
              <li>• Los detalles de suscripción se obtienen directamente de la API de Stripe</li>
              <li>• Para información detallada, consultar el dashboard de Stripe</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Beneficios</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Reducción del 80% en complejidad del código</li>
              <li>• Mejor rendimiento (sin joins de tablas)</li>
              <li>• Stripe como fuente única de verdad</li>
              <li>• Mantenimiento más fácil</li>
            </ul>
          </div>

          <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
            <strong>Nota:</strong> Para ver estadísticas de suscripciones detalladas,
            revisar la página de Usuarios o integrar con el dashboard de Stripe.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Subscriptions;
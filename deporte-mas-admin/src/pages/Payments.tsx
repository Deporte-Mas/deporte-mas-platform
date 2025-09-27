import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Payments: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pagos</h2>
        <p className="text-muted-foreground">
          Gestión de pagos (simplificado)
        </p>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Datos de Pagos en Stripe
          </CardTitle>
          <CardDescription>
            Todos los datos de pagos se manejan directamente en Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Nueva Arquitectura</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• No almacenamos datos de pagos localmente</li>
              <li>• Stripe es la fuente única de verdad para pagos</li>
              <li>• Solo rastreamos el estado de suscripción: activo/inactivo</li>
              <li>• Los webhooks de Stripe actualizan el estado del usuario</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Beneficios</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Cumplimiento PCI simplificado</li>
              <li>• Datos financieros seguros en Stripe</li>
              <li>• Menos código de mantenimiento</li>
              <li>• Reportes financieros directos de Stripe</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Acceso a Datos de Pagos</h3>
            <p className="text-sm text-gray-700 mb-3">
              Para ver información detallada de pagos, facturas y transacciones:
            </p>
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Dashboard de Stripe
            </Button>
          </div>

          <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-lg">
            <strong>Integración futura:</strong> Se puede agregar una integración con la API de Stripe
            para mostrar datos de pagos directamente en esta interfaz si es necesario.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
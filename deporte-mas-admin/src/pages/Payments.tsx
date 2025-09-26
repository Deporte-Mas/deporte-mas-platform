import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { payments } from '@/lib/supabase';
import type { Payment } from '@/types';
import { DollarSign, Calendar, CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';

const Payments: React.FC = () => {
  const [paymentList, setPaymentList] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const allPayments = await payments.getAll();
        setPaymentList(allPayments);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return CheckCircle;
      case 'failed':
        return XCircle;
      case 'pending':
        return Clock;
      default:
        return DollarSign;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Exitoso';
      case 'failed':
        return 'Fallido';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert cents to dollars
  };

  const totalRevenue = paymentList
    .filter(payment => payment.status === 'succeeded')
    .reduce((total, payment) => total + payment.amount, 0);

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
        <h2 className="text-3xl font-bold tracking-tight">Pagos</h2>
        <p className="text-muted-foreground">
          Historial de transacciones y pagos ({paymentList.length} total)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(totalRevenue, 'USD')}
            </div>
            <p className="text-xs text-muted-foreground">
              De pagos exitosos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Exitosos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentList.filter(p => p.status === 'succeeded').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Transacciones completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {paymentList.filter(p => p.status === 'failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Transacciones fallidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentList.map((payment) => {
          const StatusIcon = getStatusIcon(payment.status);
          return (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {formatAmount(payment.amount, payment.currency)}
                  </CardTitle>
                  <Badge className={getStatusColor(payment.status)}>
                    {getStatusText(payment.status)}
                  </Badge>
                </div>
                <CardDescription>
                  Invoice: {payment.stripe_invoice_id.slice(0, 20)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Suscripción: {payment.stripe_subscription_id.slice(0, 15)}...
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(payment.created_at).toLocaleString('es-ES')}
                </div>

                <div className="text-sm text-gray-600">
                  <strong>Cliente:</strong><br />
                  {payment.stripe_customer_id.slice(0, 20)}...
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">
                    {payment.currency.toUpperCase()} • {payment.status}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {paymentList.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay pagos registrados aún.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Payments;
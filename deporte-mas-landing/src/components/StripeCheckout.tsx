import React, { useState, useEffect } from 'react';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from '@stripe/react-stripe-js';
import { useStripe } from '@stripe/react-stripe-js';
import { useCheckoutSession } from '@/hooks/useCheckoutSession';
import { Button } from '@/components/ui/button';
import { X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  planType: 'monthly' | 'annual';
}

export const StripeCheckout: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  planType
}) => {
  const stripe = useStripe();
  const { createCheckoutSession, isLoading, error, clearError } = useCheckoutSession();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const initializeCheckout = async () => {
    clearError();
    const session = await createCheckoutSession(planType);
    if (session?.clientSecret) {
      setClientSecret(session.clientSecret);
    }
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && !clientSecret && !isLoading) {
      initializeCheckout();
    }
  }, [isOpen, clientSecret, isLoading]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      clearError();
    }
  }, [isOpen, clearError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md max-h-[90vh] bg-white rounded-lg shadow-xl flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Suscripción Deporte+ Club
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 overflow-y-auto flex-1">
          {isLoading && (
            <LoadingState planType={planType} />
          )}

          {error && (
            <ErrorState
              error={error}
              onRetry={initializeCheckout}
              onClose={onClose}
            />
          )}

          {!isLoading && !error && clientSecret && stripe && (
            <EmbeddedCheckoutProvider
              stripe={stripe}
              options={{
                clientSecret,
                onComplete: () => {
                  onSuccess?.();
                  onClose();
                }
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </div>
    </div>
  );
};

const LoadingState: React.FC<{ planType: 'monthly' | 'annual' }> = ({ planType }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
    <h4 className="text-lg font-semibold text-gray-900 mb-2">
      Preparando tu suscripción
    </h4>
    <p className="text-sm text-gray-600 text-center">
      {planType === 'annual'
        ? 'Plan Anual - $180/año (ahorra $60)'
        : 'Plan Mensual - $20/mes'
      }
    </p>
    <p className="text-xs text-gray-500 mt-2">
      Esto solo tomará unos segundos...
    </p>
  </div>
);

const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  onClose: () => void;
}> = ({ error, onRetry, onClose }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4">
    <AlertCircle className="w-8 h-8 text-red-500 mb-4" />
    <h4 className="text-lg font-semibold text-gray-900 mb-2">
      Error al cargar el checkout
    </h4>
    <p className="text-sm text-gray-600 text-center mb-6">
      {error}
    </p>
    <div className="flex gap-3 w-full">
      <Button
        variant="outline"
        onClick={onClose}
        className="flex-1"
      >
        Cancelar
      </Button>
      <Button
        onClick={onRetry}
        className="flex-1"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Reintentar
      </Button>
    </div>
  </div>
);
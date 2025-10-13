/**
 * User-facing messages in Spanish for the subscription feature
 */

export const SUBSCRIPTION_MESSAGES = {
  // Compliance warning dialog
  WARNING_TITLE: 'Suscripción Externa',
  WARNING_MESSAGE:
    'Estás a punto de ser redirigido a un sitio web externo para completar tu suscripción.\n\n' +
    'Las compras realizadas fuera de la tienda de aplicaciones no están cubiertas por las ' +
    'políticas de protección de Apple/Google.\n\n' +
    '¿Deseas continuar?',
  WARNING_CANCEL: 'Cancelar',
  WARNING_CONTINUE: 'Continuar',

  // Error messages
  ERROR_BROWSER_FAILED: 'No se pudo abrir el navegador. Por favor, intenta nuevamente.',
  ERROR_INVALID_URL: 'Error de configuración. Por favor, contacta soporte.',
  ERROR_PERMISSION_DENIED:
    'Permiso denegado. Verifica la configuración de tu dispositivo.',
  ERROR_UNKNOWN: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',

  // Button labels
  BUTTON_SUBSCRIBE: 'Suscribirse',
  BUTTON_UPGRADE: 'Mejorar Plan',
  BUTTON_RETRY: 'Reintentar',
};

export type SubscriptionMessageKey = keyof typeof SUBSCRIPTION_MESSAGES;

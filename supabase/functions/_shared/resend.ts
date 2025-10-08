/**
 * Resend Email Service
 * Handles sending emails via Resend API
 */

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Deporte+ Club <equipo@deportemas.com>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ResendResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

export async function sendEmail(params: SendEmailParams): Promise<ResendResponse | null> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    throw new Error('Email service not configured');
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text || params.subject,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      throw new Error(`Resend API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log('Email sent successfully:', data.id);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export function generateWelcomeEmail(
  email: string,
  name: string | null,
  magicLink: string
): { subject: string; html: string; text: string } {
  const firstName = name?.split(' ')[0] || 'amigo';

  const subject = '¡Bienvenido a Deporte+ Club! 🎉';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #FFD700; font-size: 32px; margin: 0; font-weight: 800;">DEPORTE+ CLUB</h1>
    </div>

    <!-- Main Content -->
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 16px; padding: 40px; border: 1px solid #FFD700;">
      <!-- Success Icon -->
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: #FFD700; width: 80px; height: 80px; border-radius: 50%; line-height: 80px; font-size: 40px;">
          ✅
        </div>
      </div>

      <h2 style="color: #FFD700; text-align: center; font-size: 28px; margin: 0 0 20px 0; font-weight: 800;">
        ¡BIENVENIDO${firstName !== 'amigo' ? ', ' + firstName.toUpperCase() : ''}!
      </h2>

      <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Tu pago se ha procesado exitosamente. Ahora eres parte del club exclusivo del programa deportivo #1 de Costa Rica.
      </p>

      <!-- Magic Link Button -->
      <div style="text-align: center; margin: 40px 0;">
        <a href="${magicLink}" style="display: inline-block; background: #FFD700; color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 18px; text-transform: uppercase;">
          ACCEDER AHORA
        </a>
      </div>

      <p style="color: #999999; font-size: 14px; line-height: 1.5; text-align: center; margin-top: 30px;">
        Este enlace es válido por 24 horas
      </p>
    </div>

    <!-- Instructions -->
    <div style="margin-top: 40px; padding: 30px; background: #1a1a1a; border-radius: 12px; border: 1px solid #333;">
      <h3 style="color: #FFD700; font-size: 20px; margin: 0 0 20px 0; font-weight: 800;">PRÓXIMOS PASOS</h3>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; align-items: start; margin-bottom: 15px;">
          <div style="background: #FFD700; color: #000; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">1</div>
          <div>
            <strong style="color: #ffffff; display: block; margin-bottom: 5px;">Descarga la app móvil</strong>
            <span style="color: #999999; font-size: 14px;">Disponible próximamente en App Store y Google Play</span>
          </div>
        </div>

        <div style="display: flex; align-items: start; margin-bottom: 15px;">
          <div style="background: #FFD700; color: #000; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">2</div>
          <div>
            <strong style="color: #ffffff; display: block; margin-bottom: 5px;">Haz clic en "Acceder Ahora"</strong>
            <span style="color: #999999; font-size: 14px;">Serás redirigido a la app automáticamente</span>
          </div>
        </div>

        <div style="display: flex; align-items: start;">
          <div style="background: #FFD700; color: #000; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0;">3</div>
          <div>
            <strong style="color: #ffffff; display: block; margin-bottom: 5px;">¡Disfruta del contenido exclusivo!</strong>
            <span style="color: #999999; font-size: 14px;">Accede a videos, descuentos y experiencias únicas</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Info -->
    <div style="margin-top: 30px; padding: 20px; background: #2d2d2d; border-radius: 8px; border-left: 4px solid #FFD700;">
      <p style="color: #cccccc; margin: 0; font-size: 14px;">
        <strong>Tu email de acceso:</strong> ${email}
      </p>
      <p style="color: #999999; margin: 10px 0 0 0; font-size: 13px;">
        Usa este email para iniciar sesión en la app móvil
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; color: #666666; font-size: 12px;">
      <p style="margin: 0 0 10px 0;">
        ¿Tienes problemas? Escríbenos por WhatsApp
      </p>
      <p style="margin: 0;">
        © 2025 Deporte+ Club. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
¡BIENVENIDO A DEPORTE+ CLUB!

Hola${firstName !== 'amigo' ? ' ' + firstName : ''},

Tu pago se ha procesado exitosamente. Ahora eres parte del club exclusivo del programa deportivo #1 de Costa Rica.

ACCEDE AHORA:
${magicLink}

(Este enlace es válido por 24 horas)

PRÓXIMOS PASOS:

1. Descarga la app móvil
   Disponible próximamente en App Store y Google Play

2. Haz clic en el enlace de acceso
   Serás redirigido a la app automáticamente

3. ¡Disfruta del contenido exclusivo!
   Accede a videos, descuentos y experiencias únicas

TU EMAIL DE ACCESO: ${email}
Usa este email para iniciar sesión en la app móvil

¿Tienes problemas? Escríbenos por WhatsApp

© 2025 Deporte+ Club. Todos los derechos reservados.
  `.trim();

  return { subject, html, text };
}

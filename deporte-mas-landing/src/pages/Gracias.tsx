import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const Gracias = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Email is sent via webhook, customer will receive it
    // We don't need to fetch session details on frontend
    if (sessionId) {
      console.log('Payment successful, session:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow animate-pulse-glow">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline mb-8 text-primary-foreground">
          ¡BIENVENIDO A 
          <span className="block text-accent">DEPORTE+ CLUB!</span>
        </h1>

        <p className="text-xl text-muted-foreground mb-12 font-body leading-relaxed">
          Tu pago se ha procesado exitosamente. Ahora eres parte del club exclusivo 
          del programa deportivo #1 de Costa Rica.
        </p>

        {/* Email Check Section */}
        <div className="bg-gradient-card p-8 rounded-2xl shadow-card border border-primary/20 mb-12">
          <div className="text-center mb-6">
            <div className="inline-block bg-accent/20 p-4 rounded-full mb-4">
              <span className="text-4xl">📧</span>
            </div>
          </div>
          <h2 className="text-2xl font-headline text-accent mb-4 text-center">REVISA TU EMAIL</h2>
          <div className="bg-background/50 p-6 rounded-xl mb-6">
            <p className="text-center text-muted-foreground font-body mb-2">
              Hemos enviado un enlace de acceso a tu email de pago
            </p>
            <p className="text-muted-foreground font-body text-sm text-center mt-4">
              Haz clic en el enlace para acceder a la app móvil
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-card p-8 rounded-2xl shadow-card border border-primary/20 mb-12">
          <h2 className="text-2xl font-headline text-primary mb-6">PRÓXIMOS PASOS</h2>
          
          <div className="space-y-6 text-left">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-body font-bold text-foreground mb-1">
                  Revisa tu email
                </h3>
                <p className="text-muted-foreground font-body text-sm">
                  Te hemos enviado un enlace de acceso mágico
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-body font-bold text-foreground mb-1">
                  Descarga la app móvil
                </h3>
                <p className="text-muted-foreground font-body text-sm">
                  Disponible próximamente en App Store y Google Play
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-body font-bold text-foreground mb-1">
                  Haz clic en el enlace del email
                </h3>
                <p className="text-muted-foreground font-body text-sm">
                  Serás redirigido automáticamente a la app
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                4
              </div>
              <div>
                <h3 className="font-body font-bold text-foreground mb-1">
                  ¡Disfruta del contenido exclusivo!
                </h3>
                <p className="text-muted-foreground font-body text-sm">
                  Accede a videos, descuentos y experiencias únicas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
          <Button
            variant="outline"
            size="xl"
            onClick={() => window.location.href = "/"}
            className="w-full sm:w-auto"
          >
            VOLVER AL INICIO
          </Button>
        </div>

        {/* Support */}
        <div className="text-center">
          <p className="text-muted-foreground font-body mb-4">
            ¿No recibiste el email? Revisa tu carpeta de spam o escríbenos
          </p>
          <a
            href="https://wa.me/50688888888?text=Hola,%20soy%20nuevo%20miembro%20de%20Deporte+%20Club.%20No%20recibí%20el%20email%20de%20acceso."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-body font-bold transition-smooth"
          >
            <span>💬</span>
            Soporte WhatsApp
          </a>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-12 text-center">
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
            <p className="text-sm text-muted-foreground font-body">
              📧 También hemos enviado estas instrucciones a tu email de confirmación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gracias;
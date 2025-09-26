import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const Gracias = () => {
  const [joinCode, setJoinCode] = useState<string>("");

  useEffect(() => {
    // Generate a random join code for demo purposes
    // In production, this would come from URL params or API
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setJoinCode(`DC${code}`);
  }, []);

  const handleJoinGroup = () => {
    window.open("https://www.facebook.com/groups/deporteplusclub", "_blank");
  };

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

        {/* Join Code Section */}
        <div className="bg-gradient-card p-8 rounded-2xl shadow-card border border-primary/20 mb-12">
          <h2 className="text-2xl font-headline text-accent mb-4">TU CÓDIGO DE ACCESO</h2>
          <div className="bg-background/50 p-6 rounded-xl mb-6">
            <span className="text-3xl font-headline text-primary tracking-wider">
              {joinCode}
            </span>
          </div>
          <p className="text-muted-foreground font-body text-sm">
            Usa este código para unirte al grupo privado de Facebook
          </p>
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
                  Únete al grupo privado de Facebook
                </h3>
                <p className="text-muted-foreground font-body text-sm">
                  Haz clic en el botón de abajo para acceder al grupo exclusivo
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-body font-bold text-foreground mb-1">
                  Responde las preguntas de membresía
                </h3>
                <p className="text-muted-foreground font-body text-sm">
                  Incluye tu código de acceso: <strong className="text-primary">{joinCode}</strong>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
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
            variant="hero" 
            size="xl"
            onClick={handleJoinGroup}
            className="w-full sm:w-auto"
          >
            UNIRSE AL GRUPO
          </Button>
          
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
            ¿Tienes problemas para acceder? Escríbenos por WhatsApp
          </p>
          <a 
            href={`https://wa.me/50688888888?text=Hola,%20soy%20nuevo%20miembro%20de%20Deporte+%20Club.%20Mi%20código%20es:%20${joinCode}`}
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
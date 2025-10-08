import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StripeCheckout } from "@/components/StripeCheckout";
import { trackLead } from "@/lib/facebook-tracking";

const PricingSection = () => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');

  const handleCheckout = (planType: 'monthly' | 'annual') => {
    // Track lead conversion
    trackLead(
      { source: 'pricing_cta_click' },
      {
        plan_type: planType,
        value: planType === 'annual' ? 180 : 20,
        currency: 'USD'
      }
    );

    setSelectedPlan(planType);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    // Optional: Additional success tracking or redirect
    console.log('Payment completed successfully');
    // Could redirect to dashboard or show success message
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary))_0%,_transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-headline mb-4 sm:mb-6 text-primary-foreground leading-tight">
            ELIGE TU PLAN
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto font-body px-4">
            Acceso completo a todo el contenido exclusivo de Deporte+ Club
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 max-w-4xl mx-auto lg:grid-cols-2">
          {/* Monthly Plan */}
          <div className="bg-gradient-card p-6 sm:p-8 rounded-2xl shadow-card border-2 border-primary/30 relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-headline text-accent mb-4">PLAN MENSUAL</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl sm:text-5xl font-headline text-primary-foreground">$20</span>
                  <span className="text-lg sm:text-xl text-muted-foreground font-body">/mes</span>
                </div>
                <p className="text-sm text-muted-foreground font-body">≈ ₡12,000 CRC</p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {[
                  "Acceso completo al contenido",
                  "Videos exclusivos del programa", 
                  "Descuentos en tiendas deportivas",
                  "Soporte por WhatsApp",
                  "Cancela cuando quieras"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground font-body text-sm sm:text-base">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="pricing"
                size="lg"
                className="w-full min-h-[48px] text-base sm:text-lg font-bold"
                onClick={() => handleCheckout('monthly')}
              >
                COMENZAR AHORA
              </Button>
            </div>
          </div>

          {/* Annual Plan */}
          <div className="bg-gradient-card p-6 sm:p-8 rounded-2xl shadow-intense border-2 border-accent relative overflow-hidden">
            {/* Best Value Badge */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-20">
              <Badge className="bg-accent text-accent-foreground font-headline text-xs px-2 sm:px-3 py-1">
                MEJOR VALOR
              </Badge>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-headline text-accent mb-4">PLAN ANUAL</h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl sm:text-5xl font-headline text-primary-foreground">$180</span>
                  <span className="text-lg sm:text-xl text-muted-foreground font-body">/año</span>
                </div>
                <p className="text-sm text-accent font-body font-semibold">
                  Ahorra $60 • Solo $15/mes
                </p>
                <p className="text-sm text-muted-foreground font-body">≈ ₡108,000 CRC</p>
              </div>

              <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {[
                  "Todo del plan mensual",
                  "2 meses gratis (ahorra $60)",
                  "Acceso prioritario a eventos",
                  "Contenido exclusivo anual",
                  "Descuentos premium adicionales"
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground font-body text-sm sm:text-base">
                    <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant="hero"
                size="lg"
                className="w-full min-h-[48px] text-base sm:text-lg font-bold"
                onClick={() => handleCheckout('annual')}
              >
                AHORRAR $60 AHORA
              </Button>
            </div>
          </div>
        </div>

        {/* Founders Promotion Banner */}
        <div className="mt-12 sm:mt-16 text-center">
          <div className="bg-accent/20 border-2 border-accent rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto">
            <Badge className="bg-accent text-accent-foreground font-headline mb-4">
              🚀 PROMOCIÓN FUNDADORES
            </Badge>
            <h3 className="text-lg sm:text-xl font-headline text-accent mb-2">
              PRIMEROS 30 DÍAS ÚNICAMENTE
            </h3>
            <p className="text-foreground font-body mb-4 text-sm sm:text-base">
              <span className="font-bold">Mensual: $15/mes</span> • <span className="font-bold">Anual: $149/año</span>
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground font-body">
              Precio especial para los primeros miembros del club
            </p>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground font-body">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>Pago seguro con Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Cancela cuando quieras</span>
            </div>
            <div className="flex items-center gap-2">
              <span>💬</span>
              <span>Soporte 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Modal */}
      <StripeCheckout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
        planType={selectedPlan}
      />
    </section>
  );
};

export default PricingSection;
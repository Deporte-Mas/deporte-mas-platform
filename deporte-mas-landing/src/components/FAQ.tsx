import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "¿Qué incluye mi membresía a Deporte+ Club?",
      answer: "Tu membresía incluye acceso completo al contenido exclusivo del programa, videos extendidos, análisis deportivo profundo, descuentos en tiendas deportivas, acceso VIP al estudio, y experiencias únicas como encuentros con los presentadores y boletos para eventos deportivos."
    },
    {
      question: "¿Puedo cancelar mi suscripción en cualquier momento?",
      answer: "Sí, puedes cancelar tu suscripción en cualquier momento sin penalidades. Tu acceso continuará hasta el final del período que ya pagaste. No hay contratos de permanencia ni costos ocultos."
    },
    {
      question: "¿Cómo funciona la promoción de fundadores?",
      answer: "Durante los primeros 30 días de lanzamiento, ofrecemos precios especiales: $15/mes para el plan mensual y $149/año para el plan anual. Esta promoción es exclusiva para los primeros miembros del club y el precio se mantendrá mientras conserves tu suscripción activa."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express) a través de nuestra plataforma segura de pagos Stripe. Los pagos se procesan de forma automática y segura."
    },
    {
      question: "¿Cómo accedo al contenido exclusivo?",
      answer: "Una vez completado tu pago, recibirás un código de acceso y las instrucciones para unirte al grupo privado de Facebook donde se comparte todo el contenido exclusivo, descuentos y se coordinan las experiencias VIP."
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-headline mb-4 sm:mb-6 text-primary leading-tight">
            PREGUNTAS FRECUENTES
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto font-body px-4">
            Resolvemos las dudas más comunes sobre Deporte+ Club
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-gradient-card border border-primary/20 rounded-xl px-4 sm:px-6 shadow-card"
              >
                <AccordionTrigger className="text-left font-body font-bold text-foreground hover:text-primary text-base sm:text-lg py-4 sm:py-6 leading-tight">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body leading-relaxed text-sm sm:text-base pb-4 sm:pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Still have questions CTA */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="bg-gradient-card p-6 sm:p-8 rounded-2xl shadow-card border border-primary/20 max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-headline text-accent mb-4">
              ¿TIENES MÁS PREGUNTAS?
            </h3>
            <p className="text-muted-foreground font-body mb-6 text-sm sm:text-base">
              Nuestro equipo está listo para ayudarte por WhatsApp
            </p>
            <a 
              href="https://wa.me/50688888888?text=Hola,%20tengo%20preguntas%20sobre%20Deporte+%20Club"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-body font-bold transition-smooth text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
            >
              <span>💬</span>
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
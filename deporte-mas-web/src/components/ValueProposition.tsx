const ValueProposition = () => {
  const values = [
    {
      title: "ACCESO",
      description: "Contenido exclusivo del programa",
      icon: "🔓",
      features: [
        "Videos extendidos del programa",
        "Análisis deportivo profundo",
        "Entrevistas completas",
        "Contenido detrás de cámaras"
      ]
    },
    {
      title: "AHORROS", 
      description: "Descuentos en productos deportivos",
      icon: "💰",
      features: [
        "Descuentos en tiendas deportivas",
        "Ofertas exclusivas de marcas",
        "Precios especiales en eventos",
        "Promociones de socios comerciales"
      ]
    },
    {
      title: "EXPERIENCIAS",
      description: "Eventos únicos y exclusivos", 
      icon: "⚽",
      features: [
        "Acceso VIP al estudio",
        "Encuentros con los presentadores",
        "Boletos para eventos deportivos",
        "Experiencias deportivas únicas"
      ]
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-headline mb-4 sm:mb-6 text-primary leading-tight">
            ACCESO • AHORROS • EXPERIENCIAS
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto font-body px-4">
            Deporte+ Club no es solo ver televisión. Es vivir el deporte de forma completa 
            con acceso exclusivo, beneficios únicos y experiencias inolvidables.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:gap-12 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <div 
              key={value.title}
              className="bg-gradient-card p-6 sm:p-8 rounded-2xl shadow-card border border-primary/20 hover:shadow-intense transition-smooth transform hover:scale-105"
            >
              <div className="text-center mb-6">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">{value.icon}</div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-headline text-accent mb-3 leading-tight">
                  {value.title}
                </h3>
                <p className="text-base sm:text-lg text-muted-foreground font-body font-semibold">
                  {value.description}
                </p>
              </div>
              
              <ul className="space-y-3">
                {value.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-foreground font-body">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 font-body px-4">
            Todo esto por menos de lo que cuesta un almuerzo al día
          </p>
          <div className="flex justify-center">
            <div className="bg-accent/10 border-2 border-accent rounded-2xl px-6 sm:px-8 py-4">
              <span className="text-2xl sm:text-3xl font-headline text-accent">$20/MES</span>
              <span className="text-sm sm:text-lg text-muted-foreground ml-2 sm:ml-4 font-body block sm:inline">≈ ₡12,000</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
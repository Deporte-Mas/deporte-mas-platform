import { CircularTestimonials } from "@/components/ui/circular-testimonials";

const Panelists = () => {
  const panelists = [
    {
      quote: "El fútbol costarricense está en constante evolución. Cada domingo analizamos las jugadas más importantes y compartimos las historias que realmente importan para nuestra afición.",
      name: "Carlos Hernández",
      designation: "Analista Principal de Fútbol",
      src: "/lovable-uploads/ba62bac6-7973-4695-85e0-ee7039862fec.png",
    },
    {
      quote: "Mi pasión por el deporte me ha llevado por todo el país cubriendo las mejores historias. En Deporte+ Club compartimos esa misma pasión con nuestros miembros cada semana.",
      name: "Roberto Morales",
      designation: "Comentarista Deportivo Senior",
      src: "/lovable-uploads/1e6893cd-c63f-45b0-9650-58f2434258da.png",
    },
    {
      quote: "Como periodista deportiva, creo firmemente en contar las historias que inspiran. El deporte costarricense tiene muchísimas historias por descubrir y nosotros las compartimos.",
      name: "María Elena Vargas",
      designation: "Periodista Deportiva",
      src: "/lovable-uploads/23e1338d-0884-465e-89c9-187ec7ef5c7b.png",
    },
    {
      quote: "El análisis deportivo va más allá de los resultados. En cada programa profundizamos en las estrategias, las emociones y las historias humanas detrás del deporte.",
      name: "Diego Ramírez",
      designation: "Analista Táctico",
      src: "/lovable-uploads/fe5ff95f-87a8-4c66-9af5-4c46e8a94bc7.png",
    },
    {
      quote: "Tener 15 años en el periodismo deportivo me ha enseñado que cada partido, cada atleta, cada momento tiene una historia única que merece ser contada con respeto y profesionalismo.",
      name: "Fernando Solís",
      designation: "Director del Programa",
      src: "/lovable-uploads/3919bb04-ae66-431e-a3d7-dec3d58194f6.png",
    },
    {
      quote: "La cobertura deportiva moderna requiere estar conectado 24/7. Por eso creamos Deporte+ Club, para que nuestra audiencia tenga acceso exclusivo a todo nuestro contenido.",
      name: "Manuel Jiménez",
      designation: "Productor Ejecutivo",
      src: "/lovable-uploads/e8ab1073-fbdc-4b49-8241-f933c5a784b9.png",
    },
    {
      quote: "El deporte une a las familias costarricenses. Mi trabajo como presentador es asegurarme de que cada domingo sea una experiencia memorable para toda la familia.",
      name: "Alejandro Castro",
      designation: "Presentador Principal",
      src: "/lovable-uploads/2a3267f6-932b-43e3-9ecd-8630d7e238a9.png",
    },
    {
      quote: "Como co-conductor, mi objetivo es hacer que el análisis deportivo sea accesible para todos. Desde el fanático más apasionado hasta quien apenas está empezando a seguir el fútbol.",
      name: "Esteban Cordero",
      designation: "Co-Conductor",
      src: "/lovable-uploads/9908a5d3-ae53-4b19-beeb-23b264559ddb.png",
    },
    {
      quote: "El periodismo deportivo en Costa Rica está en su mejor momento. Con Deporte+ Club llevamos esa excelencia a un nivel completamente nuevo, creando contenido exclusivo de calidad.",
      name: "Andrés Villalobos",
      designation: "Reportero de Campo",
      src: "/lovable-uploads/1a7efeb8-4bbf-4ef7-af65-c75a6f16f044.png",
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/3 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-accent rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-headline mb-4 sm:mb-6 text-primary leading-tight">
            NUESTROS PANELISTAS
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto font-body px-4">
            Conoce al equipo de expertos que cada domingo te brinda el mejor análisis deportivo de Costa Rica. 
            Profesionales con años de experiencia y pasión por el deporte nacional.
          </p>
        </div>

        {/* Testimonials Component */}
        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <CircularTestimonials
              testimonials={panelists}
              autoplay={true}
              colors={{
                name: "hsl(var(--primary-foreground))",
                designation: "hsl(var(--accent))",
                testimony: "hsl(var(--foreground))",
                arrowBackground: "hsl(var(--primary))",
                arrowForeground: "hsl(var(--primary-foreground))",
                arrowHoverBackground: "hsl(var(--accent))",
              }}
              fontSizes={{
                name: "clamp(1.5rem, 4vw, 2rem)",
                designation: "clamp(0.875rem, 2.5vw, 1.125rem)",
                quote: "clamp(1rem, 3vw, 1.25rem)",
              }}
            />
          </div>
        </div>

        {/* Stats or additional info */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-6 sm:gap-8 lg:gap-12 text-foreground/80 text-sm sm:text-base">
            <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-full border border-primary/20">
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-accent rounded-full animate-pulse"></div>
              <span className="font-semibold">9 Expertos en Deportes</span>
            </div>
            <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-full border border-primary/20">
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-primary rounded-full animate-pulse"></div>
              <span className="font-semibold">Más de 150 años de experiencia</span>
            </div>
            <div className="flex items-center gap-2 bg-background/10 backdrop-blur-sm px-4 sm:px-6 py-3 rounded-full border border-primary/20">
              <div className="w-2 sm:w-3 h-2 sm:h-3 bg-accent rounded-full animate-pulse"></div>
              <span className="font-semibold">Contenido exclusivo semanal</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Panelists;
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-headline mb-6 text-primary">404</h1>
        <h2 className="text-3xl md:text-4xl font-headline mb-6 text-accent">
          PÁGINA NO ENCONTRADA
        </h2>
        <p className="text-xl text-muted-foreground mb-8 font-body">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => window.location.href = "/"}
          >
            VOLVER AL INICIO
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = "/#pricing"}
          >
            VER PRECIOS
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

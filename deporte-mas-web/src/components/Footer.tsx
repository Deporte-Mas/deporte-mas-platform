const Footer = () => {
  return (
    <footer className="bg-card py-8 sm:py-12 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:gap-8 text-center sm:text-left sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img
              src="/assets/Full-Logo-White.png"
              alt="Deporte+ Club"
              className="h-12 sm:h-14 mb-4 mx-auto sm:mx-0"
            />
            <p className="text-muted-foreground font-body text-sm leading-relaxed max-w-md mx-auto sm:mx-0">
              El club exclusivo del programa deportivo #1 de Costa Rica.
              Domingos en Teletica, toda la semana en Deporte+ Club.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-headline text-white mb-4 text-base sm:text-lg">ENLACES</h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth inline-block py-1">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth inline-block py-1">
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth inline-block py-1">
                  Política de Reembolsos
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth inline-block py-1">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-headline text-white mb-4 text-base sm:text-lg">SÍGUENOS</h4>
            <div className="space-y-3 font-body text-sm">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span>📺</span>
                <span className="text-muted-foreground">Domingos 6:00 PM - Canal 7</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span>💬</span>
                <a
                  href="https://wa.me/50688888888"
                  className="text-muted-foreground hover:text-accent transition-smooth"
                >
                  WhatsApp Soporte
                </a>
              </div>
              <div className="flex justify-center sm:justify-start gap-4 pt-2">
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth py-1">
                  Facebook
                </a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth py-1">
                  Instagram
                </a>
                <a href="#" className="text-muted-foreground hover:text-accent transition-smooth py-1">
                  YouTube
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
          <p className="text-muted-foreground font-body text-xs sm:text-sm">
            © 2024 Deporte+ Club. Todos los derechos reservados. 
            <span className="mx-2 hidden sm:inline">•</span>
            <br className="sm:hidden" />
            Una producción de Teletica Formato 7
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
import { HeroSection } from "@/components/ui/hero-section";
import { Icons } from "@/components/ui/icons";
import heroMockup from "@/assets/hero-mockup.jpg";

const Hero = () => {
  return (
    <HeroSection
      badge={{
        text: "Únete al club más exclusivo",
        action: {
          text: "Conoce más",
          href: "#beneficios",
        },
      }}
      title="DOMINGOS EN TELETICA. TODA LA SEMANA EN DEPORTE+ CLUB."
      description="Únete al club deportivo más exclusivo de Costa Rica y disfruta de beneficios únicos, experiencias VIP y acceso privilegiado al mundo del deporte."
      actions={[
        {
          text: "ÚNETE AHORA",
          href: "#pricing",
          variant: "default",
        },
        {
          text: "VER BENEFICIOS",
          href: "#beneficios",
          variant: "outline",
        },
      ]}
      image={{
        light: heroMockup,
        dark: heroMockup,
        alt: "Deporte+ Club Platform Preview",
      }}
    />
  );
};

export default Hero;
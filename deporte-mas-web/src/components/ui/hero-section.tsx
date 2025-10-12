"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { cn } from "@/lib/utils";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "premium";
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  const imageSrc = image.light; // Use light image for now

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-8 sm:py-12 px-4 min-h-screen flex items-center",
        "fade-bottom overflow-hidden"
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-8 sm:gap-12 w-full">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">
          {/* Logo */}
          <img
            src="/assets/Full-Logo-White.png"
            alt="Deporte+ Club"
            className="h-14 sm:h-16 md:h-20 animate-appear"
          />

          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="animate-appear gap-2 delay-100">
              <span className="text-muted-foreground">{badge.text}</span>
              <a href={badge.action.href} className="flex items-center gap-1">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3" />
              </a>
            </Badge>
          )}

          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-transparent drop-shadow-2xl delay-300 px-4 max-w-5xl">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg relative z-10 max-w-[550px] animate-appear font-medium text-muted-foreground opacity-0 delay-500">
            {description}
          </p>

          {/* Actions */}
          <div className="relative z-10 flex flex-wrap animate-appear justify-center gap-3 sm:gap-4 opacity-0 delay-700">
            {actions.map((action, index) => (
              <Button key={index} variant={action.variant} size="lg" asChild>
                <a href={action.href} className="flex items-center gap-2 scroll-smooth">
                  {action.icon}
                  {action.text}
                </a>
              </Button>
            ))}
          </div>

          {/* Image with Glow */}
          <div className="relative pt-8 sm:pt-12">
            <MockupFrame
              className="animate-appear opacity-0 delay-1000"
              size="small"
            >
              <Mockup type="responsive">
                <img
                  src={imageSrc}
                  alt={image.alt}
                  width="1248"
                  height="765"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

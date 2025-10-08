import Hero from "@/components/Hero";
import PricingSection from "@/components/PricingSection";
import Panelists from "@/components/Panelists";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <PricingSection />
      <Panelists />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;

import { BenefitsSection } from "@/components/marketing/BenefitsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { HeroCarousel } from "@/components/marketing/HeroCarousel";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { ProductHero } from "@/components/marketing/ProductHero";

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <MarketingNav />
      <HeroCarousel />
      <ProductHero />
      <BenefitsSection />
      <FeaturesGrid />
      <FaqSection />
      <MarketingFooter />
    </div>
  );
}

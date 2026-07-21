import { HeroSection } from "@/components/sections/HeroSection";
import { MenuGridSection } from "@/components/sections/MenuGridSection";
import { RedefiningSection } from "@/components/sections/RedefiningSection";
import { ArtSection } from "@/components/sections/ArtSection";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  return (
    <div className="overflow-x-hidden">
      <main>
        <HeroSection />
        <MenuGridSection />
        <RedefiningSection />
        <ArtSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

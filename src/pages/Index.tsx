import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PopularUniversities from "@/components/PopularUniversities";
import CTASection from "@/components/CTASection";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PopularUniversities />
        <WaitlistSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

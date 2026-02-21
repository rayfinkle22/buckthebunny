import { Header } from "@/components/Header";
import { ScrollToTop } from "@/components/ScrollToTop";
import { HeroSection } from "@/components/HeroSection";
import { DexChart } from "@/components/DexChart";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <Header />
      <main className="flex-1 relative z-10 pt-16 sm:pt-18">
        <HeroSection />
        <DexChart />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default Index;

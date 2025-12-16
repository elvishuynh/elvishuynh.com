import Dashboard from "@/components/Dashboard";
import ScrollManager from "@/components/ScrollManager";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between relative">
      <ScrollManager />

      {/* Hero Section - Transparent to show LiquidGlassCursor */}
      <section id="hero" className="h-screen w-full flex flex-col justify-start pt-20 relative z-10 pointer-events-none">
        <div className="w-full px-8 flex flex-col gap-2 pointer-events-auto">


          <div className="flex flex-col items-start gap-2 w-min">
            <div className="text-left">
              <h1 className="text-[clamp(4rem,20vw,15rem)] font-bold text-white tracking-tighter mix-blend-overlay opacity-90 whitespace-nowrap">
                Creative Director
              </h1>
            </div>
            <div className="text-left w-full flex items-center">
              <p className="fl-text-base/2xl text-white/90 font-serif font-light leading-relaxed text-justify">
                Crafting digital experiences that merge creativity with technology.
                Exploring the boundaries of interactive design and fluid user interfaces.
                Building the future of web interactions one pixel at a time.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 animate-bounce text-white/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Dashboard Section */}
      <div id="dashboard" className="w-full relative z-20">
        <Dashboard />
      </div>
    </main>
  );
}

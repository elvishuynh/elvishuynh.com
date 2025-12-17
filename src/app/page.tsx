import Dashboard from "@/components/Dashboard";
import ScrollManager from "@/components/ScrollManager";

export default function Home() {
  return (
    <main className="flex h-screen flex-row items-center justify-start relative w-[200vw] overflow-x-hidden">
      <ScrollManager />

      {/* Hero Section - Transparent to show LiquidGlassCursor */}
      <section id="hero" className="h-screen w-screen flex-shrink-0 flex flex-col justify-start pt-20 relative z-10 pointer-events-none">
        <div className="w-full px-8 flex flex-col gap-2 pointer-events-auto">


          <div className="flex flex-col items-start gap-2 w-min">
            <div className="text-left">
              <h1 className="text-[clamp(4rem,20vw,15rem)] font-bold text-white tracking-tighter whitespace-nowrap">
                Creative Director
              </h1>
            </div>
            <div className="text-left w-full flex items-center">
              <p className="fl-text-base/2xl text-white font-serif font-light leading-relaxed text-justify">
                I am Elvis Huynh, a multidisciplinary human who my clients trust to amplify their voice and brand through digital mediums.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 animate-bounce text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Dashboard Section */}
      <div id="dashboard" className="w-screen h-screen flex-shrink-0 relative z-20">
        <Dashboard />
      </div>
    </main>
  );
}

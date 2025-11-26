import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between relative">
      {/* Hero Section - Transparent to show LiquidGlassCursor */}
      <section className="h-screen w-full flex flex-col items-center justify-center relative z-10 pointer-events-none">
        <div className="text-center space-y-4 pointer-events-auto">
          <h1 className="text-7xl md:text-9xl font-bold text-white tracking-tighter mix-blend-overlay opacity-90">
            ELVIS
          </h1>
          <p className="text-xl md:text-2xl text-white/70 font-light tracking-widest uppercase">
            Digital Experience
          </p>
        </div>

        <div className="absolute bottom-12 animate-bounce text-white/50">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Dashboard Section */}
      <Dashboard />
    </main>
  );
}

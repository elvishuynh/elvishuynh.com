import Dashboard from "@/components/Dashboard";
import ScrollManager from "@/components/ScrollManager";

export default function Home() {
  return (
    <main className="flex h-screen flex-row items-center justify-start relative w-[400vw] overflow-x-hidden">
      <ScrollManager />

      {/* Hero Section - Transparent to show LiquidGlassCursor */}
      <section id="hero" className="h-screen w-screen flex-shrink-0 flex flex-col justify-start pt-20 relative z-10 pointer-events-none">


        <div className="absolute bottom-12 animate-bounce text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* Video Section */}
      <section id="video-section" className="w-screen h-screen flex-shrink-0 bg-black relative z-20 overflow-hidden">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="https://assets.elvishuynh.com/web_filmreel.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </section>

      {/* Vertical Videos Section */}
      <section id="vertical-videos" className="w-screen h-screen flex-shrink-0 bg-black relative z-20 flex flex-row items-stretch justify-center overflow-hidden">
        <div className="h-full flex-1 relative">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://assets.elvishuynh.com/web_stravawarrior.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="h-full flex-1 relative">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://assets.elvishuynh.com/web_sephoradolcegabbana.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="h-full flex-1 relative">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://assets.elvishuynh.com/web_colossusbread.mp4" type="video/mp4" />
          </video>
        </div>
      </section>

      {/* Dashboard Section */}
      <div id="dashboard" className="w-screen h-screen flex-shrink-0 relative z-20">
        <Dashboard />
      </div>
    </main>
  );
}

"use client";
import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import Tesseract3D from './Tesseract3D';

const FlippableActivityCard = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const tl = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Assert initial DOM structure bounds definitively to block React interference
            gsap.set(".face.back", { autoAlpha: 0 });
            gsap.set(".glass-panel", { z: 0 });
            gsap.set(".layer-content", { z: 0 });

            // Initialize purely immutable physics timeline.
            // Binds all visual effects strictly to logical playback time to natively eliminate all spam-click state overlapping!
            tl.current = gsap.timeline({ paused: true })
                .to(cardRef.current, {
                    rotationY: 180,
                    duration: 1.8,
                    ease: "none",
                    onUpdate: function () {
                        const currentRot = gsap.getProperty(cardRef.current, "rotationY") as number;
                        const rads = (currentRot * Math.PI) / 180;

                        // Z Depth lift (Parallax Parabola)
                        const curve = Math.max(0, Math.sin(rads));
                        gsap.set(".glass-panel", { z: curve * 40 });
                        gsap.set(".layer-content", { z: curve * 80 });

                        // Evaluate actual playback coordinate to seamlessly toggle the 3D GPU context dynamically
                        const progress = tl.current?.progress() || 0;
                        if (progress > 0 && progress < 1) {
                            // Flight Mode - True Parallax
                            gsap.set(".face.front, .face.back", { transformStyle: "preserve-3d", autoAlpha: 1 });
                        } else {
                            // Static Mode - Crisp Font Vectors
                            gsap.set(".face.front, .face.back", { clearProps: "transformStyle" });
                            // Guarantee mathematically perfect occlusion while in pure 2D buffer
                            if (progress === 1) gsap.set(".face.front", { autoAlpha: 0 });
                            if (progress === 0) gsap.set(".face.back", { autoAlpha: 0 });
                        }

                        // Dynamic Z-Index Armor:
                        const normalizedRot = ((currentRot % 360) + 360) % 360;
                        if (normalizedRot > 90 && normalizedRot < 270) {
                            gsap.set(".face.back", { zIndex: 2 });
                            gsap.set(".face.front", { zIndex: 1 });
                        } else {
                            gsap.set(".face.front", { zIndex: 2 });
                            gsap.set(".face.back", { zIndex: 1 });
                        }
                    }
                }, 0)
                // Sync chronological fog climax
                .to(".glass-panel", {
                    duration: 0.9,
                    backgroundColor: "rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(3px)",
                    ease: "sine.inOut"
                }, 0)
                // Decay sequential fog over the remaining 0.9s of the animation
                .to(".glass-panel", {
                    duration: 0.9,
                    backgroundColor: "rgba(255, 255, 255, 0)",
                    backdropFilter: "blur(0px)",
                    ease: "sine.inOut",
                    clearProps: "backdropFilter,backgroundColor"
                }, 0.9);
        }, cardRef);

        return () => ctx.revert();
    }, []);

    const handleFlip = () => {
        const timeline = tl.current;
        if (!cardRef.current || !timeline) return;

        setIsFlipped((prev) => {
            const nextState = !prev;
            // Centralized Symmetric Controller:
            // Scrubbing the timeline's playhead with specialized physics 
            // Ensures fast starts and smooth settlements in BOTH directions.
            gsap.to(timeline, {
                time: nextState ? timeline.duration() : 0,
                duration: 1.8,
                ease: "power4.out",
                overwrite: true
            });
            return nextState;
        });
    };


    return (
        // 1. The Stage (Parent)
        <div className="scene col-span-1 h-full min-h-[220px]" style={{ perspective: '1500px' }}>

            {/* 2. The Rotator (Child) */}
            <div
                className="card-rotator w-full h-full relative cursor-pointer"
                ref={cardRef}
                onClick={handleFlip}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* === FRONT FACE === */}
                <div
                    className="face front absolute inset-0 rounded-3xl bg-foreground border border-white shadow-xl"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                    }}
                >
                    {/* Layer A: Glass Panel (Fog Effect) - Plane B */}
                    <div
                        className="glass-panel absolute inset-0 m-auto w-[85%] h-[85%] rounded-2xl pointer-events-none z-10 border border-white/20"
                        style={{
                            backgroundColor: "rgba(255,255,255,0)" // Start fully transparent
                        }}
                    />
                    {/* Layer B: The Floating Content (Bound strictly within the glass-panel) */}
                    <div
                        className="layer-content absolute inset-0 m-auto w-[85%] h-[85%] pointer-events-none z-20"
                    >
                        {/* Top Group: Badges & Hero Graphics */}
                        <div className="absolute top-6 inset-x-0 mx-auto w-[85%] flex justify-between items-start">
                            {/* Top Left Badge */}
                            <div className="flex items-center gap-1.5 opacity-80 mt-1">
                                {/* USER PERSONA icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-[13px] h-[13px] text-white">
                                    <path d="M8 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V8M8 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V16M21 8V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H16M21 16V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H16M7.5 8V9.5M16.5 8V9.5M11 12.6001C11.8 12.6001 12.5 11.9001 12.5 11.1001V8M15.2002 15.2C13.4002 17 10.5002 17 8.7002 15.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[9px] font-sans font-medium uppercase tracking-[0.15em] text-white">WHO?</span>
                            </div>

                            {/* Top Right: Text Content */}
                            <div className="flex flex-col items-end font-sans text-white text-right shrink-0 mt-1">
                                <h3 className="text-2xl font-bold mb-0.5 leading-none">Elvis Huynh</h3>
                                <p className="font-medium opacity-80 text-[11px]">Creative Director</p>
                            </div>
                        </div>

                        {/* Middle Tesseract Content */}
                        <div className="absolute inset-x-0 top-1/2 -mt-[55px] flex items-center justify-center w-full pointer-events-none">
                            <div className="w-[90px] h-[90px] flex items-center justify-center">
                                <Tesseract3D />
                            </div>
                        </div>

                        {/* Bottom Group: EXPERIENCE & Button */}
                        <div className="absolute bottom-5 inset-x-0 mx-auto w-[85%] flex items-end justify-between">
                            {/* EXPERIENCE List Block */}
                            <div className="flex flex-col items-start font-sans text-white">
                                <div className="flex items-center gap-2 mb-2 opacity-60">
                                    <span className="text-[10px] uppercase tracking-widest font-medium">EXPERIENCE</span>
                                    <div className="w-[5px] h-[5px] border border-white rounded-full"></div>
                                </div>
                                <p className="text-[10px] opacity-80 mb-0.5 tracking-wide">[10+ years] as a Cinematographer</p>
                                <p className="text-[10px] opacity-80 mb-0.5 tracking-wide">[4+ years] as a Social Media Strategist</p>
                                <p className="text-[10px] opacity-80 tracking-wide">[2+ years] as a self-taught Programmer</p>
                            </div>

                            {/* Button Layer */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                                className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold hover:bg-gray-200 transition-colors pointer-events-auto border border-white shadow-lg shrink-0"
                            >
                                Flip me
                            </button>
                        </div>
                    </div>
                </div>

                {/* === BACK FACE === */}
                <div
                    className="face back absolute inset-0 rounded-3xl bg-foreground shadow-xl border border-white"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    {/* Layer A: Glass Panel (Fog Effect) - Plane B */}
                    <div
                        className="glass-panel absolute inset-0 m-auto w-[85%] h-[85%] rounded-2xl pointer-events-none z-10 border border-white/20"
                        style={{
                            backgroundColor: "rgba(255,255,255,0.1)"
                        }}
                    />
                    {/* Layer B: The Floating Content */}
                    <div
                        className="layer-content absolute inset-0 m-auto w-[85%] h-[85%] pointer-events-none z-20"
                    >
                        {/* Top Group: Badges & Hero Graphics */}
                        <div className="absolute top-6 inset-x-0 mx-auto w-[85%] flex justify-between items-start">
                            {/* Top Left Badge */}
                            <div className="flex items-center gap-1.5 opacity-80 mt-1">
                                {/* WHY? icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-[13px] h-[13px] text-white">
                                    <path d="M8 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V8M8 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V16M21 8V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H16M21 16V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H16M7.5 8V9.5M16.5 8V9.5M11 12.6001C11.8 12.6001 12.5 11.9001 12.5 11.1001V8M15.2002 15.2C13.4002 17 10.5002 17 8.7002 15.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span className="text-[9px] font-sans font-medium uppercase tracking-[0.15em] text-white">WHY?</span>
                            </div>


                        </div>

                        {/* Middle Text Content */}
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-[85%] mx-auto pointer-events-none">
                            <p className="font-sans text-[10px] text-white opacity-80 leading-relaxed text-left tracking-wide mb-3 indent-4">
                                Elvis has a track record of turning brand objectives into tangible victories. Time and again, partnering with him has proven to be a definitive win for brand KPIs.
                            </p>
                            <p className="font-sans text-[10px] text-white opacity-80 leading-relaxed text-left tracking-wide indent-4">
                                Highlights include rebranding the online and physical presence of Revive Auto Spa, cinematic documentaries about motorycle racres and fashion designers, and promotions for global braands such as Sephora and Kohls.
                            </p>
                        </div>

                        {/* Bottom Group: Button */}
                        <div className="absolute bottom-5 inset-x-0 mx-auto w-[85%] flex items-end justify-end">

                            {/* Button Layer */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                                className="px-3 py-1.5 rounded-full bg-white text-black text-[10px] font-bold hover:bg-gray-200 transition-colors pointer-events-auto border border-white shadow-lg shrink-0"
                            >
                                Flip me
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlippableActivityCard;

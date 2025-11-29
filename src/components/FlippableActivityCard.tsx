"use client";
import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import Tesseract3D from './Tesseract3D';

const FlippableActivityCard = () => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const ctx = useRef<gsap.Context | null>(null);

    useEffect(() => {
        ctx.current = gsap.context(() => { }, cardRef);
        return () => ctx.current?.revert();
    }, []);

    const handleFlip = () => {
        if (!cardRef.current) return;

        const nextState = !isFlipped;
        setIsFlipped(nextState);

        ctx.current?.add(() => {
            gsap.to(cardRef.current, {
                rotationY: nextState ? 180 : 0,
                duration: 0.8,
                ease: "back.inOut(1.5)", // Heavy spring
                overwrite: true
            });

            // Fog Effect: Animate glass panel opacity/color
            // Fog Effect: Animate glass panel opacity/color
            gsap.to(".glass-panel", {
                duration: 0.4,
                backgroundColor: "rgba(255, 255, 255, 0.6)", // Fog up to 60% white
                backdropFilter: "blur(4px)", // Add blur
                yoyo: true,
                repeat: 1,
                ease: "power1.inOut"
            });
        });
    };

    return (
        // 1. The Stage (Parent)
        <div className="scene col-span-1 row-span-2 h-full" style={{ perspective: '1500px' }}>

            {/* 2. The Rotator (Child) */}
            <div
                className="card-rotator w-full h-full relative cursor-pointer"
                ref={cardRef}
                onClick={handleFlip}
                style={{ transformStyle: 'preserve-3d' }}
            >
                {/* === FRONT FACE === */}
                <div
                    className="face front absolute inset-0 rounded-3xl bg-[#e8e6df] border border-gray-200 shadow-xl"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Layer A: Glass Panel (Fog Effect) - Plane B */}
                    <div
                        className="glass-panel absolute left-1/2 top-1/2 w-[85%] h-[85%] rounded-2xl pointer-events-none z-10 border border-white/20"
                        style={{
                            transform: 'translate3d(-50%, -50%, 40px)', // Center + The Void (Gap)
                            backgroundColor: "rgba(255,255,255,0)", // Start fully transparent
                            backdropFilter: "blur(0px)"
                        }}
                    />
                    {/* Layer B: The Floating Content */}
                    <div
                        className="layer-content absolute inset-0 p-8 flex flex-col pointer-events-none z-20"
                        style={{ transform: 'translateZ(80px)' }}
                    >
                        {/* Hero Element: Neon Tesseract */}
                        <div className="flex-1 flex items-center justify-center">
                            <Tesseract3D />
                        </div>

                        {/* Text Content */}
                        <div className="mt-6 text-center">
                            <h3 className="text-3xl font-bold text-black mb-1">Elvis Huynh</h3>
                            <p className="text-gray-500 font-medium">Creative Director</p>
                        </div>

                        {/* Button (Pointer events re-enabled) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                            className="w-full mt-8 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors pointer-events-auto shadow-lg"
                        >
                            Flip me
                        </button>
                    </div>
                </div>

                {/* === BACK FACE === */}
                <div
                    className="face back absolute inset-0 rounded-3xl bg-[#b1b3b3] shadow-xl"
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Layer A: Glass Panel (Fog Effect) - Plane B */}
                    <div
                        className="glass-panel absolute inset-0 rounded-3xl pointer-events-none z-10 border border-white/20"
                        style={{
                            transform: 'translateZ(40px)', // The Void (Gap)
                            backgroundColor: "rgba(255,255,255,0.1)",
                            backdropFilter: "blur(0px)"
                        }}
                    />
                    {/* Layer B: The Floating Content */}
                    <div
                        className="layer-content absolute inset-0 p-8 flex flex-col pointer-events-none"
                        style={{ transform: 'translateZ(80px)' }}
                    >
                        {/* Hero Element: Radar Chart Placeholder */}
                        <div className="flex-1 flex items-center justify-center relative">
                            <svg viewBox="0 0 100 100" className="w-32 h-32 opacity-80">
                                <polygon points="50,10 90,35 75,85 25,85 10,35" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
                                <polygon points="50,25 75,40 65,70 35,70 25,40" fill="rgba(255,95,21,0.2)" stroke="#ff5f15" strokeWidth="1" />
                                <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(0,0,0,0.1)" />
                                <line x1="50" y1="50" x2="90" y2="35" stroke="rgba(0,0,0,0.1)" />
                                <line x1="50" y1="50" x2="75" y2="85" stroke="rgba(0,0,0,0.1)" />
                                <line x1="50" y1="50" x2="25" y2="85" stroke="rgba(0,0,0,0.1)" />
                                <line x1="50" y1="50" x2="10" y2="35" stroke="rgba(0,0,0,0.1)" />
                            </svg>
                        </div>

                        {/* Text Content */}
                        <div className="mt-6 text-center">
                            <h3 className="text-3xl font-bold text-black mb-1">GOAL</h3>
                            <p className="text-gray-500 text-sm">
                                Increase user engagement by 25% Q3
                            </p>
                        </div>

                        {/* Button (Pointer events re-enabled) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                            className="w-full mt-8 py-3 rounded-full bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors pointer-events-auto shadow-lg"
                        >
                            Flip me
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlippableActivityCard;

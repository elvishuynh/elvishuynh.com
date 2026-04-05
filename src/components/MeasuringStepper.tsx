"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// ── Section metadata ────────────────────────────────────────────────
const SECTION_COUNT = 4;
const TICKS_PER_SECTION = 40;
const TOTAL_TICKS = SECTION_COUNT * TICKS_PER_SECTION + 1;

const sections = [
    { label: "01" },
    { label: "02" },
    { label: "03" },
    { label: "04" },
];

const LERP_FACTOR = 0.045;

export default function MeasuringStepper() {
    const tapeRef = useRef<HTMLDivElement>(null);
    const currentX = useRef<number | null>(null);
    const activeSectionRef = useRef<number>(0);
    const boundaryTickRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        // Set initial state: section 0's boundary tick starts scaled
        const initialTick = boundaryTickRefs.current[0];
        if (initialTick) {
            gsap.set(initialTick, { scaleY: 2.8, opacity: 1 });
        }

        const tickerFn = () => {
            if (!tapeRef.current) return;

            const maxScroll = document.documentElement.scrollWidth - window.innerWidth;
            if (maxScroll <= 0) return;

            const progress = window.scrollX / maxScroll;
            const offsetPx = window.innerWidth / 2;
            const targetX = offsetPx - progress * maxScroll;

            if (currentX.current === null) {
                currentX.current = targetX;
            }

            currentX.current += (targetX - currentX.current) * LERP_FACTOR;
            gsap.set(tapeRef.current, { x: currentX.current, force3D: true });

            if (currentX.current === null) return;

            // Continuous scaling for boundary ticks based on proximity to screen center.
            // This ensures they grow/shrink perfectly in sync with the tape movemement.
            const centerX = window.innerWidth / 2;
            boundaryTickRefs.current.forEach((tick, i) => {
                if (!tick) return;
                
                // Calculate tick's current viewport X position
                // (currentX.current is guaranteed to be a number here)
                const x = currentX.current as number;
                const tickX = x + i * window.innerWidth;
                const dist = Math.abs(tickX - centerX);
                
                // Smaller range (20% of screen width) ensures scaling is only seen 
                // while the tick is well within the visible central area.
                const range = window.innerWidth * 0.2;
                const proximity = Math.max(0, 1 - dist / range);
                
                // Use a squared curve for a more distinct "pop" at the very center
                const smoothedProximity = proximity * proximity;
                
                const targetScale = 1 + (3.2 - 1) * smoothedProximity;
                const targetWidth = 1.5 + (3.5 - 1.5) * smoothedProximity;
                const targetOpacity = 0.9 + (1 - 0.9) * smoothedProximity;
                
                gsap.set(tick, { 
                    scaleY: targetScale, 
                    width: `${targetWidth}px`,
                    opacity: targetOpacity,
                    force3D: true 
                });
            });
        };

        gsap.ticker.add(tickerFn);
        return () => { gsap.ticker.remove(tickerFn); };
    }, []);

    return (
        <div
            className="fixed bottom-0 left-0 w-screen pointer-events-none select-none z-[60]"
            style={{
                height: "80px",
                mixBlendMode: "difference",
                maskImage:
                    "linear-gradient(to right, transparent 0%, transparent 24%, black 26%, black 100%)",
                WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, transparent 24%, black 26%, black 100%)",
            }}
        >
            <div className="absolute inset-0 overflow-hidden">
                <div
                    ref={tapeRef}
                    className="absolute bottom-0 left-0 h-full"
                    style={{ width: `${SECTION_COUNT * 100}vw` }}
                >
                    {/* Section labels */}
                    {sections.map((sec, i) => (
                        <div
                            key={i}
                            className="absolute flex flex-col items-center"
                            style={{
                                left: `${i * 100}vw`,
                                transform: "translateX(-50%)",
                                bottom: "38px",
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "var(--font-erode)",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    letterSpacing: "0.25em",
                                    color: "rgba(255,255,255,0.85)",
                                    lineHeight: 1,
                                }}
                            >
                                {sec.label}
                            </span>
                        </div>
                    ))}

                    {/* Tick marks */}
                    <div
                        className="absolute bottom-0 left-0 w-full"
                        style={{ height: "32px" }}
                    >
                        {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
                            const progress = i / (TOTAL_TICKS - 1);
                            const isMajor = i % TICKS_PER_SECTION === 0;
                            const isMedium = i % (TICKS_PER_SECTION / 2) === 0 && !isMajor;
                            const isBoundaryTick = isMajor && i < TOTAL_TICKS - 1;
                            const sectionIndex = i / TICKS_PER_SECTION;

                            const tickHeight = isMajor ? 22 : isMedium ? 14 : 8;
                            const tickWidth = isMajor ? 1.5 : 1;

                            if (isBoundaryTick) {
                                // Boundary ticks: NO inline transform — GSAP owns it entirely.
                                // Centering done via margin offsets instead of translate().
                                return (
                                    <div
                                        key={i}
                                        ref={(el) => { boundaryTickRefs.current[sectionIndex] = el; }}
                                        className="absolute"
                                        style={{
                                            left: `${progress * 100}%`,
                                            top: "50%",
                                            marginTop: `${-tickHeight / 2}px`,
                                            marginLeft: `${-tickWidth / 2}px`,
                                            transformOrigin: "center center",
                                            width: `${tickWidth}px`,
                                            height: `${tickHeight}px`,
                                            background: "white",
                                            opacity: 0.9,
                                        }}
                                    />
                                );
                            }

                            // Non-boundary ticks: inline transform is fine, never animated
                            return (
                                <div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        left: `${progress * 100}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: `${tickWidth}px`,
                                        height: `${tickHeight}px`,
                                        background: "white",
                                        opacity: isMedium ? 0.55 : 0.28,
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

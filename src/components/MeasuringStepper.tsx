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

/**
 * LERP_FACTOR controls the "heaviness" of the tape's follow.
 * Lower = heavier, more lagging. Higher = snappier.
 * 0.045 gives a premium, heavy-weight measurement tool feel.
 */
const LERP_FACTOR = 0.045;

export default function MeasuringStepper() {
    const tapeRef = useRef<HTMLDivElement>(null);
    const currentX = useRef<number | null>(null);

    useEffect(() => {
        /**
         * Motion strategy
         * ───────────────
         * ScrollManager blocks native scroll (Observer preventDefault: true).
         * scrollX only changes during gsap.to(window, { scrollTo }) tweens.
         *
         * We use gsap.ticker to read scrollX every frame and lerp the tape's
         * translateX toward the target position. The low LERP_FACTOR makes
         * the tape lag behind and catch up with a heavy, physics-based feel
         * (matching the reference's "ease-in-out-expo duration-1500" spec).
         */
        const tickerFn = () => {
            if (!tapeRef.current) return;

            const maxScroll = document.documentElement.scrollWidth - window.innerWidth;
            if (maxScroll <= 0) return;

            const progress = window.scrollX / maxScroll;
            const offsetPx = window.innerWidth / 2;
            const targetX = offsetPx - progress * maxScroll;

            // First frame: snap instantly so tape doesn't animate from 0
            if (currentX.current === null) {
                currentX.current = targetX;
            }

            // Lerp toward target for heavy, physics-based movement
            currentX.current += (targetX - currentX.current) * LERP_FACTOR;

            gsap.set(tapeRef.current, { x: currentX.current, force3D: true });
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
                /* Edge fade masks — ruler vanishes at screen edges */
                maskImage:
                    "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
                WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)",
            }}
        >
            {/* ── Stationary needle (centre of viewport) ─────────────── */}
            <div className="absolute inset-0 flex justify-center items-end">
                {/* Triangle cap */}
                <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{
                        bottom: "32px",
                        width: 0,
                        height: 0,
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "7px solid rgba(255,255,255,0.95)",
                    }}
                />
                {/* Shaft */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-0"
                    style={{ width: "1.5px", height: "32px", background: "rgba(255,255,255,0.95)" }}
                />
            </div>

            {/* ── Moving tape ──────────────────────────────────────────── */}
            <div className="absolute inset-0 overflow-hidden">
                <div
                    ref={tapeRef}
                    className="absolute bottom-0 left-0 h-full"
                    style={{ width: `${SECTION_COUNT * 100}vw` }}
                >
                    {/* Section labels — positioned above major ticks (section boundaries)
                        so they're always visible along the tape, not only when snapped */}
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

                    {/* Baseline + tick marks */}
                    <div
                        className="absolute bottom-0 left-0 w-full"
                        style={{
                            height: "32px",
                        }}
                    >
                        {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
                            const progress = i / (TOTAL_TICKS - 1);
                            const isMajor = i % TICKS_PER_SECTION === 0;
                            const isMedium = i % (TICKS_PER_SECTION / 2) === 0 && !isMajor;

                            return (
                                <div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        left: `${progress * 100}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: isMajor ? "1.5px" : "1px",
                                        height: isMajor ? "22px" : isMedium ? "14px" : "8px",
                                        background: "white",
                                        opacity: isMajor ? 0.9 : isMedium ? 0.55 : 0.28,
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

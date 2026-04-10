"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// ── Section metadata ────────────────────────────────────────────────
// Mirrors the section order defined in page.tsx
const SECTIONS = [
    { id: "hero", label: "HOME" },
    { id: "video-section", label: "DEMO REEL" },
    { id: "vertical-videos", label: "VERTICALS" },
    { id: "dashboard", label: "ABOUT" },
];

export default function SectionLabel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const currentRef = useRef<HTMLSpanElement>(null);
    const nextRef = useRef<HTMLSpanElement>(null);
    const activeSectionRef = useRef<number>(0);
    const isAnimatingRef = useRef<boolean>(false);
    const timelineRef = useRef<gsap.core.Timeline | null>(null);

    useEffect(() => {
        if (!currentRef.current || !nextRef.current || !wrapperRef.current) return;

        // Initialize labels
        currentRef.current.textContent = SECTIONS[0].label;
        nextRef.current.textContent = "";

        // Position both at their resting states
        gsap.set(currentRef.current, { y: 0 });
        gsap.set(nextRef.current, { y: 0 });

        const tickerFn = () => {
            if (isAnimatingRef.current) return;

            const maxScroll =
                document.documentElement.scrollWidth - window.innerWidth;
            if (maxScroll <= 0) return;

            const progress = window.scrollX / maxScroll;

            // Determine active section (0-based) from scroll progress
            const sectionCount = SECTIONS.length;
            const rawIndex = progress * (sectionCount - 1);
            const newSection = Math.round(rawIndex);
            const clampedSection = Math.min(
                Math.max(newSection, 0),
                sectionCount - 1
            );

            if (clampedSection !== activeSectionRef.current) {
                const direction =
                    clampedSection > activeSectionRef.current ? 1 : -1;
                activeSectionRef.current = clampedSection;
                animateTransition(clampedSection, direction);
            }
        };

        const animateTransition = (newIndex: number, direction: number) => {
            if (!currentRef.current || !nextRef.current || !wrapperRef.current) return;
            isAnimatingRef.current = true;

            // Kill any in-progress transition to prevent overlap
            if (timelineRef.current) {
                timelineRef.current.kill();
            }

            const current = currentRef.current;
            const next = nextRef.current;

            // Use the wrapper's actual pixel height so the text fully
            // exits the overflow:hidden clip area — yPercent was only
            // moving by the span's own height (~1em) inside a 2em container,
            // leaving text partially visible and causing the "snap" effect.
            const clipH = wrapperRef.current.offsetHeight;

            // Set the incoming label text BEFORE positioning so layout is computed
            next.textContent = SECTIONS[newIndex].label;

            // Force a synchronous layout reflow so the browser finishes text
            // layout (including letter-spacing) before the first animation frame.
            // This prevents the "WOR" -> "WORK" clipping glitch.
            next.getBoundingClientRect();

            // Position next label fully outside the clip: below if forward, above if backward
            gsap.set(next, { y: direction * clipH });

            const tl = gsap.timeline({
                onComplete: () => {
                    // Copy the final text to "current" and swap positions
                    // in a single synchronous block — no visible change.
                    current.textContent = SECTIONS[newIndex].label;
                    gsap.set(current, { y: 0, immediateRender: true });
                    gsap.set(next, { y: clipH, immediateRender: true });

                    timelineRef.current = null;
                    isAnimatingRef.current = false;
                },
            });

            timelineRef.current = tl;

            // Animate current label fully out of the clip area
            tl.to(
                current,
                {
                    y: -direction * clipH,
                    duration: 0.5,
                    ease: "power2.inOut",
                },
                0
            );

            // Animate next label into view (y: 0 = vertically centered via flexbox)
            tl.to(
                next,
                {
                    y: 0,
                    duration: 0.5,
                    ease: "power2.inOut",
                },
                0
            );
        };

        gsap.ticker.add(tickerFn);
        return () => {
            gsap.ticker.remove(tickerFn);
            if (timelineRef.current) {
                timelineRef.current.kill();
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed bottom-0 left-0 pointer-events-none select-none z-[60]"
            style={{
                height: "80px",
                mixBlendMode: "difference",
                display: "flex",
                alignItems: "center",
                paddingLeft: "2rem",
                overflow: "hidden",
            }}
        >
            {/* The inner wrapper clips the sliding text. Its pixel height
                is read at animation time so `y` translations fully push
                text outside the visible area — no partial visibility. */}
            <div
                ref={wrapperRef}
                className="relative"
                style={{
                    overflow: "hidden",
                    height: "2em",
                    minWidth: "12ch",
                    display: "grid",
                    alignItems: "center",
                }}
            >
                <span
                    ref={currentRef}
                    className="fl-text-lg/2xl font-bold tracking-widest"
                    style={{
                        gridArea: "1 / 1",
                        color: "white",
                        display: "block",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        willChange: "transform",
                    }}
                />
                <span
                    ref={nextRef}
                    className="fl-text-lg/2xl font-bold tracking-widest"
                    style={{
                        gridArea: "1 / 1",
                        color: "white",
                        display: "block",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        willChange: "transform",
                    }}
                />
            </div>
        </div>
    );
}

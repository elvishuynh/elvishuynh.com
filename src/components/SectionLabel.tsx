"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

// ── Section metadata ────────────────────────────────────────────────
// Mirrors the section order defined in page.tsx
const SECTIONS = [
    { id: "hero", label: "REEL" },
    { id: "video-section", label: "FILM" },
    { id: "vertical-videos", label: "WORK" },
    { id: "dashboard", label: "ABOUT" },
];

export default function SectionLabel() {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentRef = useRef<HTMLSpanElement>(null);
    const nextRef = useRef<HTMLSpanElement>(null);
    const activeSectionRef = useRef<number>(0);
    const isAnimatingRef = useRef<boolean>(false);

    useEffect(() => {
        if (!currentRef.current || !nextRef.current) return;

        // Initialize labels
        currentRef.current.textContent = SECTIONS[0].label;
        nextRef.current.textContent = SECTIONS[1]?.label ?? "";

        // Position next label below (ready to scroll up)
        gsap.set(nextRef.current, { yPercent: 100, opacity: 0 });

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
            if (!currentRef.current || !nextRef.current) return;
            isAnimatingRef.current = true;

            const current = currentRef.current;
            const next = nextRef.current;

            // Set the incoming label text
            next.textContent = SECTIONS[newIndex].label;

            // Position next label: below if scrolling forward, above if backward
            gsap.set(next, {
                yPercent: direction * 100,
                opacity: 0,
            });

            const tl = gsap.timeline({
                onComplete: () => {
                    // Swap: next becomes current position, current hides
                    gsap.set(current, { yPercent: 0, opacity: 1 });
                    current.textContent = SECTIONS[newIndex].label;
                    gsap.set(next, { yPercent: 100, opacity: 0 });
                    isAnimatingRef.current = false;
                },
            });

            // Animate current label out (scroll up if forward, down if backward)
            tl.to(
                current,
                {
                    yPercent: -direction * 100,
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.inOut",
                },
                0
            );

            // Animate next label in
            tl.to(
                next,
                {
                    yPercent: 0,
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.inOut",
                },
                0
            );
        };

        gsap.ticker.add(tickerFn);
        return () => {
            gsap.ticker.remove(tickerFn);
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
            <div
                className="relative"
                style={{
                    overflow: "hidden",
                    height: "2em",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                <span
                    ref={currentRef}
                    className="fl-text-lg/2xl font-bold tracking-widest"
                    style={{
                        color: "white",
                        display: "block",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                    }}
                />
                <span
                    ref={nextRef}
                    className="fl-text-lg/2xl font-bold tracking-widest"
                    style={{
                        color: "white",
                        display: "block",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        position: "absolute",
                        left: 0,
                        top: 0,
                    }}
                />
            </div>
        </div>
    );
}

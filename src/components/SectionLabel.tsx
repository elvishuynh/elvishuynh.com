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
    const timelineRef = useRef<gsap.core.Timeline | null>(null);
    const jumpingTargetRef = useRef<number | null>(null);

    useEffect(() => {
        if (!currentRef.current || !nextRef.current || !wrapperRef.current) return;

        // Initialize labels
        currentRef.current.textContent = SECTIONS[0].label;
        nextRef.current.textContent = "";

        // Position both at their resting states
        gsap.set(currentRef.current, { y: 0 });
        gsap.set(nextRef.current, { y: 0 });

        const animateTransition = (newIndex: number, direction: number) => {
            if (!currentRef.current || !nextRef.current || !wrapperRef.current) return;

            // Kill any in-progress transition so we don't overlap tweens
            if (timelineRef.current) {
                timelineRef.current.kill();
            }

            const current = currentRef.current;
            const next = nextRef.current;
            const clipH = wrapperRef.current.offsetHeight || 40;

            // Set incoming text BEFORE positioning to allow DOM layout evaluation
            next.textContent = SECTIONS[newIndex].label;
            next.getBoundingClientRect(); // trigger reflow to prevent character popping

            // Position next label fully outside the clip mask
            gsap.set(next, { y: direction * clipH });

            const tl = gsap.timeline({
                onComplete: () => {
                    // Synchronously swap text and reset coordinates to eliminate the visual snap
                    current.textContent = SECTIONS[newIndex].label;
                    gsap.set(current, { y: 0, immediateRender: true });
                    gsap.set(next, { y: clipH, immediateRender: true });
                    timelineRef.current = null;
                },
            });

            timelineRef.current = tl;

            tl.to(current, { y: -direction * clipH, duration: 0.5, ease: "power2.inOut" }, 0);
            tl.to(next, { y: 0, duration: 0.5, ease: "power2.inOut" }, 0);
        };

        const handleNavJump = (e: Event) => {
            const customEvent = e as CustomEvent;
            const targetIndex = customEvent.detail.targetIndex;
            if (targetIndex !== activeSectionRef.current) {
                // Compute direction to the target and trigger the final animation immediately
                const direction = targetIndex > activeSectionRef.current ? 1 : -1;
                jumpingTargetRef.current = targetIndex; // Lock out normal scroll triggers
                activeSectionRef.current = targetIndex;
                animateTransition(targetIndex, direction);
            }
        };

        window.addEventListener("navJump", handleNavJump);

        const tickerFn = () => {
            const maxScroll = document.documentElement.scrollWidth - window.innerWidth;
            if (maxScroll <= 0) return;

            const progress = window.scrollX / maxScroll;
            const sectionCount = SECTIONS.length;
            const rawIndex = progress * (sectionCount - 1);
            const clampedSection = Math.min(Math.max(Math.round(rawIndex), 0), sectionCount - 1);

            // If we are currently locked into a Navbar multi-section jump...
            if (jumpingTargetRef.current !== null) {
                // Unlock only when the scroll coordinates naturally cross the destination,
                // freeing it to react to regular small mousewheel scrolls again.
                if (Math.abs(rawIndex - jumpingTargetRef.current) < 0.1) {
                    jumpingTargetRef.current = null;
                } else {
                    return; // Crucial: ignore rapid intermediate section crossings
                }
            }

            if (clampedSection !== activeSectionRef.current) {
                const direction = clampedSection > activeSectionRef.current ? 1 : -1;
                activeSectionRef.current = clampedSection;
                animateTransition(clampedSection, direction);
            }
        };

        gsap.ticker.add(tickerFn);
        return () => {
            gsap.ticker.remove(tickerFn);
            if (timelineRef.current) timelineRef.current.kill();
            window.removeEventListener("navJump", handleNavJump);
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

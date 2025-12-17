"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Observer } from "gsap/Observer";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

export default function ScrollManager() {
    const isAnimating = useRef(false);

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger, ScrollSmoother, Observer, ScrollToPlugin);

        const ctx = gsap.context(() => {
            // Initialize ScrollSmoother
            // ScrollSmoother.create({
            //     smooth: 1,
            //     effects: true,
            //     smoothTouch: 0.1,
            // });

            // Observer for "One Notch" Scroll
            ScrollTrigger.observe({
                target: window,
                type: "wheel,touch,pointer",
                onDown: () => {
                    if (isAnimating.current) return;
                    const width = window.innerWidth;
                    const scrollX = window.scrollX;

                    if (scrollX < 50) { // If at top (Hero) and scrolling down/right -> Go to Video
                        isAnimating.current = true;
                        gsap.to(window, { scrollTo: { x: "#video-section" }, duration: 1, ease: "power2.out" });
                        setTimeout(() => isAnimating.current = false, 1000);
                    } else if (scrollX >= width - 50 && scrollX < width + 50) { // At Video, go to Dashboard
                        isAnimating.current = true;
                        gsap.to(window, { scrollTo: { x: "#dashboard" }, duration: 1, ease: "power2.out" });
                        setTimeout(() => isAnimating.current = false, 1000);
                    }
                },
                onUp: () => {
                    if (isAnimating.current) return;
                    const width = window.innerWidth;
                    const scrollX = window.scrollX;

                    // If at Dashboard (approx 2 * width) -> Go to Video
                    if (scrollX >= 2 * width - 50) {
                        isAnimating.current = true;
                        gsap.to(window, { scrollTo: { x: "#video-section" }, duration: 1, ease: "power2.out" });
                        setTimeout(() => isAnimating.current = false, 1000);
                    }
                    // If at Video and scrolling up/left -> Go to Hero
                    else if (scrollX >= width - 50 && scrollX < width + 50) {
                        isAnimating.current = true;
                        gsap.to(window, { scrollTo: { x: "#hero" }, duration: 1, ease: "power2.out" });
                        setTimeout(() => isAnimating.current = false, 1000);
                    }
                },
                tolerance: 10,
                preventDefault: true, // Restore scroll blocking for clean interaction
            });
        });

        return () => ctx.revert();
    }, []);

    return null;
}

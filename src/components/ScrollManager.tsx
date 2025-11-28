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
            ScrollSmoother.create({
                smooth: 1,
                effects: true,
                smoothTouch: 0.1,
            });

            // Observer for "One Notch" Scroll
            ScrollTrigger.observe({
                target: window,
                type: "wheel,touch,pointer",
                onDown: () => {
                    if (isAnimating.current) return;
                    if (window.scrollY < 50) { // If at top (Hero) and scrolling down
                        isAnimating.current = true;
                        gsap.to(window, { scrollTo: "#dashboard", duration: 1, ease: "power2.out" });
                        setTimeout(() => isAnimating.current = false, 1000);
                    }
                },
                onUp: () => {
                    if (isAnimating.current) return;
                    const dashboardTop = document.getElementById("dashboard")?.offsetTop || window.innerHeight;
                    // If at Dashboard and scrolling up
                    if (window.scrollY >= dashboardTop - 50 && window.scrollY < dashboardTop + 200) {
                        isAnimating.current = true;
                        gsap.to(window, { scrollTo: "#hero", duration: 1, ease: "power2.out" });
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

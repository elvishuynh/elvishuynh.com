"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollManager() {
    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            // Snap between Hero and Dashboard
            // The Hero is 100vh. We want to snap so that the user is either at 0 (Hero) or at the start of Dashboard.

            ScrollTrigger.create({
                trigger: "#hero",
                start: "top top",
                end: "bottom top", // Ends when the bottom of hero hits the top of viewport
                snap: {
                    snapTo: 1, // Snap to the end (1) or start (0) of this trigger
                    duration: { min: 0.3, max: 0.8 }, // Smooth snap
                    delay: 0.1, // Wait a bit before snapping
                    ease: "power1.inOut",
                },
                // markers: true, // For debugging, remove in production
            });
        });

        return () => ctx.revert();
    }, []);

    return null;
}

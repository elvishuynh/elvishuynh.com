"use client";

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

const CONFIG = {
    VIDEO_URL: "https://pub-d24ed1d740a7460195197f5ee2413105.r2.dev/web_interactive_color.mp4",
    EASE_FACTOR: 0.15,
    TARGET_FPS: 24,
};

export default function InteractiveVideo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);

    useEffect(() => {
        let isMounted = true;
        const FRAME_STEP = 1 / CONFIG.TARGET_FPS;

        const initPixi = async () => {
            if (!containerRef.current) return;

            // Initialize PixiJS Application
            const app = new PIXI.Application();

            try {
                await app.init({
                    resizeTo: containerRef.current,
                    backgroundAlpha: 0,
                    preference: "webgl",
                });

                if (!isMounted || !containerRef.current) {
                    app.destroy();
                    return;
                }

                containerRef.current.appendChild(app.canvas);
                appRef.current = app;

                // --- 1. Load Video ---
                const videoElement = document.createElement("video");
                videoElement.crossOrigin = "anonymous";
                videoElement.src = CONFIG.VIDEO_URL;
                videoElement.loop = true;
                videoElement.muted = true;
                videoElement.preload = "auto";
                videoElement.setAttribute("playsinline", "");
                videoElement.pause();

                await new Promise<void>((resolve, reject) => {
                    if (videoElement.readyState >= 1) {
                        resolve();
                    } else {
                        videoElement.onloadedmetadata = () => resolve();
                        videoElement.onerror = () => reject(new Error("Video load failed"));
                    }
                });

                if (!isMounted) {
                    app.destroy();
                    return;
                }

                const baseSource = new PIXI.VideoSource({
                    resource: videoElement,
                    autoPlay: false,
                });
                await baseSource.load();

                // --- 2. Scene Setup ---
                const videoTexture = new PIXI.Texture({ source: baseSource });
                const videoSprite = new PIXI.Sprite(videoTexture);
                videoSprite.anchor.set(0.5);

                const scene = new PIXI.Container();
                scene.addChild(videoSprite);
                app.stage.addChild(scene);

                // --- 3. Resize Logic ---
                const resizeContent = () => {
                    if (!app.screen) return;
                    const screenW = app.screen.width;
                    const screenH = app.screen.height;
                    scene.position.set(screenW / 2, screenH / 2);

                    const scaleX = screenW / baseSource.width;
                    const scaleY = screenH / baseSource.height;
                    const scale = Math.max(scaleX, scaleY);

                    scene.scale.set(scale);
                };

                resizeContent();
                app.renderer.on("resize", resizeContent);

                // --- 4. Interaction & Animation Loop ---
                app.stage.eventMode = "static";
                app.stage.hitArea = app.screen;

                let targetProgress = 0;
                let currentProgress = 0;

                app.stage.on("pointermove", (e) => {
                    const globalX = e.global.x;
                    const screenWidth = app.screen.width;
                    const rawProgress = globalX / screenWidth;
                    targetProgress = Math.max(0, Math.min(1, rawProgress));
                });

                app.ticker.add(() => {
                    if (!videoElement.duration || !isMounted) return;

                    // 1. LERP Logic
                    const diff = targetProgress - currentProgress;

                    // SNAP: If we are close enough (0.1%), just finish the movement.
                    if (Math.abs(diff) < 0.001) {
                        currentProgress = targetProgress;
                    } else {
                        currentProgress += diff * CONFIG.EASE_FACTOR;
                    }

                    // 2. Calculate Raw Time
                    const rawTime = videoElement.duration * currentProgress;

                    // 3. QUANTIZE Time (24fps Lock)
                    const quantizedTime = Math.floor(rawTime / FRAME_STEP) * FRAME_STEP;

                    // 4. Update Video
                    if (Number.isFinite(quantizedTime)) {
                        if (Math.abs(videoElement.currentTime - quantizedTime) > FRAME_STEP / 2) {
                            videoElement.currentTime = quantizedTime;
                        }
                    }
                });

            } catch (error) {
                console.error("PixiJS initialization failed:", error);
                app.destroy();
            }
        };

        initPixi();

        return () => {
            isMounted = false;
            if (appRef.current) {
                appRef.current.destroy({ removeView: true });
                appRef.current = null;
            }
        };
    }, []);

    return (
        <div
            id="canvas-container"
            ref={containerRef}
            className="w-full h-[calc(100vh-64px)] bg-black relative overflow-hidden"
        />
    );
}

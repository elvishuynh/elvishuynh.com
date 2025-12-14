/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Inspired by Mike Bostock's Streamgraph & Lee Byron’s test data generator:
 * https://bl.ocks.org/mbostock/4060954
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Stack } from '@visx/shape';
import { PatternCircles, PatternWaves } from '@visx/pattern';
import { scaleLinear, scaleOrdinal } from '@visx/scale';
import { transpose } from '@visx/vendor/d3-array';
import { animated, useSpring } from '@react-spring/web';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import generateData from './generateData';

// utils
const range = (n: number) => Array.from(new Array(n), (_, i) => i);

export type StreamGraphProps = {
    width: number;
    height: number;
    text?: string;
    loop?: boolean;
    showControls?: boolean;
    id?: string;
    enableScrollInteraction?: boolean;
};

// Sub-component for individual layers to handle animation hooks correctly
const StreamgraphLayer = ({ pathString, color, patternUrl }: { pathString: string, color: string, patternUrl: string }) => {
    const isFirstRender = React.useRef(true);

    useEffect(() => {
        isFirstRender.current = false;
    }, []);

    const { d } = useSpring({
        d: pathString,
        config: { duration: 800 },
        immediate: isFirstRender.current,
    });

    return (
        <g>
            <animated.path d={d} fill={color} />
            <animated.path d={d} fill={patternUrl} />
        </g>
    );
};

export default function Streamgraph({
    width,
    height,
    text = "Reveal",
    loop = false,
    showControls = true,
    id = "streamgraph",
    enableScrollInteraction = false
}: StreamGraphProps) {
    const [tick, setTick] = useState(0);

    // Adaptive Resolution Configuration
    // If width is small (navbar), use drastically reduced complexity to prevent scroll judder
    // We treat anything <= 200px as a small/thumbnail usage
    const isSmall = width <= 200;

    // ADJUSTMENT: Restored layers and bumps to near-original values to fix "thin" look.
    // Optimization relies primarily on reduced SAMPLES_PER_LAYER.
    const NUM_LAYERS = isSmall ? 5 : 20; // Was 6. Increased to 15 to restore color density.
    const SAMPLES_PER_LAYER = isSmall ? 40 : 200; // Was 40. Slight bump for smoothness, still 3x opt.
    const BUMPS_PER_LAYER = isSmall ? 25 : 10; // Was 3. Restored to 10 so the total height/volume matches original.

    // CONFIGURATION LEVERS EXPLANATION:
    // 1. SAMPLES_PER_LAYER: Direct linear impact on performance. 60 samples is fine for 100px.
    // 2. NUM_LAYERS: Multiplier impact. 15 layers is close to 20, preserving style.
    // 3. BUMPS_PER_LAYER: Restored to 10 to ensure the stack accumulates enough height.

    // Memoize keys and scales based on configuration to ensure stability
    const keys = useMemo(() => range(NUM_LAYERS), [NUM_LAYERS]);

    const colorScale = useMemo(() => scaleOrdinal<number, string>({
        domain: keys,
        range: ['#ffc409', '#f14702', '#262d97', 'white', '#036ecd', '#9ecadd', '#51666e'],
    }), [keys]);

    const patternScale = useMemo(() => scaleOrdinal<number, string>({
        domain: keys,
        range: ['mustard', 'cherry', 'navy', 'circles', 'circles', 'circles', 'circles'],
    }), [keys]);

    // Create scales inside component to avoid shared state issues
    // xScale depends on SAMPLES_PER_LAYER now
    const xScale = useMemo(() => scaleLinear<number>({
        domain: [0, SAMPLES_PER_LAYER - 1],
        range: [0, width]
    }), [width, SAMPLES_PER_LAYER]);

    const yScale = useMemo(() => scaleLinear<number>({
        domain: [-30, 50],
        range: [height, 0]
    }), [height]);

    // Accessors
    const getY0 = (d: number[]) => yScale(d[0]) ?? 0;
    const getY1 = (d: number[]) => yScale(d[1]) ?? 0;

    // Animation loop
    useEffect(() => {
        if (enableScrollInteraction) {
            gsap.registerPlugin(ScrollTrigger);

            const trigger = ScrollTrigger.create({
                trigger: "body",
                start: "top top",
                end: "bottom bottom",
                onUpdate: (self) => {
                    // Change shape every 200px of scroll
                    const newTick = Math.floor(self.scroll() / 200);
                    setTick(prev => {
                        if (prev !== newTick) return newTick;
                        return prev;
                    });
                }
            });

            return () => trigger.kill();
        } else {
            const interval = setInterval(() => {
                setTick((t) => {
                    if (!loop && t >= 7) {
                        clearInterval(interval);
                        return t;
                    }
                    return t + 1;
                });
            }, 800);

            return () => clearInterval(interval);
        }
    }, [loop, enableScrollInteraction]);

    // Calculate multiplier based on tick
    const multiplier = useMemo(() => {
        if (enableScrollInteraction || loop) return 1.0;
        if (tick < 4) return 1.0;
        if (tick === 4) return 0.6;
        if (tick === 5) return 0.3;
        if (tick === 6) return 0.1;
        return 0.0;
    }, [tick, loop, enableScrollInteraction]);

    // Generate a pool of data to make animations deterministic and reversible
    const dataPool = useMemo(() => {
        return range(50).map(() =>
            keys.map(() => generateData(SAMPLES_PER_LAYER, BUMPS_PER_LAYER))
        );
    }, [keys, SAMPLES_PER_LAYER, BUMPS_PER_LAYER]);

    // Generate data based on tick/multiplier
    const layers = useMemo(() => {
        if (!enableScrollInteraction && !loop && tick >= 7) {
            // Flat line
            // Use dynamic SAMPLES_PER_LAYER
            return transpose<number>(
                keys.map(() => new Array(SAMPLES_PER_LAYER).fill(0))
            );
        }

        // Select data from pool based on tick
        // This ensures that scrolling to the same position always yields the same shape
        const rawLayers = dataPool[tick % dataPool.length];

        // Apply multiplier
        const scaledLayers = rawLayers.map(layer =>
            layer.map(val => val * multiplier)
        );

        return transpose<number>(scaledLayers);
    }, [tick, multiplier, enableScrollInteraction, loop, dataPool, keys, SAMPLES_PER_LAYER]);

    if (width < 10) return null;

    return (
        <div className="relative w-full h-full overflow-hidden rounded-xl">
            {/* Revealed Text */}
            {showControls && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <h2
                        className={`text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-tighter drop-shadow-lg transition-opacity duration-1000 ${tick >= 4 ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {text}
                    </h2>
                </div>
            )}

            {/* Streamgraph Cover */}
            <svg width={width} height={height} className="absolute inset-0 z-10 pointer-events-none">
                <PatternCircles id={`${id}-mustard`} height={40} width={40} radius={5} fill="#036ecf" complement />
                <PatternWaves
                    id={`${id}-cherry`}
                    height={12}
                    width={12}
                    fill="transparent"
                    stroke="#232493"
                    strokeWidth={1}
                />
                <PatternCircles id={`${id}-navy`} height={60} width={60} radius={10} fill="white" complement />
                <PatternCircles
                    complement
                    id={`${id}-circles`}
                    height={60}
                    width={60}
                    radius={10}
                    fill="transparent"
                />

                <g>
                    <Stack<number[], number>
                        data={layers}
                        keys={keys}
                        offset="silhouette"
                        color={colorScale}
                        x={(_, i) => xScale(i) ?? 0}
                        y0={getY0}
                        y1={getY1}
                    >
                        {({ stacks, path }) =>
                            stacks.map((stack) => {
                                const pathString = path(stack) || '';
                                const color = colorScale(stack.key);
                                const patternName = patternScale(stack.key);
                                const patternUrl = `url(#${id}-${patternName})`;

                                return (
                                    <StreamgraphLayer
                                        key={`series-${stack.key}`}
                                        pathString={pathString}
                                        color={color}
                                        patternUrl={patternUrl}
                                    />
                                );
                            })
                        }
                    </Stack>
                </g>
            </svg>

            {/* Replay Button */}
            {showControls && (
                <div className={`absolute bottom-4 right-4 z-20 transition-opacity duration-500 ${tick >= 7 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <button
                        onClick={() => setTick(0)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium transition-all flex items-center gap-2 group"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-rotate-180 transition-transform duration-500">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        Replay
                    </button>
                </div>
            )}
        </div>
    );
}

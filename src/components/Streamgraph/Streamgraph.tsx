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
import { animated, useSpring, config } from '@react-spring/web';

import generateData from './generateData';

// constants
const NUM_LAYERS = 20;
const SAMPLES_PER_LAYER = 200;
const BUMPS_PER_LAYER = 10;
export const BACKGROUND = '#ffdede';

// utils
const range = (n: number) => Array.from(new Array(n), (_, i) => i);

const keys = range(NUM_LAYERS);

// scales
const xScale = scaleLinear<number>({
    domain: [0, SAMPLES_PER_LAYER - 1],
});
const yScale = scaleLinear<number>({
    domain: [-30, 50],
});
const colorScale = scaleOrdinal<number, string>({
    domain: keys,
    range: ['#ffc409', '#f14702', '#262d97', 'white', '#036ecd', '#9ecadd', '#51666e'],
});
const patternScale = scaleOrdinal<number, string>({
    domain: keys,
    range: ['mustard', 'cherry', 'navy', 'circles', 'circles', 'circles', 'circles'],
});

// accessors
type Datum = number[];
const getY0 = (d: Datum) => yScale(d[0]) ?? 0;
const getY1 = (d: Datum) => yScale(d[1]) ?? 0;

export type StreamGraphProps = {
    width: number;
    height: number;
    text?: string;
};

export default function Streamgraph({ width, height, text = "Reveal" }: StreamGraphProps) {
    const [tick, setTick] = useState(0);

    // Animation loop
    useEffect(() => {
        const interval = setInterval(() => {
            setTick((t) => {
                if (t >= 7) {
                    clearInterval(interval);
                    return t;
                }
                return t + 1;
            });
        }, 800);

        return () => clearInterval(interval);
    }, [tick]);

    // Calculate multiplier based on tick
    const multiplier = useMemo(() => {
        if (tick < 4) return 1.0;
        if (tick === 4) return 0.6;
        if (tick === 5) return 0.3;
        if (tick === 6) return 0.1;
        return 0.0;
    }, [tick]);

    // Generate data based on tick/multiplier
    const layers = useMemo(() => {
        if (tick >= 7) {
            // Flat line
            return transpose<number>(
                keys.map(() => new Array(SAMPLES_PER_LAYER).fill(0))
            );
        }

        // Generate random data and scale it
        const rawLayers = keys.map(() => generateData(SAMPLES_PER_LAYER, BUMPS_PER_LAYER));

        // Apply multiplier
        const scaledLayers = rawLayers.map(layer =>
            layer.map(val => val * multiplier)
        );

        return transpose<number>(scaledLayers);
    }, [tick, multiplier]);

    if (width < 10) return null;

    xScale.range([0, width]);
    yScale.range([height, 0]);

    return (
        <div className="relative w-full h-full overflow-hidden rounded-xl">
            {/* Revealed Text */}
            <div className="absolute inset-0 flex items-center justify-center z-0">
                <h2
                    className={`text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-tighter drop-shadow-lg transition-opacity duration-1000 ${tick >= 4 ? 'opacity-100' : 'opacity-0'}`}
                >
                    {text}
                </h2>
            </div>

            {/* Streamgraph Cover */}
            <svg width={width} height={height} className="absolute inset-0 z-10 pointer-events-none">
                <PatternCircles id="mustard" height={40} width={40} radius={5} fill="#036ecf" complement />
                <PatternWaves
                    id="cherry"
                    height={12}
                    width={12}
                    fill="transparent"
                    stroke="#232493"
                    strokeWidth={1}
                />
                <PatternCircles id="navy" height={60} width={60} radius={10} fill="white" complement />
                <PatternCircles
                    complement
                    id="circles"
                    height={60}
                    width={60}
                    radius={10}
                    fill="transparent"
                />

                <g>
                    <Stack<number[], number>
                        data={layers}
                        keys={keys}
                        offset="wiggle"
                        color={colorScale}
                        x={(_, i) => xScale(i) ?? 0}
                        y0={getY0}
                        y1={getY1}
                    >
                        {({ stacks, path }) =>
                            stacks.map((stack) => {
                                const pathString = path(stack) || '';
                                const color = colorScale(stack.key);
                                const pattern = patternScale(stack.key);

                                // Interpolate path string
                                const { d } = useSpring({
                                    d: pathString,
                                    config: { duration: 800 }, // Match interval for continuous flow
                                });

                                return (
                                    <g key={`series-${stack.key}`}>
                                        <animated.path d={d} fill={color} />
                                        <animated.path d={d} fill={`url(#${pattern})`} />
                                    </g>
                                );
                            })
                        }
                    </Stack>
                </g>
            </svg>

            {/* Replay Button */}
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
        </div>
    );
}

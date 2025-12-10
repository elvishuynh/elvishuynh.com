'use client';

import { useMemo, useCallback, useRef } from 'react';
import FlippableActivityCard from './FlippableActivityCard';

import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { withTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { max, extent, bisector } from 'd3-array';
import { timeFormat } from 'd3-time-format';
import { ParentSize } from '@visx/responsive';
import { analyticsData } from '../data/analyticsData';

// Accessors
const getDate = (d: { date: string }) => new Date(d.date);
const getPrimary = (d: { primary: number }) => d.primary;
const getSecondary = (d: { secondary: number }) => d.secondary;
const bisectDate = bisector<{ date: string }, Date>((d) => new Date(d.date)).left;

const chartData = analyticsData;

type TooltipData = {
    date: Date;
    primary: number;
    secondary: number;
};

const AnalyticsChart = withTooltip<
    { width: number; height: number },
    TooltipData
>(({ width, height, showTooltip, hideTooltip, tooltipData, tooltipTop = 0, tooltipLeft = 0 }) => {
    if (width < 10) return null;

    // Refs
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const svgRef = useRef<SVGSVGElement>(null);

    // Bounds
    const margin = { top: 20, right: 0, bottom: 0, left: 0 };
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;

    // Scales
    const xScale = useMemo(
        () =>
            scaleTime({
                range: [0, xMax],
                domain: extent(chartData, getDate) as [Date, Date],
            }),
        [xMax]
    );

    const yScale = useMemo(
        () =>
            scaleLinear({
                range: [yMax, 0],
                domain: [0, (max(chartData, (d) => Math.max(d.primary, d.secondary)) || 0) * 1.2],
                nice: true,
            }),
        [yMax]
    );

    // Tooltip handler
    const handleTooltip = useCallback(
        (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
            if (!svgRef.current) return;
            const point = localPoint(svgRef.current, event);
            if (!point) return;

            const { x } = point;
            const x0 = xScale.invert(x);
            const index = bisectDate(chartData, x0, 1);
            const d0 = chartData[index - 1];
            const d1 = chartData[index];
            let d = d0;
            if (d1 && getDate(d1)) {
                d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
            }

            showTooltip({
                tooltipData: {
                    date: getDate(d),
                    primary: getPrimary(d),
                    secondary: getSecondary(d),
                },
                tooltipLeft: x,
                tooltipTop: yScale(getPrimary(d)),
            });
        },
        [showTooltip, yScale, xScale]
    );

    return (
        <div className="relative">
            <svg width={width} height={height} ref={svgRef}>
                <LinearGradient id="area-gradient" from="#ff5315" to="#ff5315" fromOpacity={0.4} toOpacity={0} />
                <LinearGradient id="line-gradient" from="#ff5315" to="#ffa300" />

                {/* Secondary Data (Before) */}
                <AreaClosed
                    data={chartData}
                    x={(d) => xScale(getDate(d)) ?? 0}
                    y={(d) => yScale(getSecondary(d)) ?? 0}
                    yScale={yScale}
                    strokeWidth={0}
                    curve={curveMonotoneX}
                    fill="#94a3b8"
                    fillOpacity={0.1}
                />
                <LinePath
                    data={chartData}
                    x={(d) => xScale(getDate(d)) ?? 0}
                    y={(d) => yScale(getSecondary(d)) ?? 0}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    curve={curveMonotoneX}
                    strokeDasharray="4,4"
                />

                {/* Primary Data (After) */}
                <AreaClosed
                    data={chartData}
                    x={(d) => xScale(getDate(d)) ?? 0}
                    y={(d) => yScale(getPrimary(d)) ?? 0}
                    yScale={yScale}
                    strokeWidth={0}
                    curve={curveMonotoneX}
                    fill="url(#area-gradient)"
                />
                <LinePath
                    data={chartData}
                    x={(d) => xScale(getDate(d)) ?? 0}
                    y={(d) => yScale(getPrimary(d)) ?? 0}
                    stroke="url(#line-gradient)"
                    strokeWidth={2}
                    curve={curveMonotoneX}
                />

                <Bar
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="transparent"
                    rx={14}
                    onTouchStart={handleTooltip}
                    onTouchMove={handleTooltip}
                    onMouseMove={handleTooltip}
                    onMouseLeave={() => hideTooltip()}
                />

                {tooltipData && (
                    <g transform={`translate(${tooltipLeft}, ${tooltipTop})`}>
                        <circle
                            cx={0}
                            cy={0}
                            r={4}
                            fill="#a855f7"
                            stroke="#fff"
                            strokeWidth={2}
                            pointerEvents="none"
                        />
                        <circle
                            cx={0}
                            cy={0}
                            r={4}
                            fill="#ff5315"
                            stroke="#fff"
                            strokeWidth={2}
                            pointerEvents="none"
                            className="animate-ping opacity-75"
                        />
                    </g>
                )}
            </svg>

            {tooltipData && (
                <TooltipWithBounds
                    top={tooltipTop - 12}
                    left={tooltipLeft + 12}
                    style={{
                        ...defaultStyles,
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }}
                >
                    <div className="font-serif text-xs text-white/60 mb-1">
                        {timeFormat('%b %d, %Y')(tooltipData.date)}
                    </div>
                    <div className="text-sm font-bold text-white mb-1">
                        {tooltipData.primary.toLocaleString()} Views
                    </div>
                    {tooltipData.secondary > 0 && (
                        <div className="text-xs text-white/40">
                            vs {tooltipData.secondary.toLocaleString()} (Prev)
                        </div>
                    )}
                </TooltipWithBounds>
            )}
        </div>
    );
});

const Dashboard = () => {
    return (
        <section className="w-full min-h-screen px-4 pt-32 pb-12 md:px-12 lg:px-24 relative z-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Dashboard
                    </h2>
                    <p className="text-lg text-white/60 font-serif italic">
                        A snapshot of how K-SHIFT has influenced client insights in the first month of working together.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 flex flex-col justify-between min-h-[200px]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl transition-all duration-500 group-hover:bg-purple-500/40"></div>

                        <div>
                            <h3 className="text-sm font-medium text-purple-300 uppercase tracking-wider mb-1 font-serif">Total Views</h3>
                            <p className="text-4xl font-bold text-white tracking-tight">274,069</p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-green-400 mt-6">
                            <span className="text-white/40 font-serif italic">Colossus Bread</span>
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+48%</span>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 flex flex-col justify-between min-h-[200px]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition-all duration-500 group-hover:bg-blue-500/40"></div>

                        <div>
                            <h3 className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-1 font-serif">Followers</h3>
                            <p className="text-4xl font-bold text-white tracking-tight">6,291</p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-green-400 mt-6">
                            <span className="text-white/40 font-serif italic">Jawny's</span>
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+72%</span>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20 flex flex-col justify-between min-h-[200px]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl transition-all duration-500 group-hover:bg-pink-500/40"></div>

                        <div>
                            <h3 className="text-sm font-medium text-pink-300 uppercase tracking-wider mb-1 font-serif">Reach</h3>
                            <p className="text-4xl font-bold text-white tracking-tight">85,182</p>
                        </div>

                        <div className="flex items-center justify-between text-sm text-green-400 mt-6">
                            <span className="text-white/40 font-serif italic">Panacea Regenerative</span>
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+69%</span>
                        </div>
                    </div>

                    {/* Large Card - Graph Placeholder */}
                    {/* Large Card - Graph Placeholder */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.01] hover:shadow-2xl hover:shadow-orange-500/20 flex flex-col justify-between min-h-[400px]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl transition-all duration-500 group-hover:bg-orange-500/40"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-sm font-medium text-orange-300 uppercase tracking-wider mb-1 font-serif">Total Views</h3>
                                <p className="text-4xl font-bold text-white tracking-tight">1.2M</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-white/40 font-serif italic text-sm">vs. Previous Period</span>
                                <span className="bg-green-400/10 text-green-400 px-2 py-1 rounded-full text-sm font-medium">+115%</span>
                            </div>
                        </div>

                        {/* Visx Chart */}
                        <div className="h-64 w-full relative z-10">
                            <ParentSize>
                                {({ width, height }) => <AnalyticsChart width={width} height={height} />}
                            </ParentSize>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <FlippableActivityCard />



                </div>
            </div>
        </section>
    );
};

export default Dashboard;

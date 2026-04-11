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
                        background: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)',
                        color: '#ffffff',
                        padding: '12px',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <div className="font-sans text-xs text-white/60 mb-1">
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
        <section className="w-full h-full px-4 sm:px-8 xl:px-12 pt-20 pb-16 relative z-10 bg-foreground flex flex-col justify-center items-center overflow-hidden">
            <div className="w-full max-w-7xl mx-auto h-full max-h-full flex flex-col justify-center">

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">

                    {/* Stat Card 1 */}
                    <div className="group relative bg-transparent p-3 sm:p-4 border border-white flex flex-col font-sans transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-500/10 blur-2xl transition-all duration-500 group-hover:bg-purple-500/20"></div>

                        <div className="relative z-10 flex flex-col h-full text-white">
                            <h2 className="text-3xl font-black tracking-tighter leading-none mb-1">COLOSSUS BREAD*</h2>
                            <div className="w-full h-[2px] bg-white"></div>
                            <div className="flex justify-between items-end py-1">
                                <span className="text-xs font-bold">Client Location</span>
                                <span className="text-xs font-bold text-right pl-2">Long Beach, San Pedro</span>
                            </div>
                            <div className="w-full h-[8px] bg-white mb-2"></div>

                            <span className="text-[10px] font-bold uppercase">VS. PREVIOUS PERIOD</span>
                            <div className="flex justify-between items-center mt-1 pb-1">
                                <span className="text-xl font-black leading-none">Reach†</span>
                                <span className="text-3xl font-black leading-none relative -top-[5px]">28,824</span>
                            </div>
                            <div className="w-full h-[1px] bg-white mb-1"></div>

                            <div className="flex justify-end pb-1">
                                <span className="text-[10px] font-bold uppercase">% Growth Value</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold">Period Increase¹</span>
                                <span className="text-sm font-black">+169%</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold">Period Length¹</span>
                                <span className="text-sm font-black">30 Days</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex flex-col py-1 text-[9px] sm:text-[10px] leading-tight opacity-90 gap-0.5">
                                <div className="flex items-start">
                                    <span className="w-2.5 shrink-0">*</span>
                                    <span>Colossus Bread is a woman-owned bakery specializing in sourdough bread and seasonal pastries.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="w-2.5 shrink-0">†</span>
                                    <span>Importantly, 31% of reach came from non-followers (+388%), indicating new audience discovery beyond the existing base.</span>
                                </div>
                            </div>
                            <div className="w-full h-[4px] bg-white"></div>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative bg-transparent p-3 sm:p-4 border border-white flex flex-col font-sans transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all duration-500 group-hover:bg-blue-500/20"></div>

                        <div className="relative z-10 flex flex-col h-full text-white">
                            <h2 className="text-3xl font-black tracking-tighter leading-none mb-1">JAWNY'S*</h2>
                            <div className="w-full h-[2px] bg-white"></div>
                            <div className="flex justify-between items-end py-1">
                                <span className="text-xs font-bold">Client Location</span>
                                <span className="text-xs font-bold text-right pl-2">Sherman Oaks</span>
                            </div>
                            <div className="w-full h-[8px] bg-white mb-2"></div>

                            <span className="text-[10px] font-bold uppercase">VS. PREVIOUS PERIOD</span>
                            <div className="flex justify-between items-center mt-1 pb-1">
                                <span className="text-xl font-black leading-none">Followers†</span>
                                <span className="text-3xl font-black leading-none relative -top-[5px]">6,291</span>
                            </div>
                            <div className="w-full h-[1px] bg-white mb-1"></div>

                            <div className="flex justify-end pb-1">
                                <span className="text-[10px] font-bold uppercase">% Growth Value</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold">Period Increase¹</span>
                                <span className="text-sm font-black">+72%</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold">Period Length¹</span>
                                <span className="text-sm font-black">30 Days</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex flex-col py-1 text-[9px] sm:text-[10px] leading-tight opacity-90 gap-0.5">
                                <div className="flex items-start">
                                    <span className="w-2.5 shrink-0">*</span>
                                    <span>A beloved Philly cheesesteak staple that grew from a local pop-up into a late-night brick-and-mortar destination.</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="w-2.5 shrink-0">†</span>
                                    <span>Current follower count (January 1st, 2026) is 116k with top cities being Sherman Oaks (23%) and Los Angeles (20%).</span>
                                </div>
                            </div>
                            <div className="w-full h-[4px] bg-white"></div>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative bg-transparent p-3 sm:p-4 border border-white flex flex-col font-sans transition-all duration-500 hover:shadow-2xl hover:shadow-pink-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-500/10 blur-2xl transition-all duration-500 group-hover:bg-pink-500/20"></div>

                        <div className="relative z-10 flex flex-col h-full text-white">
                            <h2 className="text-3xl font-black tracking-tighter leading-none mb-1">PANACEA REGENERATIVE*</h2>
                            <div className="w-full h-[2px] bg-white"></div>
                            <div className="flex justify-between items-end py-1">
                                <span className="text-xs font-bold">Client Location</span>
                                <span className="text-xs font-bold text-right pl-2">Beverly Hills</span>
                            </div>
                            <div className="w-full h-[8px] bg-white mb-2"></div>

                            <span className="text-[10px] font-bold uppercase">VS. PREVIOUS PERIOD</span>
                            <div className="flex justify-between items-center mt-1 pb-1">
                                <span className="text-xl font-black leading-none">Engagement†</span>
                                <span className="text-3xl font-black leading-none relative -top-[5px]">5,719</span>
                            </div>
                            <div className="w-full h-[1px] bg-white mb-1"></div>

                            <div className="flex justify-end pb-1">
                                <span className="text-[10px] font-bold uppercase">% Growth Value</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold">Period Increase¹</span>
                                <span className="text-sm font-black">321%</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex justify-between items-center py-1">
                                <span className="text-xs font-bold">Period Length¹</span>
                                <span className="text-sm font-black">30 Days</span>
                            </div>
                            <div className="w-full h-[1px] bg-white"></div>

                            <div className="flex flex-col py-1 text-[9px] sm:text-[10px] leading-tight opacity-90 gap-0.5">
                                <div className="flex items-start">
                                    <span className="w-2.5 shrink-0">*</span>
                                    <span>A leader in regenerative aesthetics, focused in advanced treatments that restore and revitalize aging or damaged tissue at the cellular level</span>
                                </div>
                                <div className="flex items-start">
                                    <span className="w-2.5 shrink-0">†</span>
                                    <span>Engagement represents the total number of interactions such as likes, comments, shares, and saves.</span>
                                </div>
                            </div>
                            <div className="w-full h-[4px] bg-white"></div>
                        </div>
                    </div>

                    {/* Large Card - Graph Placeholder */}
                    <div className="group col-span-1 md:col-span-2 lg:col-span-2 relative bg-transparent p-4 sm:p-5 border border-white flex flex-col font-sans transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 lg:min-h-[220px]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-orange-500/10 blur-3xl transition-all duration-500 group-hover:bg-orange-500/20"></div>

                            <div className="relative z-10 flex flex-col h-full text-white">
                                <h2 className="text-4xl font-black tracking-tighter leading-none mb-1">RETAINER MODEL*</h2>
                                <div className="w-full h-[2px] bg-white"></div>
                                <div className="flex justify-between items-end py-1">
                                    <span className="text-sm font-bold">Referenced Client</span>
                                    <span className="text-sm font-bold">COLOSSUS BREAD</span>
                                </div>
                                <div className="w-full h-[8px] bg-white mb-2"></div>

                                <span className="text-[10px] font-bold uppercase">VS. PREVIOUS PERIOD</span>
                                <div className="flex justify-between items-center mt-1 pb-1">
                                    <span className="text-3xl font-black leading-none">Total Views</span>
                                    <span className="text-5xl font-black leading-none relative -top-[9px]">1.2M</span>
                                </div>
                                <div className="w-full h-[1px] bg-white mb-1"></div>

                                <div className="flex justify-end pb-1">
                                    <span className="text-[10px] font-bold uppercase">% Growth Value*</span>
                                </div>
                                <div className="w-full h-[1px] bg-white"></div>

                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs font-bold">Period Increase¹</span>
                                    <span className="text-lg font-black">+115%</span>
                                </div>
                                <div className="w-full h-[1px] bg-white"></div>

                                <div className="flex justify-between items-center py-1">
                                    <span className="text-xs font-bold">Period Length¹</span>
                                    <span className="text-lg font-black">365 Days</span>
                                </div>
                                <div className="w-full h-[1px] bg-white"></div>

                                <div className="flex flex-col py-1 text-[9px] sm:text-[10px] leading-tight opacity-90 gap-0.5 mt-1 mb-1">
                                    <div className="flex items-start">
                                        <span className="w-2.5 shrink-0">*</span>
                                        <span>The retainer model allows us to implement a consistent, high-frequency content strategy necessary to align with social algorithms and drive a 115% growth to 1.2 million views by maintaining a constant brand presence that compounds audience reach over time.</span>
                                    </div>
                                    <div className="flex items-start">
                                        <span className="w-2.5 shrink-0">†</span>
                                        <span>Hover over the graph to compare current and previous period data (Desktop only).</span>
                                    </div>
                                </div>
                                <div className="w-full h-[4px] bg-white mb-2"></div>

                                <div className="flex-1 w-full relative z-10 min-h-[80px]">
                                    <ParentSize>
                                        {({ width, height }) => <AnalyticsChart width={width} height={height} />}
                                    </ParentSize>
                                </div>
                            </div>
                        </div>

                    {/* Activity Feed */}
                    <FlippableActivityCard />



                </div>
                
                {/* Global Dashboard Note */}
                <div className="flex flex-col text-[9px] sm:text-[10px] text-white/60 font-sans leading-tight text-left mt-3 sm:mt-4 px-1">
                    <div className="flex items-start">
                        <span>Note: All metrics are derived from Meta Business Suite and represent Instagram platform analytics.</span>
                        <span className="w-2.5 shrink-0 mx-1">¹</span>
                        <span>A period is defined as a specific fixed duration of time used as a benchmark to compare current performance against baseline data.</span>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Dashboard;

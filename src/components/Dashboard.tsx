import React from 'react';
import FlippableActivityCard from './FlippableActivityCard';

const Dashboard = () => {
    return (
        <section className="w-full min-h-screen px-4 py-12 md:px-12 lg:px-24 relative z-10">
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
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl transition-all duration-500 group-hover:bg-purple-500/40"></div>
                        <h3 className="text-sm font-medium text-purple-300 uppercase tracking-wider mb-2 font-serif">Total Views</h3>
                        <p className="text-4xl font-bold text-white mb-4">274,069</p>
                        <div className="flex items-center text-sm text-green-400">
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+48%</span>
                            <span className="ml-2 text-white/40 font-serif italic">Colossus Bread</span>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition-all duration-500 group-hover:bg-blue-500/40"></div>
                        <h3 className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-2 font-serif">Followers</h3>
                        <p className="text-4xl font-bold text-white mb-4">6,291</p>
                        <div className="flex items-center text-sm text-green-400">
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+72%</span>
                            <span className="ml-2 text-white/40 font-serif italic">Jawny's</span>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl transition-all duration-500 group-hover:bg-pink-500/40"></div>
                        <h3 className="text-sm font-medium text-pink-300 uppercase tracking-wider mb-2 font-serif">Reach</h3>
                        <p className="text-4xl font-bold text-white mb-4">85,182</p>
                        <div className="flex items-center text-sm text-green-400">
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+69%</span>
                            <span className="ml-2 text-white/40 font-serif italic">Panacea Regenerative</span>
                        </div>
                    </div>

                    {/* Large Card - Graph Placeholder */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white">Analytics Overview</h3>
                            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white/80 outline-none focus:border-white/30 font-serif">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>Last Year</option>
                            </select>
                        </div>

                        {/* Fake Graph Bars */}
                        <div className="flex items-end justify-between h-64 gap-2">
                            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                                <div key={i} className="w-full bg-white/5 rounded-t-lg relative overflow-hidden group-hover:bg-white/10 transition-all duration-500">
                                    <div
                                        style={{ height: `${height}%` }}
                                        className={`absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-white/10 to-white/40 transition-all duration-1000 ease-out delay-[${i * 50}ms] group-hover:to-white/60`}
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-xs text-white/40 uppercase tracking-wider font-serif">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
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

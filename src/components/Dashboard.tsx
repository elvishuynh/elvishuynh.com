import React from 'react';

const Dashboard = () => {
    return (
        <section className="w-full min-h-screen px-4 py-12 md:px-12 lg:px-24 relative z-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                        Dashboard
                    </h2>
                    <p className="text-lg text-white/60">
                        Overview of your creative performance.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Stat Card 1 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-500/20 blur-2xl transition-all duration-500 group-hover:bg-purple-500/40"></div>
                        <h3 className="text-sm font-medium text-purple-300 uppercase tracking-wider mb-2">Total Views</h3>
                        <p className="text-4xl font-bold text-white mb-4">2.4M</p>
                        <div className="flex items-center text-sm text-green-400">
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+12.5%</span>
                            <span className="ml-2 text-white/40">vs last month</span>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl transition-all duration-500 group-hover:bg-blue-500/40"></div>
                        <h3 className="text-sm font-medium text-blue-300 uppercase tracking-wider mb-2">Engagement</h3>
                        <p className="text-4xl font-bold text-white mb-4">84%</p>
                        <div className="flex items-center text-sm text-green-400">
                            <span className="bg-green-400/10 px-2 py-1 rounded-full">+5.2%</span>
                            <span className="ml-2 text-white/40">vs last month</span>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] hover:shadow-2xl hover:shadow-pink-500/20">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-pink-500/20 blur-2xl transition-all duration-500 group-hover:bg-pink-500/40"></div>
                        <h3 className="text-sm font-medium text-pink-300 uppercase tracking-wider mb-2">Active Users</h3>
                        <p className="text-4xl font-bold text-white mb-4">12.8K</p>
                        <div className="flex items-center text-sm text-red-400">
                            <span className="bg-red-400/10 px-2 py-1 rounded-full">-2.1%</span>
                            <span className="ml-2 text-white/40">vs last month</span>
                        </div>
                    </div>

                    {/* Large Card - Graph Placeholder */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-bold text-white">Analytics Overview</h3>
                            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white/80 outline-none focus:border-white/30">
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
                        <div className="flex justify-between mt-4 text-xs text-white/40 uppercase tracking-wider">
                            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                            <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="col-span-1 row-span-2 group relative overflow-hidden rounded-3xl bg-white/5 p-8 backdrop-blur-xl border border-white/10 transition-all duration-500 hover:bg-white/10">
                        <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                        <div className="space-y-6">
                            {[
                                { user: 'Alice M.', action: 'Uploaded a new asset', time: '2m ago', color: 'bg-blue-500' },
                                { user: 'Bob D.', action: 'Commented on Project X', time: '15m ago', color: 'bg-green-500' },
                                { user: 'Charlie', action: 'Started a new session', time: '1h ago', color: 'bg-purple-500' },
                                { user: 'Diana P.', action: 'Updated profile settings', time: '3h ago', color: 'bg-yellow-500' },
                                { user: 'Evan R.', action: 'Deployed to production', time: '5h ago', color: 'bg-red-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${item.color} shadow-[0_0_10px_currentColor]`}></div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">{item.user}</p>
                                        <p className="text-xs text-white/50">{item.action}</p>
                                    </div>
                                    <span className="text-xs text-white/30">{item.time}</span>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/5">
                            View All Activity
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default Dashboard;

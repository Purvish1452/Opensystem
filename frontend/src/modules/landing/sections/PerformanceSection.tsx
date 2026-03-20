import { Activity, FastForward, CheckCircle } from 'lucide-react';

const highlights = [
    {
        icon: <Activity className="w-6 h-6" />,
        stat: "100%",
        label: "Data Integrity",
        desc: "Automated compound indexing ensures your queries and searches are always lightning fast."
    },
    {
        icon: <FastForward className="w-6 h-6" />,
        stat: "Sub-ms",
        label: "Response Times",
        desc: "Aggressive optimization means instant rendering for critical team communication."
    },
    {
        icon: <CheckCircle className="w-6 h-6" />,
        stat: "24/7",
        label: "Availability",
        desc: "Designed to handle massive traffic spikes seamlessly during your most important launches."
    }
];

const PerformanceSection = () => {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-6">
                        Reliability at Any Scale
                    </h2>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-4">
                        Built for intense professional workloads. OpenSystems guarantees that whether you are working solo or coordinating a massive team effort, the platform never slows down.
                    </p>
                    <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                        Intelligent data routing, instant caching, and proactive abuse monitoring work silently in the background so you can focus 100% on building your next breakthrough.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    {highlights.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white mb-6">
                                {item.icon}
                            </div>
                            <div className="text-4xl sm:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-4">
                                {item.stat}
                            </div>
                            <div className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
                                {item.label}
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto text-sm sm:text-base">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-center gap-4 sm:gap-8">
                    {[
                        "Zero-Latency Sync",
                        "Continuous Abuse Monitoring",
                        "Smart Traffic Routing",
                        "Global Accessibility"
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800/50 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {feature}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PerformanceSection;

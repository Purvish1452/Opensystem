import { ArrowRight, ShieldCheck, Zap, Database, Activity, GitCommit } from 'lucide-react';

const highlights = [
    {
        icon: <GitCommit className="w-5 h-5 text-zinc-900 dark:text-white" />,
        text: "Clean Controller → Service → Model Separation"
    },
    {
        icon: <Activity className="w-5 h-5 text-zinc-900 dark:text-white" />,
        text: "Non-blocking Activity Logs"
    },
    {
        icon: <ShieldCheck className="w-5 h-5 text-zinc-900 dark:text-white" />,
        text: "Abuse Pattern Detection"
    },
    {
        icon: <Database className="w-5 h-5 text-zinc-900 dark:text-white" />,
        text: "Compound Index Optimized Queries"
    },
    {
        icon: <Zap className="w-5 h-5 text-zinc-900 dark:text-white" />,
        text: "Denormalized Vote Scoring for Performance"
    }
];

const SystemFlowSection = () => {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center">
                    {/* Left Typography Side */}
                    <div className="w-full lg:w-1/2">
                        <h2 className="text-3xl sm:text-4xl text-zinc-900 dark:text-white font-bold leading-tight mb-6">
                            Engineered Request Lifecycle
                        </h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                            How we achieve uncompromised runtime security: Every interaction within OpenSystems follows a deterministic flow to protect user privacy.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mb-8 font-mono text-sm text-zinc-800 dark:text-zinc-300 bg-white dark:bg-black p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <span>User</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Authentication</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Middleware Layer</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Validation</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Service Layer</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Database</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Activity Logging</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                            <span>Response</span>
                        </div>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            No direct model access from controllers. No unvalidated input reaches the database. Every mutation is logged asynchronously without slowing the user experience.
                        </p>
                    </div>

                    {/* Right Highlights Side */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-4">
                        {highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    {highlight.icon}
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {highlight.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SystemFlowSection;

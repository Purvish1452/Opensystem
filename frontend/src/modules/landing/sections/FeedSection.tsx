import FloatingLines from '../../../components/ui/FloatingLines';

const FeedSection = () => {
    return (
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#060010]">
            {/* Absolute Background using FloatingLines */}
            <div className="absolute inset-0 z-0 opacity-80 pointer-events-auto">
                <FloatingLines
                    linesGradient={['#3b82f6', '#8b5cf6', '#a855f7']}
                    animationSpeed={1.5}
                    interactive={true}
                    bendRadius={3.0}
                    bendStrength={-4.0}
                />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">

                    {/* Visual Placeholder (Right on desktop, Top on mobile via DOM order) */}
                    <div className="w-full md:w-1/2 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 flex flex-col gap-4 shadow-xl">
                        <h4 className="font-semibold text-zinc-900 dark:text-white mb-2 text-xl">The Features</h4>
                        <ul className="space-y-4">
                            {[
                                "Multimedia & Code Snippet Delivery",
                                "Idempotent Upvote / Downvote Engagement",
                                "Deep Nested Comment Trees (Depth Controlled)",
                                "Strict Privacy Controls (Public · Private · Followers)",
                                "Personal Feed Hiding & Content Muting",
                                "Automated Moderation Flags & Reporting",
                                "Denormalized Fast-Track Trending Algorithm"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-sm sm:text-base font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Content (Left on desktop) */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center order-first md:order-last">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-300 mb-6 w-max border border-zinc-200 dark:border-zinc-700">
                            High-Engagement Problem Discovery
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">
                            The Problem Feed Engine
                        </h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                            Connect with a global network of IT professionals and ambitious students. The Problem Feed is your central hub for discovering real-world technical challenges and system-level ideation.
                        </p>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                            Engage meaningfully through nested technical discussions, share multimedia code snippets, and curate your experience with strict privacy tools. Upvote the best solutions to fast-track trending innovations.
                        </p>
                        <p className="text-lg font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed mb-8">
                            More than just a social timeline—it is a structured, professional environment designed to accelerate your technical expertise through collaborative problem-solving.
                        </p>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FeedSection;

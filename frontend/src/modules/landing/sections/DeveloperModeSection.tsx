import { GridScan } from '../../../components/ui/GridScan';

const DeveloperModeSection = () => {
    return (
        <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-white overflow-hidden bg-black min-h-screen flex items-center border-y border-zinc-800">

            {/* GridScan Background Component (Opaque) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <GridScan
                    enableWebcam={false}
                    showPreview={false}
                    scanColor="#10b981"
                    linesColor="#18181b"
                    bloomIntensity={2}
                    scanOpacity={0.5}
                    gridScale={0.15}
                    className=""
                    style={{}}
                />
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

            <div className="max-w-7xl mx-auto relative z-10 w-full">
                <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">

                    {/* Content (Left side desktop layout) */}
                    <div className="w-full md:w-1/2 flex flex-col justify-center">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-sm font-medium text-zinc-300 mb-6 w-max border border-zinc-700 shadow-md">
                            Structured Collaboration Environments
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight">
                            Developer Mode
                        </h2>
                        <p className="text-lg text-zinc-400 leading-relaxed mb-4">
                            Transform loose ideas into focused, real-world development spaces. Developer Mode is built for IT professionals and students who want to move beyond chatting and start building.
                        </p>
                        <p className="text-lg text-zinc-400 leading-relaxed mb-8">
                            Create dedicated project workspaces, manage team enrollments, and collaborate securely with controlled member permissions. It's the perfect environment to scale your prototype or portfolio piece with an organized team.
                        </p>
                        <div className="flex flex-col gap-4">
                            {[
                                "Launch & Scale Project Workspaces",
                                "Manage Team Enrollment Requests",
                                "Assign Creator & Member Roles",
                                "Control Privacy & Access Thresholds",
                                "Secure, Recoverable Project Data",
                                "Collaborative Code & Resource Sharing",
                                "Built-in Protection Against Spam"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-zinc-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dark Mode Terminal Visual Placeholder */}
                    <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 flex flex-col font-mono text-xs sm:text-sm">
                        <div className="h-10 border-b border-zinc-800 flex items-center px-4 gap-2 bg-zinc-900">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                            <span className="ml-4 text-zinc-400">api-client.ts</span>
                        </div>
                        <div className="p-6 text-zinc-300 flex-1 flex flex-col gap-2 opacity-80">
                            <div className="text-zinc-400">// Intercept 401 Unauthorized globally</div>
                            <div>
                                <span className="text-pink-400">apiClient</span>.interceptors.response.<span className="text-blue-400">use</span>(
                            </div>
                            <div className="pl-4">
                                (response) =&gt; response,
                            </div>
                            <div className="pl-4">
                                <span className="text-amber-400">async</span> (error) =&gt; {'{'}
                            </div>
                            <div className="pl-8">
                                <span className="text-purple-400">if</span> (error.response?.status === <span className="text-emerald-400">401</span>) {'{'}
                            </div>
                            <div className="pl-12 text-zinc-400">// Trigger silent refresh logic</div>
                            <div className="pl-12">
                                <span className="text-purple-400">return</span> applyRefreshPath(error.config);
                            </div>
                            <div className="pl-8">{'}'}</div>
                            <div className="pl-8">
                                <span className="text-purple-400">return</span> <span className="text-pink-400">Promise</span>.reject(error);
                            </div>
                            <div className="pl-4">{'}'}</div>
                            <div>);</div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default DeveloperModeSection;

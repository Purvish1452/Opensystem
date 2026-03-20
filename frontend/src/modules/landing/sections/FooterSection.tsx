import { Link } from 'react-router-dom';
import { LaserFlow } from '../../../components/ui/LaserFlow';

const FooterSection = () => {
    return (
        <footer className="relative bg-[#060010] text-white pt-32 pb-12 overflow-hidden min-h-[600px] flex flex-col justify-end border-t border-zinc-900">
            {/* LaserFlow Background - Perfectly Centered and Enhanced */}
            <div className="absolute inset-x-0 bottom-[-15%] z-0 pointer-events-none opacity-100 flex items-end justify-center">
                <div className="w-full max-w-6xl h-[700px] flex items-end justify-center">
                    <LaserFlow
                        wispDensity={1.25}
                        flowSpeed={0.35}
                        fogIntensity={0.75}
                        verticalSizing={2.8}
                        horizontalSizing={0.6}
                        color="#ffffff" // Clean white to match the screenshot
                        className="w-full h-full"
                        style={{}}
                        dpr={typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1}
                    />
                </div>
            </div>
            {/* Gradient Masks */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-transparent via-[#060010]/50 to-[#060010] pointer-events-none" />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-8 mb-24">
                    {/* Brand Column */}
                    <div className="flex-1 space-y-4 max-w-sm">
                        <Link to="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2 group">
                            <svg className="w-8 h-8 text-indigo-500 group-hover:text-indigo-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="9" y1="21" x2="9" y2="9" />
                            </svg>
                            OpenSystems
                        </Link>
                        <p className="max-w-xs text-sm text-zinc-400 leading-relaxed">
                            A production-grade platform where engineers collaborate on real problems, build structured projects, and scale prototypes into production.
                        </p>
                    </div>

                    {/* QuickLinks: Product */}
                    <div className="flex gap-16 md:gap-24">
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Platform</h3>
                            <ul className="space-y-4">
                                <li><Link to="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">Problem Feed</Link></li>
                                <li><Link to="#architecture" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">Architecture</Link></li>
                                <li><Link to="#developer-mode" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">Developer Mode</Link></li>
                                <li><Link to="#security" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">Security & Privacy</Link></li>
                            </ul>
                        </div>

                        {/* QuickLinks: Resources */}
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Resources</h3>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">Documentation</a></li>
                                <li><a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">API Reference</a></li>
                                <li><a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">System Status</a></li>
                                <li><a href="#" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-200 drop-shadow-md">Github</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-zinc-500">
                        &copy; {new Date().getFullYear()} OpenSystems. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;

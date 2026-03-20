import { Link } from 'react-router-dom';

const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="max-w-4xl mx-auto text-center z-10">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-6 sm:mb-8">
                    OpenSystems — Built for IT Professionals & Students.
                </h1>
                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-zinc-300 mb-6">
                    A comprehensive platform where tech enthusiasts collaborate on real-world challenges, build structured projects, and accelerate their careers in a secure, hyper-connected ecosystem.
                </p>
                <p className="max-w-2xl mx-auto text-md sm:text-lg font-medium text-zinc-400 mb-10 sm:mb-12">
                    Empowering your journey with advanced problem-solving feeds, intelligent collaboration tools, and enterprise-grade security.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                    <Link
                        to="/register"
                        className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 rounded-full transition-colors"
                    >
                        Explore the Platform
                    </Link>
                    <a
                        href="#architecture"
                        className="w-full sm:w-auto inline-flex justify-center items-center px-8 py-4 text-base font-semibold text-zinc-900 bg-transparent border-2 border-zinc-200 hover:border-zinc-300 dark:text-zinc-100 dark:border-zinc-800 dark:hover:border-zinc-700 rounded-full transition-colors"
                    >
                        View Architecture
                    </a>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;

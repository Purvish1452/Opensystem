import { Link } from 'react-router-dom';

const FinalCTASection = () => {
    return (
        <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-8">
                    Your Next Big Idea Starts Here.
                </h2>
                <p className="text-xl text-zinc-300 max-w-3xl mx-auto mb-4 font-medium">
                    OpenSystems is the definitive space for IT professionals and ambitious students to connect, learn, and build.
                </p>
                <p className="text-lg text-zinc-400 max-w-3xl mx-auto mb-10">
                    Join a global community of engineers taking their ideas from concepts to scalable, real-world production.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
                    <Link
                        to="/register"
                        className="w-full sm:w-auto px-8 py-4 text-center rounded-full text-zinc-900 bg-white hover:bg-zinc-100 font-semibold transition-colors"
                    >
                        Join OpenSystems
                    </Link>
                    <a
                        href="#architecture"
                        className="w-full sm:w-auto px-8 py-4 text-center rounded-full text-zinc-100 bg-transparent border-2 border-zinc-800 hover:border-zinc-700 font-semibold transition-colors"
                    >
                        Explore Developer Mode
                    </a>
                </div>

                <div className="pt-8 border-t border-zinc-800">
                    <p className="text-sm font-medium text-zinc-500">
                        OpenSystems — Where IT Professionals and Students Collaborate.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FinalCTASection;

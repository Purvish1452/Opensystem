import { Database, ShieldCheck, Cpu } from 'lucide-react';

const specs = [
    {
        icon: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
        title: "Invisible Security",
        desc: "Advanced token strategies keep you securely authenticated without exposing your session to vulnerabilities."
    },
    {
        icon: <Cpu className="w-5 h-5 text-emerald-500" />,
        title: "Seamless Experience",
        desc: "Continuous, uninterrupted workflow. Silently renewing sessions mean you never lose your progress."
    },
    {
        icon: <Database className="w-5 h-5 text-amber-500" />,
        title: "Flawless Data Integrity",
        desc: "Everything you submit is instantly validated against strict rules, ensuring smooth professional interactions."
    }
];

const FrontendEngineeringSection = () => {
    return (
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center">

                    {/* Left Typography Side */}
                    <div className="w-full lg:w-1/2">
                        <h2 className="text-3xl sm:text-4xl text-zinc-900 dark:text-white font-bold leading-tight mb-6">
                            A Seamless, Secure Interface
                        </h2>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                            OpenSystems delivers an intuitively fast and incredibly secure user experience. Whether you are an IT student networking for the first time or a seasoned professional managing a complex team project, our interface gets out of your way.
                        </p>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                            Behind the clean design is a military-grade security layer protecting your sessions, actively securing your personal data, and preserving the integrity of your hard work from the moment you log in.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-700 dark:text-zinc-300">
                            {[
                                "Uninterrupted Workflow",
                                "Lightning Fast Navigation",
                                "Military-Grade Session Defense",
                                "Intelligent Data Protection"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    <span className="text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Tech Specs Side */}
                    <div className="w-full lg:w-1/2 flex flex-col gap-6">
                        {specs.map((spec, index) => (
                            <div key={index} className="flex gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        {spec.icon}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                                        {spec.title}
                                    </h4>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
                                        {spec.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
};

export default FrontendEngineeringSection;

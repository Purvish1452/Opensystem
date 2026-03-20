import { Shield, Key, FileCheck, Activity, Users, AlertTriangle, Trash2, Clock } from 'lucide-react';
import GridMotion from '../../../components/ui/GridMotion';

const features = [
    {
        icon: <Key className="w-6 h-6" />,
        title: "Zero-Knowledge Sessions",
        description: "Your data stays yours. Advanced JWT session management ensures authentication tokens are invisible to malicious scripts."
    },
    {
        icon: <Shield className="w-6 h-6" />,
        title: "Hardware-Isolated Security",
        description: "Enterprise-grade protection. Multi-device session tracking with immediate remote invalidation protects your account access globally."
    },
    {
        icon: <FileCheck className="w-6 h-6" />,
        title: "Strict Data Contracts",
        description: "Reliable interactions. Joi and Zod validation guarantees that all data exchanged is perfectly structured and secure."
    },
    {
        icon: <Activity className="w-6 h-6" />,
        title: "Immutable Auditing",
        description: "Complete transparency. Permanent, non-blocking activity logs create an unbreakable trail for all critical project actions."
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Role-Based Governance",
        description: "Structured collaboration. Granular control across User, Moderator, and Admin permission levels to keep teams organized."
    },
    {
        icon: <AlertTriangle className="w-6 h-6" />,
        title: "Automated Privacy Defense",
        description: "Proactive safety. Fast rate-limiting and anti-spam moderation queues ensure a clean, focused, and professional environment."
    },
    {
        icon: <Trash2 className="w-6 h-6" />,
        title: "Non-Destructive Deletion",
        description: "Data integrity preserved. Soft-delete architecture gives you control over your content while maintaining system relationships."
    },
    {
        icon: <Clock className="w-6 h-6" />,
        title: "Production-Ready Scaling",
        description: "Always available. Context-aware throttling shields the platform during high traffic so you can work without interruption."
    }
];

const ArchitectureSection = () => {
    return (
        <section className="relative w-full overflow-hidden py-16 sm:py-32">
            <div className="relative z-10 w-full flex flex-col items-center">

                {/* Frosted Glass Text Header so background remains visible */}
                <div className="max-w-4xl mx-auto px-6 py-10 sm:py-12 rounded-[2rem] bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-zinc-200/60 dark:border-white/10 mb-12 sm:mb-20 text-center relative z-20 shadow-2xl">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight drop-shadow-sm">
                        Enterprise-Grade Security & Privacy
                    </h2>
                    <p className="text-lg text-zinc-800 dark:text-zinc-200 max-w-3xl mx-auto leading-relaxed mb-4">
                        We prioritize military-grade security and absolute user privacy, ensuring that IT professionals and students can collaborate without compromising their data.
                    </p>
                    <p className="text-lg text-zinc-800 dark:text-zinc-200 max-w-3xl mx-auto leading-relaxed">
                        Every interaction is validated, strictly sanitized, and governed by robust role-based access controls. Your intellectual property is protected in a highly transparent, auditable infrastructure.
                    </p>
                </div>

                <div className="w-full relative z-10 flex justify-center -mt-6 sm:-mt-10">
                    <GridMotion items={features} />
                </div>
            </div>
        </section>
    );
};

export default ArchitectureSection;

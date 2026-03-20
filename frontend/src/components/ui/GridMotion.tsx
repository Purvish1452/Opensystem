import type { ReactNode } from 'react';
import './GridMotion.css';

export interface GridMotionItem {
    icon?: ReactNode;
    title: string;
    description?: string;
}

interface GridMotionProps {
    items: GridMotionItem[];
}

const RowContent = ({ data }: { data: GridMotionItem[] }) => {
    return (
        <div className="flex gap-4 md:gap-6 pr-4 md:pr-6 flex-shrink-0">
            {data.map((content, idx) => (
                <div key={idx} className="group relative w-[240px] h-[130px] sm:w-[280px] sm:h-[150px] md:w-[320px] md:h-[160px] flex-shrink-0 rounded-[1.25rem] bg-zinc-900/40 backdrop-blur-xl border border-white/5 hover:border-purple-500/50 transition-all duration-500 overflow-hidden cursor-pointer shadow-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    {/* Inner glowing effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-purple-500/20 via-transparent to-emerald-500/20" />

                    <div className="relative z-10 flex flex-col items-center justify-center p-4 md:p-6 h-full text-center group-hover:-translate-y-1 transition-transform duration-500">
                        <div className="mb-2 md:mb-3 text-zinc-400 group-hover:text-emerald-400 transition-colors duration-300 group-hover:scale-110 transform">
                            {content.icon}
                        </div>
                        <h4 className="text-white font-semibold text-sm md:text-base lg:text-lg mb-1 md:mb-2">
                            {content.title}
                        </h4>
                        <p className="text-zinc-500 group-hover:text-zinc-300 transition-colors duration-300 text-[10px] sm:text-xs md:text-sm line-clamp-2">
                            {content.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const GridMotion = ({ items = [] }: GridMotionProps) => {
    // Fill array so there's enough items to loop seamlessly
    const expandedItems = [...items, ...items, ...items];
    const mid = Math.ceil(expandedItems.length / 2);

    // We will alternate the items across 4 rows
    const row1Items = [...expandedItems.slice(0, mid), ...expandedItems.slice(mid)];
    const row2Items = [...expandedItems.slice(mid), ...expandedItems.slice(0, mid)];
    const row3Items = [...row1Items].reverse();
    const row4Items = [...row2Items].reverse();

    return (
        <div className="relative w-full overflow-hidden h-[650px] sm:h-[750px] md:h-[800px] flex items-center justify-center select-none pointer-events-auto">
            {/* Ambient Background Glow for the Grid Section */}
            <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen overflow-hidden">
                <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2" />
                <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[90px] -translate-y-1/2" />
            </div>

            {/* Grid Container tilted slightly for that dimensional feel */}
            <div className="relative z-10 flex flex-col gap-4 md:gap-6 transform -rotate-12 scale-[1.1] md:scale-[1.15] origin-center w-[200vw] -translate-x-[30vw] md:-translate-x-[20vw] mt-[50px]">
                {/* Row 1: scrolling left */}
                <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused] ml-[50px] md:ml-[100px]">
                    <RowContent data={row1Items} />
                    <RowContent data={row1Items} />
                </div>
                {/* Row 2: scrolling right (using reverse animation offset) */}
                <div className="flex w-max animate-marquee-right hover:[animation-play-state:paused] -ml-[100px] md:-ml-[200px]">
                    <RowContent data={row2Items} />
                    <RowContent data={row2Items} />
                </div>
                {/* Row 3: scrolling left */}
                <div className="flex w-max animate-marquee-left hover:[animation-play-state:paused] ml-[150px] md:ml-[300px]">
                    <RowContent data={row3Items} />
                    <RowContent data={row3Items} />
                </div>
                {/* Row 4: scrolling right (using reverse animation offset) */}
                <div className="flex w-max animate-marquee-right hover:[animation-play-state:paused] -ml-[200px] md:-ml-[400px]">
                    <RowContent data={row4Items} />
                    <RowContent data={row4Items} />
                </div>
            </div>

            {/* Front vignette overlay to blend edges into transparent bg */}
            <div className="absolute inset-x-0 top-0 h-24 sm:h-32 bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-black via-black/50 to-transparent pointer-events-none z-20" />
            <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-black via-black/50 to-transparent pointer-events-none z-20" />
        </div>
    );
};

export default GridMotion;

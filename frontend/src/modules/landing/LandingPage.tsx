import ColorBends from '../../components/bg/ColorBends';
import HeroSection from './sections/HeroSection';
import ArchitectureSection from './sections/ArchitectureSection';
import SystemFlowSection from './sections/SystemFlowSection';
import FrontendEngineeringSection from './sections/FrontendEngineeringSection';
import FeedSection from './sections/FeedSection';
import DeveloperModeSection from './sections/DeveloperModeSection';
import PerformanceSection from './sections/PerformanceSection';
import FinalCTASection from './sections/FinalCTASection';
import FooterSection from './sections/FooterSection';

const LandingPage = () => {
    return (
        <div className="relative min-h-screen w-full">
            {/* Background Layer - Fixed behind all content */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <ColorBends
                    className="w-full h-full"
                    colors={['#6e26fa', '#ff8afa', '#5dfa3d']}
                    transparent={true}
                    speed={0.2}
                    frequency={1.5}
                    noise={0.1}
                    mouseInfluence={1.5}
                />
            </div>

            {/* Semantic Content Layer */}
            <div className="relative z-10 w-full">
                <header>
                    <HeroSection />
                </header>

                <main>
                    <div id="architecture">
                        <ArchitectureSection />
                    </div>

                    <SystemFlowSection />

                    <FrontendEngineeringSection />

                    <FeedSection />

                    <DeveloperModeSection />

                    <PerformanceSection />
                </main>

                <footer>
                    <FinalCTASection />
                    <FooterSection />
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;

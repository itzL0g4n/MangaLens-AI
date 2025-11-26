import React, { useEffect, useState } from 'react';
import { ArrowRight, Languages, MessageCircle, BrainCircuit, Wand2, Zap } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

const FEATURES = [
    {
        icon: <Languages className="w-6 h-6 text-indigo-400" />,
        title: "Smart Translate",
        desc: "Instant overlay translation preserving original art structure."
    },
    {
        icon: <BrainCircuit className="w-6 h-6 text-pink-400" />,
        title: "Context Aware",
        desc: "Understands deep lore and character relationships for accuracy."
    },
    {
        icon: <MessageCircle className="w-6 h-6 text-purple-400" />,
        title: "Lore Chat",
        desc: "Discuss plot twists with an AI that knows every chapter."
    },
    {
        icon: <Wand2 className="w-6 h-6 text-cyan-400" />,
        title: "Art Studio",
        desc: "Generate high-fidelity manga panels and concepts instantly."
    }
];

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const handleEnter = () => {
        setIsExiting(true);
        // Delay unmounting to allow animation to play
        setTimeout(() => {
            onEnter();
        }, 800);
    };

    return (
        <div className={`h-screen w-screen bg-stone-950 relative overflow-hidden flex flex-col items-center justify-center selection:bg-indigo-500/30 transition-all duration-1000 ease-in-out ${isExiting ? 'opacity-0 scale-[1.5] filter blur-2xl pointer-events-none' : 'opacity-100 scale-100'}`}>
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 20px -5px rgba(99, 102, 241, 0.3); }
                    50% { box-shadow: 0 0 40px -5px rgba(99, 102, 241, 0.6); }
                }
                @keyframes shimmer-slide {
                    0% { transform: translateX(-100%) skewX(-15deg); }
                    100% { transform: translateX(200%) skewX(-15deg); }
                }
                @keyframes text-shine {
                    0% { background-position: 200% center; }
                    100% { background-position: -200% center; }
                }
                @keyframes particle-rise {
                    0% { transform: translateY(120vh) translateX(0); opacity: 0; }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.3; }
                    100% { transform: translateY(-20vh) translateX(20px); opacity: 0; }
                }
                @keyframes scroll-belt {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-25%); }
                }
                .animate-text-shine {
                    background-size: 200% auto;
                    animation: text-shine 5s linear infinite;
                }
                .particle {
                    position: absolute;
                    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%);
                    border-radius: 50%;
                    pointer-events: none;
                }
                .conveyor-track {
                    animation: scroll-belt 40s linear infinite;
                }
                .conveyor-track:hover {
                    animation-play-state: paused;
                }
                .mask-fade-sides {
                    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
                }
            `}</style>

            {/* Liquid Background Orbs - Accelerate on exit */}
            <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-1000 ${isExiting ? 'scale-125' : 'scale-100'}`}>
                 <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse mix-blend-screen" style={{ animationDuration: '8s' }} />
                 <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-purple-600/20 rounded-full blur-[120px] animate-pulse mix-blend-screen" style={{ animationDuration: '10s', animationDelay: '1s' }} />
                 <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-pink-600/10 rounded-full blur-[100px] animate-bounce mix-blend-screen" style={{ animationDuration: '20s' }} />
            </div>

            {/* Particle System */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {[...Array(15)].map((_, i) => (
                    <div 
                        key={i}
                        className="particle"
                        style={{
                            left: `${Math.random() * 100}%`,
                            width: `${Math.random() * 6 + 2}px`,
                            height: `${Math.random() * 6 + 2}px`,
                            animation: `particle-rise ${Math.random() * 10 + 10}s linear infinite`,
                            animationDelay: `-${Math.random() * 10}s`
                        }}
                    />
                ))}
            </div>

            <div className={`relative z-10 w-full flex flex-col items-center text-center transition-all duration-1000 ${isVisible && !isExiting ? 'opacity-100 translate-y-0' : (isExiting ? '' : 'opacity-0 translate-y-10')}`}>
                
                {/* Hero Content */}
                <div className="mb-12 flex flex-col items-center px-6">
                    <div className="mb-10 relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700" style={{ animation: 'pulse-glow 4s infinite' }} />
                        <div className="relative w-24 h-24 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:border-white/20">
                             <span className="text-4xl font-black bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">ML</span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-bold text-white mb-6 tracking-tight relative">
                        MangaLens <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400 animate-text-shine">AI</span>
                    </h1>
                    
                    <p className="text-lg md:text-2xl text-stone-400 max-w-2xl leading-relaxed font-light">
                        Experience manga through a liquid interface.
                        <br className="hidden md:block" />
                        Translate, analyze, and create with unmatched fluidity.
                    </p>
                </div>

                {/* Conveyor Belt Section */}
                <div className="w-full mb-16 overflow-hidden mask-fade-sides py-8">
                    <div className="flex w-max conveyor-track gap-6 px-6">
                        {/* Duplicate the set 4 times for infinite loop on large screens */}
                        {[...FEATURES, ...FEATURES, ...FEATURES, ...FEATURES].map((feature, i) => (
                            <FeatureCard 
                                key={i}
                                icon={feature.icon}
                                title={feature.title}
                                desc={feature.desc}
                            />
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <button 
                    onClick={handleEnter}
                    className="group relative px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-full backdrop-blur-xl transition-all duration-300 flex items-center gap-4 overflow-hidden hover:shadow-[0_0_50px_-10px_rgba(99,102,241,0.3)]"
                >
                    <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" style={{ animation: 'shimmer-slide 3s infinite' }} />
                    <span className="text-white font-bold text-lg tracking-wide z-10">Enter Experience</span>
                    <ArrowRight className="w-5 h-5 text-white z-10 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Footer Tech */}
                <div className="mt-12 flex items-center gap-2 text-[10px] font-bold text-stone-600 uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                    <Zap className="w-3 h-3 text-yellow-500/50" />
                    Powered by Gemini 2.5 Flash & 3 Pro
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => {
    return (
        <div 
            className="
                w-80 md:w-96 flex-shrink-0
                p-8 rounded-[2rem] bg-white/[0.03] border border-white/[0.05] backdrop-blur-md
                flex flex-col items-start text-left gap-5
                transition-all duration-300
                hover:bg-white/[0.08] hover:border-white/20 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1
                group cursor-default
            "
        >
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform duration-500 group-hover:bg-white/10 shadow-lg shadow-black/20">
                {icon}
            </div>
            <div>
                <h3 className="text-white font-bold text-xl mb-3 group-hover:text-indigo-200 transition-colors">{title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed group-hover:text-stone-300 transition-colors">{desc}</p>
            </div>
        </div>
    );
}

export default LandingPage;
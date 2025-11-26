import React from 'react';
import { ArrowRight, BookOpen, MessageCircle, Sparkles } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    return (
        <div className="h-screen w-screen bg-stone-950 relative overflow-hidden flex flex-col">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-indigo-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[4s]"></div>
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[5s]"></div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden z-10 custom-scrollbar">
                <div className="min-h-full flex flex-col items-center justify-center py-12 md:py-6 px-4 md:px-6">
                    
                    {/* Hero Section */}
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="mb-6 md:mb-8 relative group cursor-default">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-500"></div>
                            <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center text-white font-bold text-4xl md:text-5xl tracking-tighter transform transition-transform group-hover:scale-105 duration-300">
                                ML
                            </div>
                        </div>

                        <h1 className="text-4xl md:text-7xl font-bold text-white mb-4 md:mb-6 tracking-tight leading-tight">
                            MangaLens <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">AI</span>
                        </h1>
                        
                        <p className="text-base md:text-xl text-stone-400 mb-8 md:mb-12 max-w-xl md:max-w-2xl leading-relaxed">
                            Experience manga like never before. Instant AI translation with context awareness and character consistency.
                        </p>

                        {/* Feature Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl mb-10 md:mb-16">
                            <FeatureCard 
                                icon={<BookOpen className="w-6 h-6 md:w-8 md:h-8 text-indigo-400" />}
                                title="Smart Translate"
                                desc="Reads PDF, EPUB, CBZ & Images. Retains formatting & bubbles."
                            />
                            <FeatureCard 
                                icon={<MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-pink-400" />}
                                title="Lore Chat"
                                desc="Deep dive into plots and characters with an expert AI companion."
                            />
                        </div>

                        {/* CTA Button */}
                        <button 
                            onClick={onEnter}
                            className="group relative px-8 py-4 bg-white text-stone-950 rounded-full font-bold text-lg flex items-center gap-3 transition-all hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-95"
                        >
                            <span className="relative z-10">Launch App</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 md:mt-16 text-stone-600 text-xs flex gap-4">
                        <span className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity cursor-help">
                            <Sparkles className="w-3 h-3" /> Powered by Gemini 2.5 Flash & 3 Pro
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="bg-stone-900/50 border border-stone-800 p-5 md:p-6 rounded-2xl flex flex-col items-center text-center backdrop-blur-sm transition-all hover:bg-stone-900/80 hover:border-stone-700 hover:-translate-y-1">
        <div className="mb-3 md:mb-4 p-3 bg-stone-950 rounded-xl shadow-lg ring-1 ring-white/5">
            {icon}
        </div>
        <h3 className="text-white font-bold mb-2 text-sm md:text-base">{title}</h3>
        <p className="text-stone-500 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
);

export default LandingPage;
import React, { useState } from 'react';
import { BookOpen, MessageCircle, Wand2 } from 'lucide-react';
import MangaTranslator from './components/MangaTranslator';
import ChatBot from './components/ChatBot';
import ImageGenerator from './components/ImageGenerator';
import LandingPage from './components/LandingPage';
import { ViewState } from './types';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);

    const renderContent = () => {
        switch (currentView) {
            case ViewState.LANDING:
                return <LandingPage onEnter={() => setCurrentView(ViewState.TRANSLATOR)} />;
            case ViewState.TRANSLATOR:
                return <MangaTranslator />;
            case ViewState.CHAT:
                return <ChatBot />;
            case ViewState.IMAGE_GEN:
                return <ImageGenerator />;
            default:
                return <LandingPage onEnter={() => setCurrentView(ViewState.TRANSLATOR)} />;
        }
    };

    if (currentView === ViewState.LANDING) {
        return renderContent();
    }

    return (
        <>
            <style>{`
                @keyframes liquid-entry {
                    0% { opacity: 0; transform: scale(0.95) translateY(10px); filter: blur(10px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                }
                .animate-liquid-entry {
                    animation: liquid-entry 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                /* Mobile Padding Utility */
                @media (max-width: 768px) {
                    .pb-safe-nav {
                        padding-bottom: 5rem;
                    }
                }
            `}</style>
            
            {/* Desktop Layout */}
            <div className="hidden md:flex h-screen w-screen bg-stone-950 text-stone-100 font-sans selection:bg-indigo-500/30 animate-liquid-entry">
                {/* Sidebar Dock */}
                <nav className="w-24 flex flex-col items-center py-8 bg-stone-900/50 backdrop-blur-xl border-r border-white/5 shadow-2xl z-50">
                    <div className="mb-12 cursor-pointer transition-transform hover:scale-110 active:scale-95" onClick={() => setCurrentView(ViewState.LANDING)}>
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-xl tracking-tighter">
                            ML
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 w-full px-4">
                        <NavButton 
                            icon={<BookOpen className="w-6 h-6" />} 
                            label="Read" 
                            isActive={currentView === ViewState.TRANSLATOR} 
                            onClick={() => setCurrentView(ViewState.TRANSLATOR)} 
                        />
                        <NavButton 
                            icon={<MessageCircle className="w-6 h-6" />} 
                            label="Chat" 
                            isActive={currentView === ViewState.CHAT} 
                            onClick={() => setCurrentView(ViewState.CHAT)} 
                        />
                         <NavButton 
                            icon={<Wand2 className="w-6 h-6" />} 
                            label="Create" 
                            isActive={currentView === ViewState.IMAGE_GEN} 
                            onClick={() => setCurrentView(ViewState.IMAGE_GEN)} 
                        />
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden relative bg-gradient-to-br from-stone-950 to-stone-900">
                    <div className="absolute inset-0 pointer-events-none">
                         <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 rounded-full blur-[100px]" />
                         <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-900/10 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative h-full w-full z-10">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden flex flex-col h-[100dvh] w-screen bg-stone-950 text-stone-100 font-sans animate-liquid-entry">
                {/* Top Header */}
                <header className="h-14 bg-stone-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-center px-4 shrink-0 z-50 sticky top-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold text-sm">
                            ML
                        </div>
                        <span className="font-bold text-lg tracking-tight">MangaLens AI</span>
                    </div>
                </header>

                {/* Main Content (Scrollable) */}
                <main className="flex-1 overflow-hidden relative pb-safe-nav">
                    {renderContent()}
                </main>

                {/* Bottom Navigation Bar */}
                <nav className="h-20 bg-stone-900/90 backdrop-blur-xl border-t border-white/5 fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 pb-2">
                    <MobileNavButton 
                        icon={<BookOpen className="w-6 h-6" />} 
                        label="Read" 
                        isActive={currentView === ViewState.TRANSLATOR} 
                        onClick={() => setCurrentView(ViewState.TRANSLATOR)} 
                    />
                    <MobileNavButton 
                        icon={<MessageCircle className="w-6 h-6" />} 
                        label="Chat" 
                        isActive={currentView === ViewState.CHAT} 
                        onClick={() => setCurrentView(ViewState.CHAT)} 
                    />
                     <MobileNavButton 
                        icon={<Wand2 className="w-6 h-6" />} 
                        label="Create" 
                        isActive={currentView === ViewState.IMAGE_GEN} 
                        onClick={() => setCurrentView(ViewState.IMAGE_GEN)} 
                    />
                </nav>
            </div>
        </>
    );
};

interface NavButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`group relative flex flex-col items-center gap-2 w-full p-2 transition-all duration-300 rounded-2xl
                ${isActive ? 'bg-white/5 text-white shadow-inner' : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'}
            `}
        >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive ? 'text-indigo-400 scale-110 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'group-hover:scale-105'
            }`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium tracking-wide uppercase transition-colors ${isActive ? 'text-indigo-300' : ''}`}>{label}</span>
        </button>
    );
};

const MobileNavButton: React.FC<NavButtonProps> = ({ icon, label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 active:scale-90 transition-transform`}
        >
            <div className={`p-1.5 rounded-full transition-all duration-300 ${
                isActive ? 'bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'text-stone-500'
            }`}>
                {icon}
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-indigo-400' : 'text-stone-500'}`}>{label}</span>
        </button>
    );
};

export default App;
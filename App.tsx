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
        <div className="flex h-screen w-screen bg-stone-950 text-stone-100 font-sans selection:bg-indigo-500/30">
            {/* Sidebar */}
            <nav className="w-20 md:w-24 flex flex-col items-center py-8 bg-stone-900 border-r border-stone-800 shadow-2xl z-50">
                <div className="mb-12 cursor-pointer" onClick={() => setCurrentView(ViewState.LANDING)}>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white font-bold text-xl tracking-tighter">
                        ML
                    </div>
                </div>

                <div className="flex flex-col gap-8 w-full">
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
            <main className="flex-1 overflow-hidden relative">
                {renderContent()}
            </main>
        </div>
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
            className={`group relative flex flex-col items-center gap-1 w-full py-2 transition-all duration-300
                ${isActive ? 'text-white' : 'text-stone-500 hover:text-stone-300'}
            `}
        >
            <div className={`p-3 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20 scale-100' : 'group-hover:bg-stone-800 scale-90 group-hover:scale-100'
            }`}>
                {icon}
            </div>
            <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
            
            {/* Active Indicator */}
            {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
            )}
        </button>
    );
};

export default App;
import React, { useState, useEffect } from 'react';
import { ImageSize } from '../types';
import { generateMangaImage } from '../services/geminiService';
import { Wand2, Image as ImageIcon, Download, Key } from 'lucide-react';
import { Language } from '../translations';

interface ImageGeneratorProps {
    lang: Language;
    t: any;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ lang, t }) => {
    const [prompt, setPrompt] = useState('');
    const [size, setSize] = useState<ImageSize>(ImageSize.SIZE_1K);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasKey, setHasKey] = useState(false);
    const [checkingKey, setCheckingKey] = useState(true);

    useEffect(() => {
        checkKeyStatus();
    }, []);

    const checkKeyStatus = async () => {
        if (window.aistudio?.hasSelectedApiKey) {
            const selected = await window.aistudio.hasSelectedApiKey();
            setHasKey(selected);
        } else {
             setHasKey(false); 
        }
        setCheckingKey(false);
    };

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            try {
                await window.aistudio.openSelectKey();
                setHasKey(true);
                setError(null);
            } catch (e) {
                console.error("Key selection failed", e);
            }
        } else {
            setError("AI Studio environment not detected.");
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        setError(null);

        try {
            const base64 = await generateMangaImage(prompt, size);
            setGeneratedImage(base64);
        } catch (err: any) {
            const msg = err?.message || '';
            if (msg.includes("Requested entity was not found")) {
                setHasKey(false);
                setError("API Key session expired or invalid. Please select your key again.");
            } else {
                setError("Failed to generate image. Please try a different prompt.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    if (checkingKey) {
        return <div className="h-full w-full flex items-center justify-center bg-stone-950 text-stone-500">Initializing...</div>;
    }

    if (!hasKey) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-stone-950 p-8 text-center">
                <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-2xl p-8 shadow-2xl">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-400">
                        <Key className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">{t.imageGen.access.title}</h2>
                    <p className="text-stone-400 mb-8">{t.imageGen.access.desc}</p>
                    <button
                        onClick={handleSelectKey}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                        {t.imageGen.access.btn}
                    </button>
                    <p className="mt-6 text-xs text-stone-600">
                        {t.imageGen.access.docs} <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Google AI Dev Docs</a>.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-stone-950 flex flex-col overflow-hidden p-4 md:p-8 gap-6 overflow-y-auto">
            <header className="flex-none">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Wand2 className="text-purple-400" />
                    {t.imageGen.header}
                </h1>
                <p className="text-stone-400">{t.imageGen.subheader}</p>
            </header>

            <div className="flex-1 flex flex-col-reverse lg:flex-row gap-8 pb-8">
                {/* Result (Mobile: Top, Desktop: Right) */}
                 <div className="flex-1 bg-stone-900 rounded-2xl border border-stone-800 flex items-center justify-center relative p-4 group min-h-[300px]">
                    {generatedImage ? (
                        <div className="relative max-w-full max-h-full">
                            <img 
                                src={generatedImage} 
                                alt="Generated Manga Art" 
                                className="max-h-[70vh] object-contain rounded-lg shadow-2xl"
                            />
                            <a 
                                href={generatedImage} 
                                download="manga-art-gen.png"
                                className="absolute bottom-4 right-4 bg-white text-stone-900 p-3 rounded-full shadow-xl hover:bg-stone-200 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Download className="w-6 h-6" />
                            </a>
                        </div>
                    ) : (
                        <div className="text-center text-stone-600 flex flex-col items-center">
                            <ImageIcon className="w-20 h-20 mb-4 opacity-20" />
                            <p className="text-lg font-medium">{t.imageGen.empty.title}</p>
                            <p className="text-sm opacity-60">{t.imageGen.empty.desc}</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6 bg-stone-900 p-6 rounded-2xl border border-stone-800 h-fit">
                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">{t.imageGen.promptLabel}</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t.imageGen.promptPlaceholder}
                            className="w-full h-32 bg-stone-950 border border-stone-700 rounded-xl p-4 text-white placeholder-stone-600 focus:border-indigo-500 focus:outline-none resize-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-stone-300 mb-2">{t.imageGen.resolutionLabel}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {Object.values(ImageSize).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSize(s as ImageSize)}
                                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                                        size === s 
                                        ? 'bg-indigo-600 text-white shadow-lg' 
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                    }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt}
                        className="mt-auto w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {t.imageGen.dreaming}
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                {t.imageGen.generateBtn}
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;
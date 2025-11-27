import React, { useState, useRef, useEffect } from 'react';
import { Upload, ScanEye, X, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Layers, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2, Globe, Search, Edit, Play, Square } from 'lucide-react';
import { translateMangaPage, identifyMangaTitle, getMangaContext } from '../services/geminiService';
import { AnalysisResult, MangaContext } from '../types';
import { Language } from '../translations';

interface PageData {
    id: string;
    preview: string;
    base64Clean: string;
    mimeType: string;
    status: 'pending' | 'analyzing' | 'complete' | 'error';
    result: AnalysisResult | null;
    error: string | null;
    fileName?: string;
}

const MAX_PAGES = 40;

const LANGUAGES = [
    { code: "en", name: "English" },
    { code: "es-la", name: "Spanish (Latin America)" },
    { code: "es-es", name: "Spanish (Spain)" },
    { code: "pt-br", name: "Portuguese (Brazil)" },
    { code: "pt-pt", name: "Portuguese (Portugal)" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "ru", name: "Russian" },
    { code: "jp", name: "Japanese (Transcription)" },
    { code: "zh-cn", name: "Chinese (Simplified)" },
    { code: "zh-tw", name: "Chinese (Traditional)" },
    { code: "ko", name: "Korean" },
    { code: "id", name: "Indonesian" },
    { code: "vi", name: "Vietnamese" },
    { code: "th", name: "Thai" },
    { code: "ar", name: "Arabic" },
    { code: "hi", name: "Hindi" }
];

interface MangaTranslatorProps {
    lang: Language;
    t: any;
}

const MangaTranslator: React.FC<MangaTranslatorProps> = ({ lang, t }) => {
    const [pages, setPages] = useState<PageData[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);
    
    // Zoom & Pan State
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    
    // Context Awareness State
    const [seriesContext, setSeriesContext] = useState<MangaContext | null>(null);
    const [isContextLoading, setIsContextLoading] = useState(false);
    const [showContext, setShowContext] = useState(true);
    
    // Bulk Operations & Language State
    const [isProcessingFiles, setIsProcessingFiles] = useState(false);
    const [isBulkTranslating, setIsBulkTranslating] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState<string>('English');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Refs to track state during async operations to prevent stale closures
    const pagesRef = useRef<PageData[]>(pages);
    const pageCountRef = useRef(0);
    const isProcessingFilesRef = useRef(false);
    const shouldStopBulkRef = useRef(false);

    useEffect(() => {
        pagesRef.current = pages;
        pageCountRef.current = pages.length;
    }, [pages]);

    useEffect(() => {
        isProcessingFilesRef.current = isProcessingFiles;
    }, [isProcessingFiles]);

    // Auto-update target language when app language changes
    useEffect(() => {
        if (lang === 'vi') {
            setTargetLanguage('Vietnamese');
        } else if (lang === 'en') {
            setTargetLanguage('English');
        }
    }, [lang]);

    // Reset zoom when changing pages
    useEffect(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, [currentIndex]);

    const currentPage = pages[currentIndex];

    useEffect(() => {
        if (scrollContainerRef.current && pages.length > 0) {
            const thumbnail = scrollContainerRef.current.children[currentIndex] as HTMLElement;
            if (thumbnail) {
                thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [currentIndex, pages.length]);

    // --- Zoom Handlers ---
    const handleWheel = (e: React.WheelEvent) => {
        if (pages.length === 0) return;
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.min(Math.max(1, zoom + delta * 2), 5);
        setZoom(newZoom);
        if (newZoom === 1) {
            setPan({ x: 0, y: 0 });
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            const newX = e.clientX - dragStartRef.current.x;
            const newY = e.clientY - dragStartRef.current.y;
            setPan({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // --- File Processing ---
    // (File processing logic remains identical to previous version, just omitting for brevity if not changed, but must include full file content in XML)
    
    const processImageFile = (file: File): Promise<PageData> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                 const result = e.target?.result as string;
                 const [mimePart, data] = result.split(';base64,');
                 resolve({
                    id: Math.random().toString(36).substr(2, 9),
                    preview: result,
                    base64Clean: data,
                    mimeType: mimePart.replace('data:', ''),
                    status: 'pending',
                    result: null,
                    error: null,
                    fileName: file.name
                 });
            }
            reader.readAsDataURL(file);
        });
    }

    const processPdfFile = async (file: File, onBatchLoaded: (newPages: PageData[]) => void) => {
        try {
            // @ts-ignore
            const pdfjsLib = await import('https://esm.sh/pdfjs-dist@4.0.379');
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            const BATCH_SIZE = 20;
            let batch: PageData[] = [];
            let currentBatchSize = 0;

            for (let i = 1; i <= pdf.numPages; i++) {
                if (pageCountRef.current + i - 1 >= MAX_PAGES) break;

                try {
                    const page = await pdf.getPage(i);
                    const scale = 1.5; 
                    const viewport = page.getViewport({ scale });
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    
                    if (!context) continue;
                    
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    await page.render({ canvasContext: context, viewport } as any).promise;
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    const [mimePart, base64] = dataUrl.split(';base64,');

                    batch.push({
                        id: Math.random().toString(36).substr(2, 9) + i,
                        preview: dataUrl,
                        base64Clean: base64,
                        mimeType: 'image/jpeg',
                        status: 'pending',
                        result: null,
                        error: null,
                        fileName: `${file.name} - Page ${i}`
                    });
                    currentBatchSize++;

                    if (currentBatchSize >= BATCH_SIZE || i === pdf.numPages || (pageCountRef.current + batch.length) >= MAX_PAGES) {
                        onBatchLoaded([...batch]);
                        batch = [];
                        currentBatchSize = 0;
                        await new Promise(r => setTimeout(r, 50));
                    }
                } catch (err) {
                    console.error(`Error rendering PDF page ${i}`, err);
                }
            }
        } catch (error) {
            console.error("Failed to load PDF library or process file:", error);
        }
    };

    const processZipBasedFile = async (file: File, onBatchLoaded: (newPages: PageData[]) => void) => {
        try {
            // @ts-ignore
            const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
            
            const zip = await JSZip.loadAsync(file);
            
            const blobToBase64 = (blob: Blob): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            };

            const entries: any[] = [];
            zip.forEach((relativePath: string, zipEntry: any) => {
                if (!zipEntry.dir) {
                    const name = zipEntry.name.toLowerCase();
                    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) {
                        entries.push(zipEntry);
                    }
                }
            });

            entries.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

            const BATCH_SIZE = 20;
            let batch: PageData[] = [];
            
            for (let i = 0; i < entries.length; i++) {
                if (pageCountRef.current >= MAX_PAGES) break;

                const entry = entries[i];
                try {
                    const blob = await entry.async('blob');
                    const fullBase64 = await blobToBase64(blob);
                    const mime = fullBase64.split(';base64,')[0].replace('data:', '');
                    const [_, base64Clean] = fullBase64.split(';base64,');

                    batch.push({
                        id: Math.random().toString(36).substr(2, 9) + i,
                        preview: fullBase64,
                        base64Clean: base64Clean,
                        mimeType: mime,
                        status: 'pending',
                        result: null,
                        error: null,
                        fileName: entry.name
                    });
                    
                    pageCountRef.current++;

                    if (batch.length >= BATCH_SIZE || i === entries.length - 1 || pageCountRef.current >= MAX_PAGES) {
                        onBatchLoaded([...batch]);
                        batch = [];
                        await new Promise(r => setTimeout(r, 50));
                    }
                } catch (e) {
                    console.error("Failed to load zip entry", entry.name);
                }
            }
        } catch (error) {
            console.error("Failed to load JSZip or process file:", error);
        }
    };

    const processKindleFile = async (file: File, onBatchLoaded: (newPages: PageData[]) => void) => {
        const buffer = await file.arrayBuffer();
        const data = new Uint8Array(buffer);
        const readBE32 = (offset: number) => (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
        const readBE16 = (offset: number) => (data[offset] << 8) | data[offset + 1];

        if (data.length < 80) return;
        const numRecords = readBE16(76);
        const recordInfoListStart = 78;
        
        const offsets: number[] = [];
        for (let i = 0; i < numRecords; i++) {
            const entryStart = recordInfoListStart + (i * 8);
            if (entryStart + 4 > data.length) break;
            const offset = readBE32(entryStart);
            offsets.push(offset);
        }

        const sortedOffsets = [...offsets, data.length].sort((a, b) => a - b);
        const BATCH_SIZE = 20;
        let batch: PageData[] = [];
        let imagesFound = 0;

        for (let i = 0; i < sortedOffsets.length - 1; i++) {
            if (pageCountRef.current >= MAX_PAGES) break;
            const start = sortedOffsets[i];
            const end = sortedOffsets[i + 1];
            if (start >= data.length || end > data.length || start >= end) continue;
            
            let mimeType: string | null = null;
            let ext: string = '';

            if (data[start] === 0xFF && data[start + 1] === 0xD8) {
                mimeType = 'image/jpeg';
                ext = 'jpg';
            } else if (data[start] === 0x89 && data[start + 1] === 0x50 && data[start + 2] === 0x4E && data[start + 3] === 0x47) {
                mimeType = 'image/png';
                ext = 'png';
            }

            if (mimeType && (end - start) > 2048) {
                try {
                    const blob = new Blob([data.subarray(start, end)], { type: mimeType });
                    const reader = new FileReader();
                    const base64Data = await new Promise<{preview: string, clean: string}>((resolve, reject) => {
                        reader.onloadend = () => {
                            const res = reader.result as string;
                            const clean = res.split(';base64,')[1];
                            resolve({ preview: res, clean });
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });

                    imagesFound++;
                    batch.push({
                        id: Math.random().toString(36).substr(2, 9) + imagesFound,
                        preview: base64Data.preview,
                        base64Clean: base64Data.clean,
                        mimeType: mimeType,
                        status: 'pending',
                        result: null,
                        error: null,
                        fileName: `${file.name} - Img ${imagesFound}.${ext}`
                    });
                    pageCountRef.current++;
                    if (batch.length >= BATCH_SIZE || pageCountRef.current >= MAX_PAGES) {
                         onBatchLoaded([...batch]);
                         batch = [];
                         await new Promise(r => setTimeout(r, 50));
                    }
                } catch (e) {
                    console.error("Failed to process image record", i);
                }
            }
        }
        if (batch.length > 0) onBatchLoaded(batch);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setIsProcessingFiles(true);
        try {
            const files: File[] = Array.from(e.target.files);
            for (const file of files) {
                if (pageCountRef.current >= MAX_PAGES) {
                    alert(`Maximum limit of ${MAX_PAGES} pages reached.`);
                    break;
                }
                const lowerName = file.name.toLowerCase();
                if (file.type === 'application/pdf') {
                    await processPdfFile(file, (newPages) => setPages(prev => { const updated = [...prev, ...newPages]; pageCountRef.current = updated.length; return updated; }));
                } else if (file.type === 'application/epub+zip' || file.type === 'application/x-cbz' || lowerName.endsWith('.cbz') || lowerName.endsWith('.epub')) {
                    await processZipBasedFile(file, (newPages) => setPages(prev => { const updated = [...prev, ...newPages]; pageCountRef.current = updated.length; return updated; }));
                } else if (lowerName.endsWith('.azw3') || lowerName.endsWith('.mobi') || lowerName.endsWith('.azw')) {
                    await processKindleFile(file, (newPages) => setPages(prev => { const updated = [...prev, ...newPages]; pageCountRef.current = updated.length; return updated; }));
                } else if (file.type.startsWith('image/')) {
                    const imagePage = await processImageFile(file);
                    setPages(prev => { if (prev.length >= MAX_PAGES) return prev; const updated = [...prev, imagePage]; pageCountRef.current = updated.length; return updated; });
                }
            }
        } catch (error) {
            console.error("Error processing files:", error);
            alert("Failed to process some files.");
        } finally {
            setIsProcessingFiles(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const translateSinglePage = async (index: number): Promise<void> => {
        const page = pagesRef.current[index];
        if (!page || page.status === 'analyzing') return;
        updatePage(index, { status: 'analyzing', error: null });
        try {
            const contextString = seriesContext ? `Series Title: ${seriesContext.title}\nKey Context & Terminology:\n${seriesContext.info}` : undefined;
            const data = await translateMangaPage(page.base64Clean, page.mimeType, contextString, targetLanguage);
            updatePage(index, { status: 'complete', result: data });
        } catch (err) {
            updatePage(index, { status: 'error', error: "Translation failed. Click to retry." });
        }
    };

    const handleBulkTranslate = async () => {
        if (isBulkTranslating) {
            shouldStopBulkRef.current = true;
            return;
        }
        setIsBulkTranslating(true);
        shouldStopBulkRef.current = false;
        try {
            while (true) {
                if (shouldStopBulkRef.current) break;
                const currentPages = pagesRef.current;
                const pendingIndex = currentPages.findIndex(p => p.status === 'pending');
                if (pendingIndex === -1) {
                    if (isProcessingFilesRef.current) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        continue;
                    } else break;
                }
                await translateSinglePage(pendingIndex);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } finally {
            setIsBulkTranslating(false);
            shouldStopBulkRef.current = false;
        }
    };

    const handleAnalyze = () => translateSinglePage(currentIndex);

    const handleDetectContext = async () => {
        if (!currentPage || isContextLoading) return;
        setIsContextLoading(true);
        try {
            const title = await identifyMangaTitle(currentPage.base64Clean, currentPage.mimeType);
            const context = await getMangaContext(title);
            setSeriesContext(context);
            setShowContext(true);
        } catch (error) {
            console.error("Failed to detect context", error);
        } finally {
            setIsContextLoading(false);
        }
    };

    const handleManualContext = () => {
        setSeriesContext({ title: '', info: '', sources: [] });
        setShowContext(true);
    };

    const updatePage = (index: number, updates: Partial<PageData>) => setPages(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
    
    const removePage = (index: number, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const isCurrent = index === currentIndex;
        const isLast = index === pages.length - 1;
        setPages(prev => { const updated = prev.filter((_, i) => i !== index); pageCountRef.current = updated.length; return updated; });
        if (isCurrent) {
            if (isLast && index > 0) setCurrentIndex(index - 1);
        } else if (index < currentIndex) setCurrentIndex(curr => curr - 1);
    };

    const navigate = (direction: 'prev' | 'next') => {
        if (direction === 'prev') setCurrentIndex(curr => Math.max(0, curr - 1));
        else setCurrentIndex(curr => Math.min(pages.length - 1, curr + 1));
    };

    const pendingCount = pages.filter(p => p.status === 'pending').length;

    return (
        <div className="flex h-full w-full flex-col md:flex-row bg-stone-900 text-white overflow-hidden">
            <div className="relative flex-1 bg-stone-950 flex flex-col overflow-hidden">
                <div 
                    className="flex-1 relative flex items-center justify-center p-4 overflow-hidden bg-stone-950"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {pages.length === 0 ? (
                        <div 
                            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-stone-500 transition cursor-pointer group z-10
                                ${isProcessingFiles ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-stone-700 hover:border-stone-500 hover:text-stone-300'}
                            `}
                            onClick={() => !isProcessingFiles && fileInputRef.current?.click()}
                        >
                            {isProcessingFiles ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-lg font-medium text-indigo-400">{t.translator.upload.processing}</p>
                                    <p className="text-sm text-stone-500 mt-2">{t.translator.upload.loading}</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 mb-4 group-hover:scale-110 transition-transform" />
                                    <p className="text-lg font-medium">{t.translator.upload.title}</p>
                                    <p className="text-sm mt-2 opacity-70">{t.translator.upload.subtitle}</p>
                                    <p className="text-xs mt-4 bg-stone-900 px-3 py-1 rounded-full border border-stone-800">{t.translator.upload.max.replace('{max}', MAX_PAGES.toString())}</p>
                                </>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/png, image/jpeg, application/pdf, .epub, .cbz, application/epub+zip, application/x-cbz, .azw3, .mobi, .azw" 
                                multiple
                                className="hidden" 
                            />
                        </div>
                    ) : (
                        <>
                            <div 
                                className="relative h-fit w-fit shadow-2xl transition-transform duration-75 ease-out will-change-transform origin-center"
                                style={{
                                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                }}
                            >
                                <img 
                                    src={currentPage.preview} 
                                    alt={`Page ${currentIndex + 1}`} 
                                    className="max-h-[calc(90vh-8rem)] w-auto h-auto max-w-full rounded-lg shadow-stone-900/50 block select-none pointer-events-none"
                                />
                                {currentPage.status === 'complete' && currentPage.result?.bubbles.map((bubble) => {
                                    if (!bubble.boundingBox) return null;
                                    const { ymin, xmin, ymax, xmax } = bubble.boundingBox;
                                    const top = ymin / 10;
                                    const left = xmin / 10;
                                    const height = (ymax - ymin) / 10;
                                    const width = (xmax - xmin) / 10;

                                    return (
                                        <div
                                            key={bubble.id}
                                            className={`absolute border-2 transition-all duration-200 cursor-help
                                                ${hoveredBubbleId === bubble.id 
                                                    ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.5)]' 
                                                    : 'border-blue-400/50 hover:border-blue-400 bg-transparent'
                                                }`}
                                            style={{
                                                top: `${top}%`,
                                                left: `${left}%`,
                                                height: `${height}%`,
                                                width: `${width}%`,
                                            }}
                                            onMouseEnter={() => setHoveredBubbleId(bubble.id)}
                                            onMouseLeave={() => setHoveredBubbleId(null)}
                                        >
                                            {hoveredBubbleId === bubble.id && (
                                                 <div 
                                                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-stone-950/95 backdrop-blur-sm text-xs px-3 py-2 rounded-lg text-white z-50 border border-stone-700 shadow-2xl min-w-[100px] max-w-[280px] whitespace-normal text-center pointer-events-none"
                                                    style={{ transform: `scale(${1/zoom})`, transformOrigin: 'bottom center' }}
                                                 >
                                                    {bubble.translatedText}
                                                 </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
                                <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} className="p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg shadow-lg border border-stone-700 transition-colors" title={t.translator.controls.zoomIn}>
                                    <ZoomIn className="w-5 h-5" />
                                </button>
                                <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} className="p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg shadow-lg border border-stone-700 transition-colors" title={t.translator.controls.zoomOut}>
                                    <ZoomOut className="w-5 h-5" />
                                </button>
                                <button onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="p-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg shadow-lg border border-stone-700 transition-colors" title={t.translator.controls.reset}>
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </div>

                            {currentIndex > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-stone-900/80 hover:bg-stone-800 rounded-full text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-20" title={t.translator.controls.prev}>
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}
                            {currentIndex < pages.length - 1 && (
                                <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-stone-900/80 hover:bg-stone-800 rounded-full text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110 z-20" title={t.translator.controls.next}>
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}

                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                                {currentPage.status !== 'analyzing' && !isBulkTranslating && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); handleAnalyze(); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full shadow-lg font-semibold transition-all hover:scale-105">
                                            <ScanEye className="w-5 h-5" />
                                            {currentPage.status === 'complete' ? t.translator.controls.retranslate : (currentPage.status === 'error' ? t.translator.controls.retry : t.translator.controls.translate)}
                                        </button>
                                    </>
                                )}
                                {currentPage.status === 'analyzing' && (
                                    <div className="flex items-center gap-2 bg-stone-800 px-6 py-3 rounded-full shadow-lg border border-stone-700">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-stone-300 animate-pulse">{t.translator.controls.reading}</span>
                                    </div>
                                )}
                                <button onClick={(e) => removePage(currentIndex, e)} disabled={isBulkTranslating} className="flex items-center gap-2 bg-stone-800 hover:bg-red-900/50 text-stone-300 hover:text-red-200 px-4 py-3 rounded-full shadow-lg border border-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title={t.translator.controls.remove}>
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            
                            {currentPage.error && (
                                <div className="absolute top-6 right-6 bg-red-900/90 border border-red-700 text-red-100 p-4 rounded-lg shadow-xl flex items-center gap-3 animate-bounce z-50">
                                    <AlertCircle className="w-5 h-5" />
                                    {currentPage.error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {pages.length > 0 && (
                    <div className="h-24 bg-stone-900 border-t border-stone-800 flex items-center px-4 gap-3 overflow-x-auto shrink-0 hide-scrollbar z-40" ref={scrollContainerRef}>
                         <div className="flex-shrink-0 flex items-center gap-2 mr-2 border-r border-stone-800 pr-4">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">{pages.length}/{MAX_PAGES}</span>
                            {isProcessingFiles && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                        </div>
                        {pages.map((page, idx) => (
                            <button key={page.id} onClick={() => setCurrentIndex(idx)} disabled={isBulkTranslating && currentPage.status === 'analyzing' && idx === currentIndex} className={`relative h-16 w-12 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all group ${currentIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/20 scale-105' : 'border-stone-700 opacity-60 hover:opacity-100 hover:scale-105'}`}>
                                <img src={page.preview} className="h-full w-full object-cover" alt={`Thumb ${idx}`} />
                                {page.status === 'analyzing' && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
                                {page.status === 'complete' && <div className="absolute top-0 right-0 bg-green-500 text-white p-[1px] rounded-bl-md"><CheckCircle2 className="w-3 h-3" /></div>}
                                {page.error && <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-red-200" /></div>}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-center text-white py-0.5 truncate px-0.5">{idx + 1}</div>
                            </button>
                        ))}
                        {pages.length < MAX_PAGES && (
                            <>
                                <div className="h-12 w-[1px] bg-stone-700 mx-1" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isProcessingFiles || isBulkTranslating} className="h-16 w-12 flex-shrink-0 rounded-md border-2 border-dashed border-stone-700 flex flex-col items-center justify-center text-stone-500 hover:text-indigo-400 hover:border-indigo-400 transition-all hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed" title={t.translator.upload.add}>
                                    {isProcessingFiles ? <div className="w-4 h-4 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /><span className="text-[8px] font-bold uppercase mt-1">{t.translator.upload.add}</span></>}
                                </button>
                            </>
                        )}
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg, application/pdf, .epub, .cbz, application/epub+zip, application/x-cbz, .azw3, .mobi, .azw" multiple className="hidden" />
                    </div>
                )}
            </div>

            <div className="w-full md:w-96 bg-stone-900 border-l border-stone-800 flex flex-col h-[40vh] md:h-full shadow-2xl z-10">
                {currentPage && (
                    <div className="border-b border-stone-800 bg-stone-900 shrink-0">
                        <button onClick={() => setShowContext(!showContext)} className="w-full p-4 flex items-center justify-between text-xs font-bold uppercase text-stone-500 hover:text-stone-300 transition-colors">
                            <span className="flex items-center gap-2"><Globe className="w-4 h-4" />{t.translator.context.button}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded transition-colors ${seriesContext ? 'bg-indigo-900 text-indigo-200' : 'bg-stone-800'}`}>{seriesContext ? t.translator.context.active : t.translator.context.none}</span>
                        </button>

                        {showContext && (
                            <div className="px-4 pb-4 bg-stone-900/50 max-h-[30vh] overflow-y-auto">
                                {!seriesContext ? (
                                    <div className="text-center py-4 border border-dashed border-stone-800 rounded-lg">
                                        <p className="text-stone-500 text-xs mb-3 px-2">{t.translator.context.empty}</p>
                                        <div className="flex flex-col gap-2 items-center w-full px-4">
                                            <button onClick={handleDetectContext} disabled={isContextLoading || isBulkTranslating} className="w-full text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-full flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                                                {isContextLoading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search className="w-3 h-3" />}
                                                {isContextLoading ? t.translator.context.detecting : t.translator.context.detectBtn}
                                            </button>
                                            <div className="flex items-center w-full gap-2">
                                                <div className="h-[1px] flex-1 bg-stone-800"></div>
                                                <span className="text-[9px] text-stone-600 font-bold uppercase">{t.translator.context.or}</span>
                                                <div className="h-[1px] flex-1 bg-stone-800"></div>
                                            </div>
                                            <button onClick={handleManualContext} className="w-full text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 hover:border-stone-600 px-3 py-2 rounded-full flex items-center justify-center gap-2 transition-all">
                                                <Edit className="w-3 h-3" />
                                                {t.translator.context.manualBtn}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div>
                                            <label className="text-[10px] text-indigo-400 font-bold uppercase">{t.translator.context.titleLabel}</label>
                                            <input type="text" value={seriesContext.title} onChange={(e) => setSeriesContext({...seriesContext, title: e.target.value})} placeholder={t.translator.context.titlePlaceholder} className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-white focus:border-indigo-500 focus:outline-none mt-1 placeholder-stone-600" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-indigo-400 font-bold uppercase">{t.translator.context.infoLabel}</label>
                                            <textarea value={seriesContext.info} onChange={(e) => setSeriesContext({...seriesContext, info: e.target.value})} rows={5} placeholder={t.translator.context.infoPlaceholder} className="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-300 focus:border-indigo-500 focus:outline-none mt-1 resize-none placeholder-stone-600 leading-relaxed" />
                                        </div>
                                        {seriesContext.sources.length > 0 && (
                                            <div>
                                                <label className="text-[10px] text-stone-500 font-bold uppercase">{t.translator.context.sourcesLabel}</label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {seriesContext.sources.map((source, i) => (
                                                        <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 hover:underline truncate max-w-full block">{source.title || source.uri}</a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-end">
                                            <button onClick={() => setSeriesContext(null)} className="text-[10px] text-red-400 hover:text-red-300 hover:underline">{t.translator.context.clear}</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!currentPage ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-600 p-8 text-center">
                        <Layers className="w-12 h-12 mb-4 opacity-20" />
                        <p>{t.translator.emptyState.waiting}</p>
                    </div>
                ) : (
                    <>
                        <div className="shrink-0 bg-stone-900 z-20 shadow-sm">
                            <div className="p-6 border-b border-stone-800 flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">Page {currentIndex + 1}</h2>
                                        <p className="text-xs text-stone-500 mt-1 max-w-[150px] truncate">{currentPage.fileName || `Page ${currentIndex + 1}`}</p>
                                    </div>
                                    {currentPage.status === 'complete' && <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-1 rounded border border-indigo-500/20">{t.translator.header.bubbles.replace('{count}', (currentPage.result?.bubbles.length || 0).toString())}</span>}
                                </div>

                                <div className="relative">
                                    <label className="text-[10px] text-stone-500 font-bold uppercase mb-1 block">{t.translator.header.langLabel}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Globe className="h-4 w-4 text-stone-400" /></div>
                                        <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full bg-stone-800 border border-stone-700 text-white text-sm rounded-lg block pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer hover:bg-stone-750 transition-colors" disabled={currentPage.status === 'analyzing' || isBulkTranslating}>
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.code} value={lang.name} className="bg-stone-900">{lang.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
                                    </div>
                                </div>
                                
                                {pendingCount > 0 && (
                                    <button onClick={handleBulkTranslate} className={`w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border transition-all ${isBulkTranslating ? 'bg-red-900/30 hover:bg-red-900/50 text-red-200 border-red-800' : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'}`}>
                                        {isBulkTranslating ? <><Square className="w-3 h-3 fill-current" />{t.translator.header.stop}<div className="w-3 h-3 ml-2 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /></> : <><Play className="w-3 h-3" />{t.translator.header.translateAll.replace('{count}', pendingCount.toString())}</>}
                                    </button>
                                )}
                            </div>

                            {currentPage.status === 'complete' && currentPage.result && (
                                <div className="p-4 bg-stone-900/30 border-b border-stone-800">
                                    <h3 className="text-xs font-bold uppercase text-stone-500 mb-2">{t.translator.header.summaryTitle}</h3>
                                    <p className="text-sm text-stone-400 leading-relaxed">{currentPage.result.summary}</p>
                                </div>
                            )}
                        </div>

                        {currentPage.status === 'complete' && currentPage.result ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {currentPage.result.bubbles.map((bubble) => (
                                    <div key={bubble.id} onMouseEnter={() => setHoveredBubbleId(bubble.id)} onMouseLeave={() => setHoveredBubbleId(null)} className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${hoveredBubbleId === bubble.id ? 'bg-stone-800 border-pink-500/50 translate-x-1 shadow-lg' : 'bg-stone-800/40 border-stone-800 hover:border-stone-700'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">{bubble.speaker || 'Unknown'}</span>
                                            <span className="text-[10px] text-stone-600 font-mono">{bubble.id}</span>
                                        </div>
                                        <p className="text-white text-sm font-medium leading-relaxed mb-2">{bubble.translatedText}</p>
                                        <p className="text-stone-500 text-xs italic border-t border-stone-700/50 pt-2 mt-2 font-serif">{bubble.originalText}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
                                {currentPage.status === 'analyzing' ? (
                                    <>
                                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-stone-400">{t.translator.emptyState.deciphering}</p>
                                    </>
                                ) : (
                                    <>
                                        <ScanEye className="w-12 h-12 mb-4 text-stone-700" />
                                        <p className="text-stone-500">{t.translator.emptyState.waiting}</p>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MangaTranslator;
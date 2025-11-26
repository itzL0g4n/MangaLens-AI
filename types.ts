// Global types for the application

export enum ViewState {
    LANDING = 'LANDING',
    TRANSLATOR = 'TRANSLATOR',
    CHAT = 'CHAT',
    IMAGE_GEN = 'IMAGE_GEN'
}

export enum ImageSize {
    SIZE_1K = '1K',
    SIZE_2K = '2K',
    SIZE_4K = '4K'
}

export interface BoundingBox {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
}

export interface TranslatedBubble {
    id: string;
    originalText: string;
    translatedText: string;
    boundingBox?: BoundingBox; // Normalized 0-1000
    speaker?: string;
}

export interface AnalysisResult {
    bubbles: TranslatedBubble[];
    summary: string;
}

export interface MangaContext {
    title: string;
    info: string;
    sources: { uri: string; title: string }[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    isLoading?: boolean;
}

// Define window augmentation for aistudio
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }

    interface Window {
        aistudio?: AIStudio;
    }
}
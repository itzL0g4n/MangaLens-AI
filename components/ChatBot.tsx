import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/geminiService';
import { ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown'; 
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { GenerateContentResponse } from "@google/genai";

const ChatBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'init', role: 'model', text: "Hello! I'm your MangaLens AI assistant. Ask me about manga recommendations, translations, or plot explanations!" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatSession = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize chat session once
    useEffect(() => {
        chatSession.current = createChatSession();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const resultStream = await chatSession.current.sendMessageStream({ message: userMsg.text });
            
            // Create a placeholder for the model response
            const modelMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isLoading: true }]);

            let fullText = '';
            
            for await (const chunk of resultStream) {
                const c = chunk as GenerateContentResponse;
                const text = c.text;
                if (text) {
                    fullText += text;
                    setMessages(prev => prev.map(m => 
                        m.id === modelMsgId ? { ...m, text: fullText } : m
                    ));
                }
            }
            
            // Finalize
            setMessages(prev => prev.map(m => 
                m.id === modelMsgId ? { ...m, isLoading: false } : m
            ));

        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I encountered an error processing your request. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-stone-950">
            <header className="p-6 border-b border-stone-800 bg-stone-900">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-indigo-400" />
                    AI Assistant
                </h1>
                <p className="text-stone-400 text-sm">Powered by Gemini 3 Pro</p>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-4 max-w-4xl mx-auto ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'model' ? 'bg-indigo-600' : 'bg-stone-700'
                        }`}>
                            {msg.role === 'model' ? <Bot className="w-6 h-6 text-white" /> : <User className="w-6 h-6 text-stone-300" />}
                        </div>
                        
                        <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl p-4 shadow-md ${
                                msg.role === 'model' 
                                    ? 'bg-stone-900 border border-stone-800 text-stone-200' 
                                    : 'bg-indigo-600 text-white'
                            }`}>
                                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap font-sans leading-relaxed">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                            {msg.isLoading && msg.role === 'model' && (
                                <span className="text-xs text-stone-500 mt-1 animate-pulse">Thinking...</span>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-stone-900 border-t border-stone-800">
                <div className="max-w-4xl mx-auto relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your favorite manga..."
                        disabled={isLoading}
                        className="w-full bg-stone-950 text-white border border-stone-700 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-inner placeholder-stone-600"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
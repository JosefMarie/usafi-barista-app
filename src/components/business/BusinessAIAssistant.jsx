import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export function BusinessAIAssistant({ chapterContent, chapterTitle, isOpen, onClose }) {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: `Hello! I'm your USAFI Business Assistant. I've read the chapter "${chapterTitle}". How can I help you today?` }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulation of AI Response
        // In a real scenario, this would call a Cloud Function or an API
        setTimeout(() => {
            let response = "";
            const lowerInput = input.toLowerCase();
            
            if (lowerInput.includes('help') || lowerInput.includes('what is this')) {
                response = `This chapter, "${chapterTitle}", covers important business concepts. Based on the content, you might want to focus on the key takeaways mentioned in the text. Is there a specific part you're confused about?`;
            } else if (lowerInput.includes('exam') || lowerInput.includes('quiz')) {
                response = "To prepare for the quiz, make sure you understand the core terminology and practical applications discussed in this chapter. Don't worry, you have 3 attempts!";
            } else {
                response = `That's a great question about ${chapterTitle}. While I'm still learning, I can tell you that understanding this material is crucial for your barista career. I recommend re-reading the section on specific business operations if you need more detail.`;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            setIsTyping(false);
        }, 1500);
    };

    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 w-full md:w-[400px] bg-white dark:bg-[#1c1916] shadow-2xl z-[110] flex flex-col transform transition-transform duration-500",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="p-6 bg-espresso text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <div>
                        <h2 className="font-serif font-black text-sm uppercase tracking-widest leading-none">Study Assistant</h2>
                        <p className="text-[10px] text-white/60 uppercase tracking-widest mt-1">AI Protocol Active</p>
                    </div>
                </div>
                <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF5E8] dark:bg-black/20">
                {messages.map((msg, i) => (
                    <div key={i} className={cn(
                        "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all animate-fade-in",
                        msg.role === 'assistant' 
                            ? "bg-white dark:bg-[#2c2825] text-espresso dark:text-white self-start rounded-tl-none border border-espresso/5" 
                            : "bg-espresso text-white self-end rounded-tr-none ml-auto"
                    )}>
                        {msg.content}
                    </div>
                ))}
                {isTyping && (
                    <div className="bg-white dark:bg-[#2c2825] p-4 rounded-2xl rounded-tl-none self-start flex gap-1 items-center border border-espresso/5 animate-pulse">
                        <div className="size-1.5 bg-espresso/20 rounded-full animate-bounce"></div>
                        <div className="size-1.5 bg-espresso/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="size-1.5 bg-espresso/60 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-[#1c1916] border-t border-espresso/10">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-espresso/5 dark:bg-white/5 border border-espresso/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-espresso transition-all"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="size-11 flex items-center justify-center bg-espresso text-white rounded-xl hover:bg-black transition-all disabled:opacity-50 active:scale-95"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
                <p className="text-[9px] text-center text-espresso/30 mt-3 uppercase font-bold tracking-widest">Powered by USAFI Intelligence</p>
            </div>
        </div>
    );
}

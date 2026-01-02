import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = "150px" }) {
    const editorRef = useRef(null);
    const isFirstLoad = useRef(true);

    // Sync external value to editor
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only update if the value is different to avoid cursor jumps
            // and unnecessary re-renders.
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    // Format Commands
    const execCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
        handleInput();
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    return (
        <div className={cn("flex flex-col border border-black/10 dark:border-white/10 rounded-xl overflow-hidden bg-white dark:bg-[#1e1e1e]", className)}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-black/5 dark:border-white/5 bg-gray-50 dark:bg-black/20">
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-espresso/70 dark:text-white/70"
                    title="Bold"
                >
                    <span className="material-symbols-outlined text-xl font-bold">format_bold</span>
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-espresso/70 dark:text-white/70"
                    title="Italic"
                >
                    <span className="material-symbols-outlined text-xl">format_italic</span>
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('underline')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-espresso/70 dark:text-white/70"
                    title="Underline"
                >
                    <span className="material-symbols-outlined text-xl">format_underlined</span>
                </button>

                <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1" />

                <div className="relative group p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1 cursor-pointer">
                    <span className="material-symbols-outlined text-xl text-espresso/70 dark:text-white/70">palette</span>
                    <input
                        type="color"
                        onChange={(e) => execCommand('foreColor', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="flex-1 p-4 outline-none prose prose-sm dark:prose-invert max-w-none overflow-y-auto text-espresso dark:text-white selection:bg-primary/20"
                placeholder={placeholder || "Start typing..."}
                style={{ minHeight }}
            />

            <style jsx>{`
                [contentEditable]:empty:before {
                    content: attr(placeholder);
                    color: rgba(50, 28, 0, 0.3);
                    cursor: text;
                }
                .dark [contentEditable]:empty:before {
                    color: rgba(255, 255, 255, 0.3);
                }
            `}</style>
        </div>
    );
}

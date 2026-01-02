import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { RichTextEditor } from './RichTextEditor';

export function NoteEditor({ userId, noteKey, title, className }) {
    const [content, setContent] = useState('');
    const [lastSaved, setLastSaved] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Load Note
    useEffect(() => {
        const loadNote = async () => {
            if (!userId || !noteKey) return;
            try {
                const docRef = doc(db, 'users', userId, 'notes', noteKey);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setContent(docSnap.data().content || '');
                }
            } catch (error) {
                console.error("Error loading note:", error);
                setHasError(true);
            }
        };
        loadNote();
    }, [userId, noteKey]);

    // Auto-save logic
    const saveTimeout = useRef(null);
    const handleContentChange = (newContent) => {
        setContent(newContent);
        if (saveTimeout.current) clearTimeout(saveTimeout.current);

        saveTimeout.current = setTimeout(async () => {
            if (!userId || !noteKey) return;

            setIsSaving(true);
            try {
                await setDoc(doc(db, 'users', userId, 'notes', noteKey), {
                    content: newContent,
                    title: title || 'Unnamed Note',
                    updatedAt: serverTimestamp()
                }, { merge: true });
                setLastSaved(new Date());
                setHasError(false);
            } catch (error) {
                console.error("Error saving note:", error);
                setHasError(true);
            } finally {
                setIsSaving(false);
            }
        }, 1500); // Debounce save
    };

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-[#1e1e1e]", className)}>
            <div className="flex items-center justify-end px-4 py-1 bg-gray-50/50 dark:bg-black/10 border-b border-black/5 dark:border-white/5">
                {isSaving ? (
                    <span className="text-[10px] text-primary animate-pulse font-bold uppercase tracking-widest">Saving...</span>
                ) : lastSaved ? (
                    <span className="text-[10px] text-espresso/30 dark:text-white/30 font-bold uppercase tracking-widest">
                        Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                ) : null}
                {hasError && (
                    <span className="material-symbols-outlined text-red-500 text-sm ml-2" title="Error saving">error</span>
                )}
            </div>

            <RichTextEditor
                value={content}
                onChange={handleContentChange}
                placeholder="Start typing your notes here..."
                className="flex-1 border-none rounded-none"
                minHeight="200px"
            />
        </div>
    );
}

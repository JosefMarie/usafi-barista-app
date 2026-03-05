import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';

export function GlobalAnnouncement() {
    const [announcement, setAnnouncement] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const q = query(
            collection(db, 'system_announcements'),
            where('active', '==', true),
            limit(10) // Fetch a few to be safe, though usually only 1-2 active
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                // Sort by createdAt desc in memory
                const docs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => {
                    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt || 0);
                    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt || 0);
                    return timeB - timeA;
                });

                const data = docs[0];

                // Check if this specific announcement version was dismissed in this session
                const dismissedId = sessionStorage.getItem('dismissed_announcement_id');
                if (dismissedId !== data.id) {
                    setAnnouncement(data);
                    setIsVisible(true);
                }
            } else {
                setAnnouncement(null);
                setIsVisible(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleDismiss = () => {
        if (announcement) {
            sessionStorage.setItem('dismissed_announcement_id', announcement.id);
            setIsVisible(false);
        }
    };

    if (!isVisible || !announcement) return null;

    return (
        <div className="relative z-[100] w-full bg-[#D4Af37] text-[#4B3832] overflow-hidden shadow-2xl animate-in slide-in-from-top duration-700">
            {/* Animated accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer pointer-events-none"></div>

            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-[#4B3832] text-[#F5DEB3] flex items-center justify-center shrink-0 shadow-lg">
                        <span className="material-symbols-outlined text-lg">campaign</span>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 opacity-70">
                            CEO Global Broadcast
                        </p>
                        <h4 className="font-serif font-black text-sm md:text-base leading-tight truncate">
                            {announcement.subject}
                        </h4>
                    </div>
                </div>

                <div className="flex-1 hidden md:block border-l border-[#4B3832]/20 pl-6">
                    <p className="text-sm font-medium leading-tight line-clamp-2">
                        {announcement.message}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => {
                            // Expand to see full message on mobile if truncated, or just dismiss
                            // For now, let's just allow dismissing
                            handleDismiss();
                        }}
                        className="p-2 hover:bg-[#4B3832]/10 rounded-lg transition-colors group"
                        title="Dismiss Announcement"
                    >
                        <span className="material-symbols-outlined text-xl group-active:scale-90 transition-transform">close</span>
                    </button>
                </div>
            </div>

            {/* Progress bar style accent */}
            <div className="h-0.5 w-full bg-[#4B3832]/10">
                <div className="h-full bg-[#4B3832] animate-pulse"></div>
            </div>
        </div>
    );
}

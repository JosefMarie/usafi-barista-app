import React from 'react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-[#F5DEB3] dark:bg-[#1c1916] flex flex-col items-center justify-center z-50 transition-colors duration-300">
            <div className="relative flex flex-col items-center animate-pulse">
                <img
                    src="/logo.jpg"
                    alt="Usafi Barista Training Center"
                    className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-full shadow-xl mb-4"
                />
                <div className="h-2 w-32 bg-espresso/10 rounded-full overflow-hidden">
                    <div className="h-full bg-espresso animate-progress-indeterminate"></div>
                </div>
                <p className="mt-4 text-espresso font-serif font-bold tracking-widest text-sm animate-bounce">
                    BREWING...
                </p>
            </div>
        </div>
    );
}

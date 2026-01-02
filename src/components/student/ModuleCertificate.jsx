
import React from 'react';
import { cn } from '../../lib/utils';

export const ModuleCertificate = React.forwardRef(({
    studentName = "Jane Doe",
    moduleTitle = "Certified Professional Barista",
    courseTitle = "Comprehensive Espresso & Brewing Module",
    completionDate = "August 15, 2023",
    certificateId = "USF-" + Math.floor(Math.random() * 10000), // Placeholder logic
    instructorName = "James Coffee",
    instructorTitle = "Director of Training",
    type = "Module Completion",
    className
}, ref) => {
    return (
        <div ref={ref} className={cn("w-[210mm] h-[297mm] bg-[#FAF5E8] text-[#321C00] font-sans relative overflow-hidden mx-auto shadow-2xl print:shadow-none print:w-full print:h-full print:absolute print:top-0 print:left-0 print:m-0", className)}>
            {/* Styles matching the reference Tailwind config */}
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
                    .font-serif { font-family: 'Playfair Display', serif; }
                    .font-display { font-family: 'Lexend', sans-serif; }
                    .bg-guilloche { background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBvcGFjaXR5PSIwLjAzIj48cGF0aCBkPSJNMjAgMjBMMCAwSDQwTDIwIDIwek0yMCAyMEw0MCA0MEgwTDIwIDIweiIgZmlsbD0iIzMyMUMwMCIvPjwvc3ZnPg=="); }
                    @page { size: A4 portrait; margin: 0; }
                    @media print { 
                        body { -webkit-print-color-adjust: exact; } 
                    }
                `}
            </style>

            {/* Corner Ornaments */}
            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-l-4 border-[#a77c52]/40 rounded-tl-sm z-20"></div>
            <div className="absolute top-0 right-0 w-24 h-24 border-t-4 border-r-4 border-[#a77c52]/40 rounded-tr-sm z-20"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-4 border-l-4 border-[#a77c52]/40 rounded-bl-sm z-20"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-4 border-r-4 border-[#a77c52]/40 rounded-br-sm z-20"></div>

            {/* Main Content Area */}
            <div className="m-4 border-2 border-[#a77c52]/20 border-double h-[calc(100%-2rem)] flex flex-col items-center text-center relative bg-guilloche p-12">

                {/* Background Logo */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                    <span className="material-symbols-outlined text-[300px] text-[#321C00]">local_cafe</span>
                </div>

                {/* Header Logo */}
                <div className="z-10 mb-8 flex flex-col items-center mt-8">
                    <div className="w-16 h-16 rounded-full bg-[#a77c52]/10 flex items-center justify-center mb-4 border border-[#a77c52]/30">
                        <span className="material-symbols-outlined text-[#a77c52] text-[32px]">coffee_maker</span>
                    </div>
                    <p className="text-[12px] font-bold tracking-[0.2em] text-[#a77c52] uppercase leading-relaxed">Usafi Barista<br />Training Center</p>
                </div>

                {/* Title */}
                <h1 className="z-10 font-serif text-5xl font-bold text-[#321C00] mb-2">Certificate</h1>
                <p className="z-10 font-serif text-xl italic text-[#321C00]/60 mb-12">of Professional Achievement</p>

                {/* Recipient */}
                <p className="z-10 text-[11px] uppercase tracking-widest text-[#321C00]/50 font-bold mb-4">This is to certify that</p>
                <h2 className="z-10 font-serif text-4xl font-bold text-[#321C00] w-full max-w-2xl pb-4 border-b border-[#a77c52]/20 mb-8 px-8">{studentName}</h2>

                {/* Achievement */}
                <p className="z-10 text-[11px] uppercase tracking-widest text-[#321C00]/50 font-bold mb-4">
                    {type === 'Course Completion' ? 'Has successfully completed the course' : 'Has successfully completed the module'}
                </p>

                <div className="z-10 mb-12 max-w-3xl">
                    <h3 className="font-serif text-3xl font-bold text-[#a77c52] mb-2">{moduleTitle}</h3>
                    {type !== 'Course Completion' && (
                        <p className="text-sm text-[#321C00]/60">{courseTitle}</p>
                    )}
                </div>

                {/* Details Grid */}
                <div className="z-10 w-full grid grid-cols-2 gap-8 mb-12 pt-6 border-t border-dashed border-[#a77c52]/10 max-w-2xl">
                    <div className="flex flex-col text-left pl-4">
                        <span className="text-[10px] uppercase tracking-wider text-[#321C00]/40 font-bold mb-1">Date of Completion</span>
                        <span className="font-serif text-lg text-[#321C00] font-semibold">{completionDate}</span>
                    </div>
                    <div className="flex flex-col text-right pr-4">
                        <span className="text-[10px] uppercase tracking-wider text-[#321C00]/40 font-bold mb-1">Certificate ID</span>
                        <span className="font-display text-base text-[#321C00] font-semibold tracking-wide">{certificateId}</span>
                    </div>
                </div>

                {/* Footer Signatures */}
                <div className="z-10 w-full flex items-end justify-between mt-auto px-8 pb-8">
                    <div className="flex flex-col items-center">
                        <div className="font-serif italic text-3xl text-[#321C00]/80 -rotate-2 mb-2 px-6" style={{ fontFamily: '"Playfair Display", serif' }}>{instructorName}</div>
                        <div className="h-px w-40 bg-[#321C00]/30 mb-2"></div>
                        <span className="text-[10px] uppercase font-bold text-[#321C00]/50 tracking-wider">{instructorTitle}</span>
                    </div>

                    <div className="relative flex items-center justify-center group">
                        <div className="absolute inset-0 bg-[#4CAF50]/20 rounded-full blur-md"></div>
                        <span className="material-symbols-outlined text-[64px] text-[#4CAF50] relative z-10 drop-shadow-sm">workspace_premium</span>
                        {/* Verified text below badge */}
                        <div className="absolute -bottom-6 text-[9px] font-bold text-[#4CAF50] uppercase tracking-wider">Verified</div>
                    </div>
                </div>

                <p className="absolute bottom-4 text-[9px] text-[#321C00]/30 text-center w-full">
                    This certificate verifies that the student has met all the requirements established by the Usafi Barista Training Center.
                </p>
            </div>
        </div>
    );
});

ModuleCertificate.displayName = "ModuleCertificate";

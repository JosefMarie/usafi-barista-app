import React from 'react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import QRCode from "react-qr-code";


const CoffeeWatermark = ({ className }) => (
    <svg viewBox="0 0 200 200" className={cn("w-[700px] h-[700px] text-[#a77c52] opacity-10 pointer-events-none select-none", className)} fill="currentColor">
        {/* Cup Body */}
        <path d="M40,60 C40,110 50,135 90,135 C130,135 140,110 140,60 L40,60 Z" />
        {/* Handle */}
        <path d="M140,70 C165,70 170,85 170,95 C170,110 160,120 140,125" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        {/* Saucer */}
        <path d="M20,135 L160,135" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        {/* Steam */}
        <path d="M60,40 Q70,20 60,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M90,35 Q100,15 90,5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
        <path d="M120,40 Q130,20 120,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {/* Coffee Beans */}
        <g transform="translate(145, 125) rotate(30)">
            <ellipse cx="10" cy="10" rx="12" ry="8" />
            <path d="M0,10 Q10,5 20,10" fill="none" stroke="#FAF5E8" strokeWidth="1.5" />
        </g>
        <g transform="translate(165, 110) rotate(-15)">
            <ellipse cx="10" cy="10" rx="12" ry="8" />
            <path d="M0,10 Q10,15 20,10" fill="none" stroke="#FAF5E8" strokeWidth="1.5" />
        </g>
        <g transform="translate(5, 125) rotate(-20)">
            <ellipse cx="10" cy="10" rx="12" ry="8" />
            <path d="M0,10 Q10,15 20,10" fill="none" stroke="#FAF5E8" strokeWidth="1.5" />
        </g>
    </svg>
);

export const StudentCertificate = React.forwardRef(({
    student,
    className
}, ref) => {
    const { t } = useTranslation();

    // Fallback data if student object is missing or incomplete
    const studentName = student?.fullName || student?.name || "Student Name";
    const certificateId = student?.uid || student?.id ? `USF-${(student.uid || student.id).slice(0, 8).toUpperCase()}` : "USF-CERT-0000";
    const completionDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const trainerName = "EBENEZER Ishimwe";
    const ceoName = "Sandrine GASARASI";

    return (
        <div ref={ref} className={cn("w-[297mm] h-[210mm] bg-[#FAF5E8] text-[#321C00] font-sans relative overflow-hidden mx-auto shadow-2xl print:shadow-none print:w-[297mm] print:h-[210mm] print:absolute print:top-0 print:left-0 print:m-0", className)}>
            {/* Styles matching the reference Tailwind config and Font setup */}
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
                    .font-serif { font-family: 'Playfair Display', serif; }
                    .font-display { font-family: 'Lexend', sans-serif; }
                    .bg-guilloche { background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBvcGFjaXR5PSIwLjAzIj48cGF0aCBkPSJNMjAgMjBMMCAwSDQwTDIwIDIwek0yMCAyMEw0MCA0MEgwTDIwIDIweiIgZmlsbD0iIzMyMUMwMCIvPjwvc3ZnPg=="); }
                    @page { size: A4 landscape; margin: 0; }
                    @media print {
                        body { -webkit-print-color-adjust: exact; }
                    }
                `}
            </style>

            {/* SVG Corner Ornaments */}
            <div className="absolute top-0 left-0 z-20 w-48 h-48 pointer-events-none">
                <img src="/leave_top_left_corner.svg" alt="" className="w-full h-full object-contain opacity-40 mix-blend-multiply" />
            </div>
            <div className="absolute top-0 right-0 z-20 w-48 h-48 pointer-events-none">
                <img src="/leave_top_right_corner.svg" alt="" className="w-full h-full object-contain opacity-40 mix-blend-multiply" />
            </div>
            <div className="absolute bottom-0 right-0 z-20 w-48 h-48 pointer-events-none">
                <img src="/leave_buttom_right_corner.svg" alt="" className="w-full h-full object-contain opacity-40 mix-blend-multiply" />
            </div>
            <div className="absolute bottom-0 left-0 z-20 w-48 h-48 pointer-events-none">
                <img src="/leave_buttom_left corner.svg" alt="" className="w-full h-full object-contain opacity-40 mix-blend-multiply" />
            </div>

            {/* Main Content Area */}
            <div className="m-6 border-4 border-[#a77c52]/20 border-double h-[calc(100%-3rem)] flex flex-col items-center text-center relative bg-guilloche px-16 py-8 justify-between z-10">

                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <CoffeeWatermark />
                </div>

                {/* Header Section */}
                <div className="z-10 bg-[#FAF5E8]/80 backdrop-blur-sm px-12 py-4 rounded-full border border-[#a77c52]/10 mb-2">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-full bg-[#a77c52]/10 flex items-center justify-center border border-[#a77c52]/30">
                                <span className="material-symbols-outlined text-[#a77c52] text-[24px]">coffee_maker</span>
                            </div>
                            <img src="/logo.jpg" alt="Usafi Logo" className="h-12 w-auto object-contain mix-blend-multiply" />
                        </div>
                        <p className="text-[14px] font-bold tracking-[0.3em] text-[#a77c52] uppercase">Usafi Barista Training Center</p>
                    </div>
                </div>

                {/* Title Section */}
                <div className="z-10 flex flex-col items-center">
                    <h1 className="font-serif text-7xl font-bold text-[#321C00] mb-2 tracking-wide uppercase drop-shadow-sm">Certificate</h1>
                    <p className="font-serif text-2xl italic text-[#321C00]/60 tracking-wider">of Appreciation</p>
                </div>

                {/* Recipient Section */}
                <div className="z-10 w-full flex flex-col items-center my-4">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#321C00]/50 font-bold mb-6">This is to certify that</p>
                    <h2 className="font-serif text-6xl font-bold text-[#321C00] w-full text-center pb-2 border-b-2 border-[#a77c52]/20 max-w-4xl px-8 mb-2 capitalize leading-tight">
                        {studentName}
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-[#a77c52] font-black mt-2">
                        {student?.courseId === 'bar-tender-course' ? 'Professional Mixology & Bar Management' : 'Professional Barista & Coffee Science'}
                    </p>
                </div>

                {/* Achievement Description */}
                <div className="z-10 max-w-4xl mx-auto">
                    <p className="text-lg text-[#321C00]/80 font-serif italic leading-relaxed">
                        {student?.courseId === 'bar-tender-course' ? (
                            <>
                                Has successfully completed the comprehensive professional bartender training program,
                                demonstrating exceptional proficiency in mixology, cocktail crafting,
                                bar operations, and beverage service excellence.
                            </>
                        ) : (
                            <>
                                Has successfully completed the comprehensive professional barista training program,
                                demonstrating exceptional proficiency in espresso extraction, milk texturing,
                                brewing methods, and customer service excellence.
                            </>
                        )}
                    </p>
                </div>

                {/* Details Grid */}
                <div className="z-10 w-full max-w-3xl flex justify-center gap-16 py-4 border-t border-b border-dashed border-[#a77c52]/20 my-2 bg-[#FAF5E8]/50">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-[#321C00]/40 font-bold mb-1">Date Issued</span>
                        <span className="font-serif text-xl text-[#321C00] font-semibold">{completionDate}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase tracking-wider text-[#321C00]/40 font-bold mb-1">Certificate ID</span>
                        <span className="font-display text-lg text-[#321C00] font-semibold tracking-wide">{certificateId}</span>
                    </div>
                </div>

                {/* Footer Signatures */}
                <div className="z-10 w-full flex items-end justify-between px-20">
                    <div className="flex flex-col items-center w-64">
                        <div className="font-serif italic text-3xl text-[#321C00]/80 -rotate-2 mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>{trainerName}</div>
                        <div className="h-0.5 w-full bg-[#321C00]/80 mb-2"></div>
                        <span className="text-[11px] uppercase font-bold text-[#321C00]/50 tracking-widest">Master Trainer</span>
                    </div>

                    {/* QR Code & Verified Badge */}
                    <div className="flex flex-col items-center justify-end mb-2 gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-[#a77c52]/20">
                            <QRCode
                                value={`https://usafi-barista.com/verify/${student.uid || student.id || student.uid}`}
                                size={64}
                                fgColor="#321C00"
                            />
                        </div>
                        <span className="text-[8px] uppercase tracking-widest text-[#a77c52] font-bold">Scan to Verify</span>
                    </div>

                    <div className="flex flex-col items-center w-64">
                        <div className="font-serif italic text-3xl text-[#321C00]/80 -rotate-2 mb-2" style={{ fontFamily: '"Playfair Display", serif' }}>{ceoName}</div>
                        <div className="h-0.5 w-full bg-[#321C00]/80 mb-2"></div>
                        <span className="text-[11px] uppercase font-bold text-[#321C00]/50 tracking-widest">C.E.O Usafi Coffee</span>
                    </div>
                </div>

            </div>
        </div>
    );
});

StudentCertificate.displayName = "StudentCertificate";

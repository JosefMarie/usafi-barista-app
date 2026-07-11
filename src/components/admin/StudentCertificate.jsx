import React from 'react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import QRCode from "react-qr-code";


const CoffeeWatermark = ({ className }) => (
    <svg viewBox="0 0 200 200" className={cn("w-[700px] h-[700px] text-[#a77c52] opacity-[0.08] pointer-events-none select-none", className)} fill="currentColor">
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

const formatTrainingDate = (dateValue) => {
    if (!dateValue) return "---";
    try {
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return "---";
    }
};

export const StudentCertificate = React.forwardRef(({
    student,
    courseId,
    courseTitle,
    className
}, ref) => {
    const { t } = useTranslation();

    const TARGET_COURSE_ID = courseId || student?.courseId || 'bean-to-brew';

    // Fallback data if student object is missing or incomplete
    const studentName = student?.fullName || student?.name || "Student Name";
    const certificateId = student?.uid || student?.id ? `USF-${(student.uid || student.id).slice(-8).toUpperCase()}` : "USF-GDI8LRNJ";
    
    const trainerName = "EBENEZER Ishimwe";
    const ceoName = "Sandrine GASARASI";

    return (
        <div 
            ref={ref} 
            className={cn("certificate-sheet bg-[#FAF5E8] text-[#321C00] font-sans relative mx-auto shadow-2xl print:shadow-none print:m-0 overflow-hidden", className)}
            style={{ width: '297mm', height: '210mm' }}
        >
            {/* Styles matching the reference Tailwind config and Font setup */}
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
                    .font-serif { font-family: 'Playfair Display', serif; }
                    .font-display { font-family: 'Lexend', sans-serif; }
                    .bg-guilloche { background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBvcGFjaXR5PSIwLjAzIj48cGF0aCBkPSJNMjAgMjBMMCAwSDQwTDIwIDIwek0yMCAyMEw0MCA0MEgwTDIwIDIweiIgZmlsbD0iIzMyMUMwMCIvPjwvc3ZnPg=="); }
                    
                    @page { 
                        size: A4 landscape; 
                        margin: 0 !important; 
                    }

                    @media print {
                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        html, body { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            background: white !important;
                            overflow: hidden !important;
                            height: 210mm !important;
                        }
                        .certificate-sheet {
                            display: block !important;
                            position: relative !important;
                            width: 297mm !important;
                            height: 210mm !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            box-shadow: none !important;
                            background-color: #FAF5E8 !important;
                            overflow: hidden !important;
                            page-break-after: avoid !important;
                        }
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
            <div className="m-6 border-4 border-[#a77c52]/20 border-double h-[calc(210mm-3rem)] flex flex-col items-center text-center relative bg-guilloche px-16 pt-6 pb-8 justify-between z-10 overflow-hidden">

                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <CoffeeWatermark />
                </div>

                {/* Header Section */}
                <div className="z-10 bg-[#FAF5E8]/80 backdrop-blur-sm print:bg-[#FAF5E8] px-12 py-4 rounded-full border border-[#a77c52]/10 mb-2">
                    <div className="flex flex-col items-center">
                        <div className="flex items-center gap-4 mb-1">
                            <img src="/logo.jpg" alt="Usafi Logo" className="h-28 w-auto object-contain mix-blend-multiply" />
                        </div>
                        <p className="text-[12px] font-bold tracking-[0.3em] text-[#a77c52] uppercase">Usafi Barista Training Center</p>
                    </div>
                </div>

                {/* Title Section */}
                <div className="z-10 flex flex-col items-center">
                    <h1 className="font-serif text-7xl font-bold text-[#321C00] mb-2 tracking-wide uppercase drop-shadow-sm">Certificate</h1>
                    <p className="font-serif text-2xl italic text-[#321C00]/60 tracking-wider">of Appreciation</p>
                </div>

                {/* Presentation Section */}
                <div className="z-10 flex flex-col items-center w-full">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#a77c52] mb-6">This is to certify that</p>
                    <h2 className="font-serif text-6xl font-black text-[#321C00] mb-3 tracking-tight border-b-2 border-[#a77c52]/30 px-12 pb-2">{studentName}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#a77c52] mb-6">
                        {courseTitle || (
                            TARGET_COURSE_ID === 'combined' 
                                ? 'Dual Certification: Barista & Mixology Program'
                                : TARGET_COURSE_ID === 'bar-tender-course' 
                                    ? 'Professional Mixology & Bar Management' 
                                    : 'Professional Barista & Coffee Science'
                        )}
                    </p>
                    <p className="max-w-2xl text-[11px] leading-relaxed text-[#321C00]/80 font-medium italic">
                        {TARGET_COURSE_ID === 'combined' ? (
                            "Has successfully completed the comprehensive dual-certification training program, demonstrating exceptional proficiency in espresso extraction, milk texturing, brewing methods, mixology, cocktail crafting, and beverage service excellence."
                        ) : TARGET_COURSE_ID === 'bar-tender-course' ? (
                            "Has successfully completed the comprehensive professional bartender training program, demonstrating exceptional proficiency in mixology, cocktail crafting, bar operations, and beverage service excellence."
                        ) : (
                            "Has successfully completed the comprehensive professional barista training program, demonstrating exceptional proficiency in espresso extraction, milk texturing, brewing methods, and customer service excellence."
                        )}
                    </p>
                </div>

                {/* Footer Details */}
                <div className="z-10 w-full flex justify-between items-end mt-4 px-4">
                    <div className="flex flex-col items-center w-64">
                        <div className="h-16 w-full flex items-center justify-center relative">
                            <img 
                                src="/image/Ebenezer_Signature.png" 
                                alt="Trainer Signature" 
                                className="h-16 w-auto object-contain mix-blend-multiply opacity-90 absolute bottom-0 translate-y-1/4" 
                            />
                        </div>
                        <div className="h-0.5 w-full bg-[#321C00]/80 mb-1"></div>
                        <div className="flex flex-col items-center">
                            <span className="font-serif italic text-lg text-[#321C00]/80 mb-1">{trainerName}</span>
                            <span className="text-[10px] uppercase font-bold text-[#321C00]/50 tracking-widest">Master Trainer</span>
                        </div>
                    </div>

                    {/* QR Code & Verified Badge */}
                    <div className="flex flex-col items-center justify-end mb-4 gap-2">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-[#a77c52]/20 scale-90">
                            <QRCode
                                value={`https://usafi-barista.com/verify/${student.uid || student.id}`}
                                size={60}
                                fgColor="#321C00"
                            />
                        </div>
                        <span className="text-[7px] uppercase tracking-widest text-[#a77c52] font-bold print:text-[#a77c52]">Scan to Verify</span>
                    </div>

                    <div className="flex flex-col items-center w-64 relative">
                        {/* Stamp */}
                        <img 
                            src="/image/Stamp PNg.png" 
                            alt="Official Stamp" 
                            className="absolute -top-12 -right-8 w-32 h-32 object-contain opacity-80 mix-blend-multiply pointer-events-none" 
                        />
                        <div className="h-16 w-full flex items-center justify-center relative">
                            <img 
                                src="/image/GASARASI_Signature.png" 
                                alt="CEO Signature" 
                                className="h-20 w-auto object-contain mix-blend-multiply opacity-95 absolute bottom-0 translate-y-1/4" 
                            />
                        </div>
                        <div className="h-0.5 w-full bg-[#321C00]/80 mb-1"></div>
                        <div className="flex flex-col items-center">
                            <span className="font-serif italic text-lg text-[#321C00]/80 mb-1">{ceoName}</span>
                            <span className="text-[10px] uppercase font-bold text-[#321C00]/50 tracking-widest">C.E.O Usafi Coffee</span>
                        </div>
                    </div>
                </div>

                {/* Training Period & ID */}
                <div className="z-10 w-full flex justify-around items-center pt-4 border-t border-[#a77c52]/10">
                    <div className="text-center">
                        <p className="text-[7px] font-black uppercase tracking-widest text-[#a77c52] mb-1">Training Period</p>
                        <p className="text-[9px] font-bold text-[#321C00]">
                            {TARGET_COURSE_ID === 'combined' && student.dualStartDate ? (
                                <>
                                    {formatTrainingDate(student.dualStartDate)}
                                    {' - '}
                                    {formatTrainingDate(student.dualEndDate)}
                                </>
                            ) : (
                                <>
                                    {formatTrainingDate(student.courseStartDate)}
                                    {' - '}
                                    {formatTrainingDate(student.courseEndDate)}
                                </>
                            )}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[7px] font-black uppercase tracking-widest text-[#a77c52] mb-1">Certificate ID</p>
                        <p className="text-[9px] font-bold text-[#321C00] uppercase">{certificateId}</p>
                    </div>
                </div>

            </div>
        </div>
    );
});

StudentCertificate.displayName = "StudentCertificate";

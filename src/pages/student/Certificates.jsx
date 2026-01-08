
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { ModuleCertificate } from '../../components/student/ModuleCertificate';

export function Certificates() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [earnedCertificates, setEarnedCertificates] = useState([]);

    // Printing State
    const componentRef = useRef();
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: selectedCertificate ? `${selectedCertificate.moduleTitle} Certificate` : 'Certificate',
        onAfterPrint: () => setIsPrinting(false),
    });

    useEffect(() => {
        if (selectedCertificate && isPrinting) {
            // Wait for ref to be populated
            const timer = setTimeout(() => {
                if (componentRef.current) {
                    handlePrint();
                } else {
                    console.error("Certificate ref not ready");
                    setIsPrinting(false);
                }
            }, 500); // Increased timeout to be safe
            return () => clearTimeout(timer);
        }
    }, [selectedCertificate, isPrinting, handlePrint]);

    const onPrintClick = (cert) => {
        setSelectedCertificate(cert);
        setIsPrinting(true);
    };

    useEffect(() => {
        const fetchCertificates = async () => {
            if (!user) return;

            try {
                // 1. Get all completed progress records
                const progressRef = collection(db, 'users', user.uid, 'progress');
                // Check both 'completed' status AND 'passed' boolean just in case
                const q = query(progressRef, where('passed', '==', true));
                const querySnapshot = await getDocs(q);

                const moduleCerts = [];
                const courseProgress = {}; // { courseId: { passedModules: Set<moduleId>, courseTitle: string } }

                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    const { courseId, moduleId, completedAt } = data;

                    try {
                        const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
                        const courseRef = doc(db, 'courses', courseId);

                        const [moduleSnap, courseSnap] = await Promise.all([
                            getDoc(moduleRef),
                            getDoc(courseRef)
                        ]);

                        if (moduleSnap.exists() && courseSnap.exists()) {
                            const courseData = courseSnap.data();

                            // Initialize course progress tracking
                            if (!courseProgress[courseId]) {
                                courseProgress[courseId] = {
                                    passCount: 0,
                                    title: courseData.title,
                                    lastCompletionDate: completedAt?.toDate() // Track latest date
                                };
                            }
                            courseProgress[courseId].passCount += 1;
                            // Update latest completion date
                            const certDate = completedAt?.toDate();
                            if (certDate && (!courseProgress[courseId].lastCompletionDate || certDate > courseProgress[courseId].lastCompletionDate)) {
                                courseProgress[courseId].lastCompletionDate = certDate;
                            }

                            moduleCerts.push({
                                id: docSnap.id,
                                courseTitle: courseData.title,
                                moduleTitle: moduleSnap.data().title,
                                completionDate: completedAt?.toDate().toLocaleDateString() || 'N/A',
                                type: 'Module Completion'
                            });
                        }
                    } catch (err) {
                        console.error("Error fetching details for cert", docSnap.id, err);
                    }
                }

                // 2. Check for Course Completion Certificates
                // For each course user has progress in, pass check against total modules
                const courseCerts = [];
                for (const courseId of Object.keys(courseProgress)) {
                    // Fetch total modules for this course
                    const modulesRef = collection(db, 'courses', courseId, 'modules');
                    const modulesSnap = await getDocs(modulesRef);
                    const totalModules = modulesSnap.size;

                    if (totalModules > 0 && courseProgress[courseId].passCount >= totalModules) {
                        // User has passed ALL modules
                        courseCerts.push({
                            id: `course-complete-${courseId}`,
                            courseTitle: courseProgress[courseId].title,
                            moduleTitle: courseProgress[courseId].title, // For display purposes, the main title is the course title
                            completionDate: courseProgress[courseId].lastCompletionDate?.toLocaleDateString() || new Date().toLocaleDateString(),
                            type: 'Course Completion' // Special type
                        });
                    }
                }

                // Combine: Course Certs First, then Module Certs
                setEarnedCertificates([...courseCerts, ...moduleCerts]);

            } catch (error) {
                console.error("Error fetching certificates:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, [user]);



    if (loading) return <div className="flex h-full items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-[#a77c52]">progress_activity</span></div>;

    return (
        <div className="flex flex-col h-full w-full">
            {/* Header */}
            <header className="bg-[#F5DEB3]/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md border-b border-espresso/10 p-5 md:p-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="h-10 w-10 md:h-14 md:w-14 flex items-center justify-center bg-espresso text-white rounded-xl md:rounded-2xl shadow-xl md:rotate-3">
                        <span className="material-symbols-outlined text-xl md:text-2xl">workspace_premium</span>
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-xl md:text-3xl text-espresso dark:text-white leading-tight">{t('student.certificates.title_alt')}</h1>
                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-[0.2em] mt-0.5 md:mt-1">{t('student.certificates.subtitle_alt')}</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                {earnedCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {earnedCertificates.map((cert) => (
                            <div key={cert.id} className={cn(
                                "group bg-[#F5DEB3] dark:bg-white/5 rounded-[1.5rem] md:rounded-3xl border border-espresso/10 shadow-xl hover:shadow-2xl transition-all overflow-hidden flex flex-col relative",
                                cert.type === 'Course Completion' ? "ring-2 ring-espresso" : ""
                            )}>
                                <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                                <div className={cn(
                                    "h-24 md:h-32 flex items-center justify-center relative overflow-hidden transition-colors",
                                    cert.type === 'Course Completion' ? "bg-espresso text-white" : "bg-espresso/5"
                                )}>
                                    <span className={cn(
                                        "material-symbols-outlined text-6xl md:text-8xl absolute -bottom-4 md:-bottom-6 -right-4 md:-right-6 rotate-12 transition-transform group-hover:rotate-0 duration-700",
                                        cert.type === 'Course Completion' ? "text-white/10" : "text-espresso/10"
                                    )}>workspace_premium</span>

                                    <div className={cn(
                                        "text-[9px] md:text-[10px] font-black px-3 md:px-4 py-1.5 rounded-full shadow-lg z-10 uppercase tracking-[0.2em] animate-fade-in",
                                        cert.type === 'Course Completion' ? "bg-white text-espresso" : "bg-espresso text-white"
                                    )}>
                                        {cert.type === 'Course Completion' ? t('student.certificates.distinction_diploma') : t('student.certificates.module_validation')}
                                    </div>
                                </div>
                                <div className="p-6 md:p-8 flex-1 flex flex-col relative z-10">
                                    <h3 className="font-serif font-bold text-espresso dark:text-white text-lg md:text-xl leading-tight mb-1.5 md:mb-2 group-hover:translate-x-1 transition-transform">{cert.moduleTitle}</h3>
                                    {cert.type !== 'Course Completion' && (
                                        <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-4 md:mb-6">{cert.courseTitle}</p>
                                    )}

                                    <div className="mt-auto flex items-center justify-between pt-4 md:pt-6 border-t border-espresso/5">
                                        <div>
                                            <p className="text-[9px] md:text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest mb-0.5 md:mb-1">{t('student.certificates.authenticated')}</p>
                                            <p className="text-xs md:text-sm font-bold text-espresso dark:text-white">{cert.completionDate}</p>
                                        </div>
                                        <button
                                            onClick={() => onPrintClick(cert)}
                                            className="size-10 md:size-12 flex items-center justify-center bg-espresso text-white rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-90 transition-all"
                                            title={t('student.certificates.export_btn')}
                                        >
                                            <span className="material-symbols-outlined text-lg md:text-xl">ios_share</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] md:h-[70vh] text-center space-y-6 md:space-y-8 animate-fade-in relative overflow-hidden group py-12">
                        <div className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 bg-espresso/5 group-hover:bg-espresso/10 transition-colors"></div>
                        <div className="size-24 md:size-32 bg-[#F5DEB3] dark:bg-white/5 rounded-2xl md:rounded-3xl border border-espresso/10 flex items-center justify-center shadow-2xl relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20"></div>
                            <span className="material-symbols-outlined text-4xl md:text-6xl text-espresso/20 animate-pulse">workspaces</span>
                        </div>
                        <div className="px-4">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-espresso dark:text-white mb-2 md:mb-3">{t('student.certificates.empty.title_alt')}</h2>
                            <p className="text-xs md:text-sm font-medium text-espresso/40 dark:text-white/40 w-full max-w-xs mx-auto uppercase tracking-widest leading-relaxed">
                                {t('student.certificates.empty.description_alt')}
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Printable Component - Hidden by default via CSS classes */}
            {selectedCertificate && (
                <ModuleCertificate
                    ref={componentRef}
                    studentName={user?.name || user?.fullName || user?.email || "Student Name"}
                    moduleTitle={selectedCertificate.moduleTitle}
                    courseTitle={selectedCertificate.courseTitle}
                    completionDate={selectedCertificate.completionDate}
                    type={selectedCertificate.type}
                />
            )}
        </div>
    );
}


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
            <header className="bg-white dark:bg-[#1e1e1e] border-b border-black/5 dark:border-white/5 p-6 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#a77c52]/10 rounded-lg text-[#a77c52]">
                        <span className="material-symbols-outlined text-xl">workspace_premium</span>
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-xl text-[#321C00] dark:text-white">My Credentials</h1>
                        <p className="text-xs font-medium text-[#321C00]/60 dark:text-white/60">Manage and print your earned certificates</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-6 overflow-y-auto">
                {earnedCertificates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {earnedCertificates.map((cert) => (
                            <div key={cert.id} className={cn(
                                "group bg-white dark:bg-[#2c2825] rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col",
                                cert.type === 'Course Completion' ? "border-[#a77c52] ring-1 ring-[#a77c52]" : "border-black/5 dark:border-white/5"
                            )}>
                                <div className={cn(
                                    "h-24 flex items-center justify-center relative overflow-hidden",
                                    cert.type === 'Course Completion' ? "bg-[#a77c52] text-white" : "bg-[#a77c52]/5"
                                )}>
                                    <span className={cn(
                                        "material-symbols-outlined text-6xl absolute -bottom-4 -right-4 rotate-12",
                                        cert.type === 'Course Completion' ? "text-white/20" : "text-[#a77c52]/20"
                                    )}>workspace_premium</span>

                                    <div className={cn(
                                        "text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10 uppercase tracking-wider",
                                        cert.type === 'Course Completion' ? "bg-white text-[#a77c52]" : "bg-[#a77c52] text-white"
                                    )}>
                                        {cert.type === 'Course Completion' ? 'Course Diploma' : 'Verified Module'}
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-[#321C00] dark:text-white text-lg leading-tight mb-1">{cert.moduleTitle}</h3>
                                    {cert.type !== 'Course Completion' && (
                                        <p className="text-xs text-[#321C00]/60 dark:text-white/60 font-medium uppercase tracking-wide mb-4">{cert.courseTitle}</p>
                                    )}

                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                                        <p className="text-xs text-[#321C00]/50 dark:text-white/50">Issued: {cert.completionDate}</p>
                                        <button
                                            onClick={() => onPrintClick(cert)}
                                            className="flex items-center gap-2 text-[#a77c52] hover:bg-[#a77c52]/10 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                                            title="Download/Print Certificate"
                                        >
                                            <span className="material-symbols-outlined text-lg">download</span>
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-4xl text-gray-400">school</span>
                        </div>
                        <h2 className="text-xl font-bold text-[#321C00] dark:text-white mb-2">No Certificates Yet</h2>
                        <p className="text-[#321C00]/60 dark:text-white/60 max-w-sm mx-auto">
                            Complete modules and pass assessments to earn verified certificates.
                        </p>
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

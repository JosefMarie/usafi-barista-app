
import React, { useState, useRef, useEffect } from 'react';
import { storage, db } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useReactToPrint } from 'react-to-print';
import { cn } from '../../lib/utils';

export function CVBuilder() {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const componentRef = useRef();

    // UI State
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('personal'); // 'personal', 'summary', 'certs', 'skills', 'education', 'experience'

    // Data State
    const [cvData, setCvData] = useState({
        personalInfo: {
            fullName: "",
            phone: "",
            email: "",
            linkedin: "",
            photoURL: "https://ui-avatars.com/api/?name=Student&background=random"
        },
        summary: "",
        experience: [],
        education: [],
        skills: {
            core: [],
            other: []
        },
        selectedCertificates: [] // Array of IDs
    });

    // Dynamic Data from System
    const [earnedCertificates, setEarnedCertificates] = useState([]);

    // --- Loading Data ---
    useEffect(() => {
        const initData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // 1. Fetch System Certificates (Verified)
                const progressRef = collection(db, 'users', user.uid, 'progress');
                const q = query(progressRef, where('passed', '==', true));
                const querySnapshot = await getDocs(q);

                const certs = [];
                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    const { courseId, moduleId, completedAt } = data;
                    try {
                        const moduleRef = doc(db, 'courses', courseId, 'modules', moduleId);
                        const moduleSnap = await getDoc(moduleRef);
                        if (moduleSnap.exists()) {
                            certs.push({
                                id: moduleId,
                                title: moduleSnap.data().title,
                                date: completedAt?.toDate().toLocaleDateString() || 'N/A',
                                issuer: 'Usafi Training Center'
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching cert detail", e);
                    }
                }
                setEarnedCertificates(certs);

                // 2. Fetch User's Saved Draft
                const draftdocRef = doc(db, 'users', user.uid, 'cv_data', 'draft');
                const draftSnap = await getDoc(draftdocRef);

                if (draftSnap.exists()) {
                    // Merge saved draft
                    const savedData = draftSnap.data();
                    setCvData(prev => ({
                        ...prev,
                        ...savedData,
                        personalInfo: { ...prev.personalInfo, ...savedData.personalInfo },
                        skills: { ...prev.skills, ...savedData.skills }
                    }));
                } else {
                    // Initialize defaults from User Profile
                    setCvData(prev => ({
                        ...prev,
                        personalInfo: {
                            ...prev.personalInfo,
                            fullName: user.displayName || user.fullName || "",
                            email: user.email || "",
                            photoURL: user.photoURL || prev.personalInfo.photoURL
                        },
                        // Auto-select all verified certs by default
                        selectedCertificates: certs.map(c => c.id)
                    }));
                }

            } catch (error) {
                console.error("Error initializing CV Builder:", error);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [user]);

    // --- Handlers ---

    // Generic Change Handler for Personal Info
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setCvData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [name]: value }
        }));
    };

    // Summary Change
    const handleSummaryChange = (e) => {
        setCvData(prev => ({ ...prev, summary: e.target.value }));
    };

    // Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const storageRef = ref(storage, `cv_profiles/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setCvData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, photoURL: downloadURL }
            }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    // Certificates Selection
    const toggleCertificate = (id) => {
        setCvData(prev => {
            const newSet = new Set(prev.selectedCertificates);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return { ...prev, selectedCertificates: Array.from(newSet) };
        });
    };

    // Skills
    const addSkill = (type, skillName) => {
        if (!skillName) return;
        setCvData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                [type]: [...(prev.skills[type] || []), skillName]
            }
        }));
    };

    const removeSkill = (type, index) => {
        setCvData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                [type]: prev.skills[type].filter((_, i) => i !== index)
            }
        }));
    };

    // Education
    const addEducation = () => {
        setCvData(prev => ({
            ...prev,
            education: [...prev.education, { id: Date.now(), school: "", degree: "", year: "", description: "" }]
        }));
    };

    const updateEducation = (index, field, value) => {
        const newEdu = [...cvData.education];
        newEdu[index][field] = value;
        setCvData(prev => ({ ...prev, education: newEdu }));
    };

    const removeEducation = (index) => {
        setCvData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    // Experience
    const addExperience = () => {
        setCvData(prev => ({
            ...prev,
            experience: [...prev.experience, { id: Date.now(), title: "", company: "", startDate: "", endDate: "", description: "" }]
        }));
    };

    const updateExperience = (index, field, value) => {
        const newExp = [...cvData.experience];
        newExp[index][field] = value;
        setCvData(prev => ({ ...prev, experience: newExp }));
    };

    const removeExperience = (index) => {
        setCvData(prev => ({
            ...prev,
            experience: prev.experience.filter((_, i) => i !== index)
        }));
    };

    // Save Draft
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setSaveSuccess(false);
        try {
            await setDoc(doc(db, 'users', user.uid, 'cv_data', 'draft'), {
                ...cvData,
                updatedAt: new Date()
            });
            setSaving(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error saving draft", error);
            setSaving(false);
            alert("Failed to save draft. Please try again.");
        }
    };

    // Print / Download
    const [isPrinting, setIsPrinting] = useState(false);

    const reactToPrintFn = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `${cvData.personalInfo.fullName || 'User'}_CV`,
        onAfterPrint: () => setIsPrinting(false),
        onPrintError: () => setIsPrinting(false), // Ensure state resets on error
    });

    const handlePrint = () => {
        setIsPrinting(true);
        // Small timeout to ensure state update and ref readiness
        setTimeout(() => {
            if (componentRef.current) {
                reactToPrintFn();
            } else {
                console.error("Print ref is null");
                alert("Unable to generate PDF. Please try saving first.");
                setIsPrinting(false); // Reset state so user isn't stuck
            }
        }, 500); // Increased timeout slightly to be safe
    };

    if (loading) return <div className="h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-[#a77c52]">progress_activity</span></div>;

    const completeness = calculateCompleteness(cvData);

    return (
        <div className="flex flex-col h-full w-full items-center">
            <style>{`
                ::-webkit-scrollbar { width: 0px; background: transparent; }
                .accordion-content { transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out; max-height: 0; opacity: 0; overflow: hidden; }
                details[open] .accordion-content { max-height: 2000px; opacity: 1; }
                details summary::-webkit-details-marker { display: none; }
            `}</style>

            <div className="relative flex h-full min-h-[800px] w-full flex-col max-w-md shadow-2xl overflow-hidden bg-[#FAF5E8] dark:bg-[#1c1916] rounded-xl border border-[#a77c52]/10">

                {/* Header */}
                <div className="sticky top-0 z-50 bg-[#FAF5E8]/95 dark:bg-[#1c1916]/95 backdrop-blur-sm border-b border-[#a77c52]/10 text-[#321C00] dark:text-[#FAF5E8]">
                    <div className="flex items-center p-4 pb-2 justify-between">
                        <button className="text-[#321C00] dark:text-[#FAF5E8] hover:bg-[#a77c52]/10 rounded-full p-2 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                        </button>
                        <h2 className="text-[#321C00] dark:text-[#FAF5E8] text-xl font-bold font-serif leading-tight">CV Builder</h2>

                        <div className="flex w-24 items-center justify-end">
                            {saveSuccess ? (
                                <span className="text-green-600 text-xs font-bold animate-fade-in flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">check_circle</span> Saved
                                </span>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="text-[#a77c52] text-sm font-bold tracking-wide hover:text-[#8c6642] transition-colors disabled:opacity-50 flex items-center gap-1"
                                >
                                    {saving ? <span className="material-symbols-outlined animate-spin text-xs">refresh</span> : null}
                                    {saving ? "Saving" : "Save"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 px-6 pb-4">
                        <div className="flex gap-6 justify-between items-end">
                            <p className="text-[#321C00]/70 dark:text-[#FAF5E8]/70 text-xs font-medium">Profile Completeness</p>
                            <p className="text-[#a77c52] text-xs font-bold">{completeness}%</p>
                        </div>
                        <div className="rounded-full bg-[#a77c52]/20 h-1.5 w-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#a77c52] transition-all duration-500 ease-out" style={{ width: `${completeness}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide p-4 flex flex-col gap-4">

                    {/* Personal Info */}
                    <SectionDetails
                        title="Personal Info"
                        icon="person"
                        isOpen={activeSection === 'personal'}
                        onToggle={(open) => setActiveSection(open ? 'personal' : null)}
                    >
                        <div className="flex items-center gap-4 mb-2">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-16 h-16 rounded-full bg-[#a77c52]/10 flex items-center justify-center border-2 border-[#a77c52] border-dashed relative overflow-hidden cursor-pointer shrink-0"
                            >
                                {uploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#a77c52]"></div> : (
                                    <>
                                        {cvData.personalInfo.photoURL ? (
                                            <img src={cvData.personalInfo.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : <span className="material-symbols-outlined text-[#a77c52]">add_a_photo</span>}
                                    </>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <div>
                                <p className="text-[#321C00] font-medium text-sm dark:text-[#FAF5E8]">Profile Photo</p>
                                <p className="text-[#321C00]/50 text-xs dark:text-[#FAF5E8]/50">Professional headshot</p>
                            </div>
                        </div>

                        <Input label="Full Name" name="fullName" value={cvData.personalInfo.fullName} onChange={handleInfoChange} placeholder="e.g. Jane Doe" />
                        <Input label="Phone" name="phone" value={cvData.personalInfo.phone} onChange={handleInfoChange} placeholder="+254..." icon="call" />
                        <Input label="Email" name="email" value={cvData.personalInfo.email} onChange={handleInfoChange} placeholder="email@example.com" type="email" icon="mail" />
                        <Input label="LinkedIn" name="linkedin" value={cvData.personalInfo.linkedin} onChange={handleInfoChange} placeholder="linkedin.com/in/..." icon="link" />
                    </SectionDetails>

                    {/* Summary */}
                    <SectionDetails
                        title="Summary"
                        icon="description"
                        isOpen={activeSection === 'summary'}
                        onToggle={(open) => setActiveSection(open ? 'summary' : null)}
                    >
                        <div className="w-full">
                            <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium pb-2">Professional Objective</p>
                            <textarea
                                value={cvData.summary}
                                onChange={handleSummaryChange}
                                className="w-full rounded-lg text-[#321C00] border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 min-h-[120px] p-3 text-sm resize-none focus:outline-none focus:border-[#a77c52] focus:ring-1 focus:ring-[#a77c52]"
                                placeholder="Briefly describe your passion for coffee..."
                            />
                            <p className="text-xs text-[#a77c52] mt-1 text-right">{cvData.summary.length} chars</p>
                        </div>
                    </SectionDetails>

                    {/* Certifications - Verified */}
                    <SectionDetails
                        title="Certifications"
                        icon="verified"
                        isOpen={activeSection === 'certs'}
                        onToggle={(open) => setActiveSection(open ? 'certs' : null)}
                    >
                        <div className="bg-[#a77c52]/5 rounded-xl p-4 border border-[#a77c52]/20 mb-5 relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <span className="material-symbols-outlined text-[#a77c52] text-[20px]">school</span>
                                <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8] uppercase">Usafi Earned Credentials</p>
                            </div>
                            {earnedCertificates.length > 0 ? earnedCertificates.map(cert => (
                                <label key={cert.id} className={`flex items-start gap-3 p-3 rounded-lg border mb-2 cursor-pointer transition-colors ${cvData.selectedCertificates.includes(cert.id) ? "bg-white dark:bg-neutral-900 border-[#a77c52]/40" : "opacity-60 border-transparent hover:bg-black/5"}`}>
                                    <input type="checkbox" className="hidden" checked={cvData.selectedCertificates.includes(cert.id)} onChange={() => toggleCertificate(cert.id)} />
                                    <span className={`material-symbols-outlined text-[20px] ${cvData.selectedCertificates.includes(cert.id) ? "text-[#a77c52]" : "text-gray-400"}`}>
                                        {cvData.selectedCertificates.includes(cert.id) ? 'check_circle' : 'circle'}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8]">{cert.title}</p>
                                        <p className="text-xs text-[#321C00]/70">Verified • {cert.date}</p>
                                    </div>
                                </label>
                            )) : <p className="text-sm italic opacity-60">No verified modules yet.</p>}
                        </div>
                    </SectionDetails>

                    {/* Skills */}
                    <SectionDetails
                        title="Skills"
                        icon="psychology"
                        isOpen={activeSection === 'skills'}
                        onToggle={(open) => setActiveSection(open ? 'skills' : null)}
                    >
                        <div className="mb-4">
                            <p className="text-xs font-bold uppercase text-[#321C00]/60 mb-2">My Skills</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {cvData.skills.other?.map((skill, idx) => (
                                    <span key={idx} className="px-3 py-1 rounded-full bg-white dark:bg-neutral-900 border border-[#a77c52]/30 text-xs font-medium flex items-center gap-2">
                                        {skill}
                                        <button onClick={() => removeSkill('other', idx)} className="hover:text-red-500"><span className="material-symbols-outlined text-[14px]">close</span></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 rounded-lg border border-[#a77c52]/30 bg-transparent h-10 px-3 text-sm placeholder:text-[#321C00]/30"
                                    placeholder="Add skill (e.g. Latte Art)"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { addSkill('other', e.target.value); e.target.value = ''; } }}
                                />
                                <button className="w-10 h-10 rounded-lg bg-[#a77c52] text-white flex items-center justify-center" onClick={(e) => { const input = e.currentTarget.previousSibling; addSkill('other', input.value); input.value = ''; }}>
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>
                    </SectionDetails>

                    {/* Education - Dynamic List */}
                    <SectionDetails
                        title="Education"
                        icon="school"
                        isOpen={activeSection === 'education'}
                        onToggle={(open) => setActiveSection(open ? 'education' : null)}
                    >
                        {cvData.education.map((edu, idx) => (
                            <div key={edu.id} className="bg-[#FAF5E8]/50 dark:bg-neutral-900 rounded-lg p-3 border border-[#a77c52]/20 mb-3 relative group">
                                <button onClick={() => removeEducation(idx)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                <div className="grid gap-3">
                                    <Input placeholder="School Name" value={edu.school} onChange={(e) => updateEducation(idx, 'school', e.target.value)} />
                                    <Input placeholder="Degree / Course" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} />
                                    <Input placeholder="Year" value={edu.year} onChange={(e) => updateEducation(idx, 'year', e.target.value)} />
                                </div>
                            </div>
                        ))}
                        <button onClick={addEducation} className="w-full py-3 rounded-lg border border-dashed border-[#a77c52]/40 text-[#a77c52] bg-[#a77c52]/5 hover:bg-[#a77c52]/10 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">add_circle</span> Add Education
                        </button>
                    </SectionDetails>

                    {/* Experience - Dynamic List */}
                    <SectionDetails
                        title="Work Experience"
                        icon="work"
                        isOpen={activeSection === 'experience'}
                        onToggle={(open) => setActiveSection(open ? 'experience' : null)}
                    >
                        {cvData.experience.map((exp, idx) => (
                            <div key={exp.id} className="bg-[#FAF5E8]/50 dark:bg-neutral-900 rounded-lg p-3 border border-[#a77c52]/20 mb-3 relative group">
                                <button onClick={() => removeExperience(idx)} className="absolute top-2 right-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                <div className="grid gap-3">
                                    <Input placeholder="Job Title" value={exp.title} onChange={(e) => updateExperience(idx, 'title', e.target.value)} />
                                    <Input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="month" label="Start" value={exp.startDate} onChange={(e) => updateExperience(idx, 'startDate', e.target.value)} />
                                        <Input type="month" label="End" value={exp.endDate} onChange={(e) => updateExperience(idx, 'endDate', e.target.value)} />
                                    </div>
                                    <textarea
                                        className="w-full rounded-lg border border-[#a77c52]/30 bg-transparent p-2 text-sm h-20 resize-none"
                                        placeholder="Responsibilities..."
                                        value={exp.description}
                                        onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                        <button onClick={addExperience} className="w-full py-3 rounded-lg border border-dashed border-[#a77c52]/40 text-[#a77c52] bg-[#a77c52]/5 hover:bg-[#a77c52]/10 transition-colors flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">add_circle</span> Add Experience
                        </button>
                    </SectionDetails>

                </div>

                {/* Footer Actions */}
                <div className="fixed bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 border-t border-[#a77c52]/10 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 rounded-b-xl md:absolute">
                    <div className="flex gap-3">
                        {saveSuccess ? (
                            <button disabled className="flex-1 h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-green-600 text-green-600 font-bold bg-green-50">
                                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                Saved!
                            </button>
                        ) : (
                            <button onClick={handleSave} disabled={saving} className="flex-1 h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-[#a77c52] text-[#a77c52] font-bold hover:bg-[#a77c52]/5 transition-colors">
                                {saving ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                                {saving ? "Saving..." : "Save"}
                            </button>
                        )}
                        <button onClick={handlePrint} disabled={isPrinting} className="flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-lg bg-[#a77c52] text-white font-bold shadow-md hover:bg-[#8c6642] transition-colors">
                            {isPrinting ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : <span className="material-symbols-outlined text-[20px]">download</span>}
                            {isPrinting ? "Preparing..." : "Download PDF"}
                        </button>
                    </div>
                </div>

            </div>

            {/* Print View Component - MOVED OUTSIDE to prevent clipping/hiding issues */}
            <div style={{ position: 'fixed', top: '200vh', left: 0, width: '210mm', minHeight: '297mm' }}>
                <div ref={componentRef}>
                    <CVPrintView data={cvData} certificates={earnedCertificates} />
                </div>
            </div>
        </div>
    );
}


// --- Helper Components ---

function SectionDetails({ title, icon, children, isOpen, onToggle }) {
    return (
        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden" open={isOpen}>
            <summary
                onClick={(e) => { e.preventDefault(); onToggle(!isOpen); }}
                className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                    </div>
                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">{title}</p>
                </div>
                <span className={`material-symbols-outlined text-[#a77c52] transition-transform duration-300 \${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </summary>
            {isOpen && (
                <div className="px-5 pb-6 pt-2 border-t border-[#a77c52]/5 animate-fade-in">
                    {children}
                </div>
            )}
        </details>
    );
}

function Input({ label, icon, ...props }) {
    return (
        <label className="flex flex-col w-full">
            {label && <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">{label}</p>}
            <div className="relative">
                {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#321C00]/40 material-symbols-outlined text-[18px]">{icon}</span>}
                <input
                    className={`w-full rounded-lg text-[#321C00] dark:text-[#FAF5E8] border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-10 p-3 text-sm placeholder:text-[#321C00]/30 outline-none transition-all ${icon ? 'pl-10' : ''}`}
                    {...props}
                />
            </div>
        </label>
    );
}

function calculateCompleteness(data) {
    let score = 0;
    if (data.personalInfo.fullName) score += 10;
    if (data.personalInfo.email) score += 10;
    if (data.personalInfo.phone) score += 10;
    if (data.personalInfo.photoURL) score += 10;
    if (data.summary) score += 10;
    if (data.education.length > 0) score += 20;
    if (data.experience.length > 0) score += 20;
    if (data.skills.other?.length > 0) score += 10;
    return Math.min(score, 100);
}


// --- Print Component ---
const CVPrintView = React.forwardRef(({ data, certificates }, ref) => {
    return (
        <div ref={ref} className="w-[210mm] min-h-[297mm] bg-white text-black font-sans p-10 print:p-0">
            <style>{`@media print { @page { margin: 10mm; } }`}</style>

            {/* Header */}
            <div className="flex items-start gap-6 border-b-2 border-[#a77c52] pb-6 mb-6">
                {data.personalInfo.photoURL && (
                    <img src={data.personalInfo.photoURL} className="w-24 h-24 rounded-full object-cover border-2 border-[#a77c52]" alt="Profile" />
                )}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-[#321C00] mb-2 font-serif uppercase tracking-wide">{data.personalInfo.fullName}</h1>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                        {data.personalInfo.email && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">mail</span> {data.personalInfo.email}</span>}
                        {data.personalInfo.phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">call</span> {data.personalInfo.phone}</span>}
                        {data.personalInfo.linkedin && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">link</span> {data.personalInfo.linkedin}</span>}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-[2fr_1fr] gap-8">

                {/* Main Column */}
                <div className="space-y-6">
                    {/* Summary */}
                    {data.summary && (
                        <div className="mb-6">
                            <h3 className="text-[#a77c52] font-bold uppercase tracking-widest text-sm mb-2 border-b border-gray-100 pb-1">Professional Summary</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">{data.summary}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-[#a77c52] font-bold uppercase tracking-widest text-sm mb-3 border-b border-gray-100 pb-1">Experience</h3>
                            <div className="space-y-4">
                                {data.experience.map((exp) => (
                                    <div key={exp.id}>
                                        <h4 className="font-bold text-gray-900">{exp.title}</h4>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span className="font-semibold">{exp.company}</span>
                                            <span>{exp.startDate} - {exp.endDate || 'Present'}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {data.education.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-[#a77c52] font-bold uppercase tracking-widest text-sm mb-3 border-b border-gray-100 pb-1">Education</h3>
                            <div className="space-y-4">
                                {data.education.map((edu) => (
                                    <div key={edu.id}>
                                        <h4 className="font-bold text-gray-900">{edu.school}</h4>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span className="font-semibold">{edu.degree}</span>
                                            <span>{edu.year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">

                    {/* Certifications (Usafi) */}
                    {certificates.filter(c => data.selectedCertificates.includes(c.id)).length > 0 && (
                        <div>
                            <h3 className="text-[#a77c52] font-bold uppercase tracking-widest text-sm mb-3 border-b border-gray-100 pb-1">Verified Credentials</h3>
                            <div className="space-y-3">
                                {certificates.filter(c => data.selectedCertificates.includes(c.id)).map(cert => (
                                    <div key={cert.id} className="bg-[#FAF5E8] p-3 rounded-lg border border-[#a77c52]/20">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="material-symbols-outlined text-[#a77c52] text-[16px]">verified</span>
                                            <span className="text-xs font-bold text-[#a77c52] uppercase">Usafi Certified</span>
                                        </div>
                                        <p className="font-bold text-sm leading-tight text-[#321C00]">{cert.title}</p>
                                        <p className="text-[10px] text-gray-500 mt-1">Issued: {cert.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {(data.skills.other?.length > 0) && (
                        <div>
                            <h3 className="text-[#a77c52] font-bold uppercase tracking-widest text-sm mb-3 border-b border-gray-100 pb-1">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.other.map((skill, i) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>

            <div className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
                Generated by Usafi Barista Training Center CV Builder
            </div>
        </div>
    );
});

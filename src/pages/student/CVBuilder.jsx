
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

    if (loading) return <div className="h-full flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-espresso">progress_activity</span></div>;

    const completeness = calculateCompleteness(cvData);

    return (
        <div className="flex flex-col h-full w-full items-center animate-fade-in">
            <style>{`
                ::-webkit-scrollbar { width: 0px; background: transparent; }
                .accordion-content { transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out; max-height: 0; opacity: 0; overflow: hidden; }
                details[open] .accordion-content { max-height: 2000px; opacity: 1; }
                details summary::-webkit-details-marker { display: none; }
            `}</style>

            <div className="relative flex min-h-screen w-full flex-col max-w-5xl shadow-2xl overflow-hidden bg-[#F5DEB3] dark:bg-[#1c1916] rounded-[2.5rem] border border-espresso/10 my-8">

                {/* Header */}
                <div className="sticky top-0 z-50 bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-b border-espresso/10 text-espresso dark:text-white">
                    <div className="flex items-center px-8 py-6 justify-between">
                        <button
                            onClick={() => window.history.back()}
                            className="text-espresso dark:text-white hover:bg-white/40 rounded-2xl w-12 h-12 transition-all flex items-center justify-center active:scale-95 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                        </button>
                        <h2 className="text-espresso dark:text-white text-2xl font-black font-serif uppercase tracking-[0.2em] leading-tight">Career Architect</h2>

                        <div className="flex w-32 items-center justify-end">
                            {saveSuccess ? (
                                <span className="text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-fade-in flex items-center gap-2 border border-green-200">
                                    <span className="material-symbols-outlined text-[16px]">verified</span> Encloded
                                </span>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-espresso text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? <span className="material-symbols-outlined animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">save</span>}
                                    {saving ? "Storing" : "Save Draft"}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 px-10 pb-6">
                        <div className="flex gap-6 justify-between items-end">
                            <p className="text-espresso/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest">Profile Integrity Status</p>
                            <p className="text-espresso dark:text-white text-xs font-black">{completeness}%</p>
                        </div>
                        <div className="rounded-full bg-espresso/5 dark:bg-white/5 h-2 w-full overflow-hidden border border-espresso/5">
                            <div className="h-full rounded-full bg-espresso transition-all duration-700 ease-out shadow-sm" style={{ width: `${completeness}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-48 scrollbar-hide px-10 pt-6 flex flex-col gap-6">

                    {/* Personal Info */}
                    <SectionDetails
                        title="Strategic Identity"
                        icon="person_pin"
                        isOpen={activeSection === 'personal'}
                        onToggle={(open) => setActiveSection(open ? 'personal' : null)}
                    >
                        <div className="flex flex-col md:flex-row items-center gap-10 mb-8 pt-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-32 h-32 rounded-[2rem] bg-white/40 dark:bg-black/20 flex items-center justify-center border-2 border-espresso/20 border-dashed relative overflow-hidden cursor-pointer shrink-0 group/photo hover:border-espresso transition-all active:scale-95 shadow-lg"
                            >
                                {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-espresso"></div> : (
                                    <>
                                        {cvData.personalInfo.photoURL ? (
                                            <img src={cvData.personalInfo.photoURL} alt="Profile" className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                                        ) : <span className="material-symbols-outlined text-espresso/40 group-hover/photo:scale-110 transition-transform text-3xl">add_a_photo</span>}
                                    </>
                                )}
                                <div className="absolute inset-0 bg-espresso/20 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-2xl">sync</span>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <Input label="Professional Name" name="fullName" value={cvData.personalInfo.fullName} onChange={handleInfoChange} placeholder="e.g. Jane Doe" />
                                <Input label="Direct Line" name="phone" value={cvData.personalInfo.phone} onChange={handleInfoChange} placeholder="+254..." icon="call" />
                                <Input label="Digital Correspondence" name="email" value={cvData.personalInfo.email} onChange={handleInfoChange} placeholder="email@example.com" type="email" icon="mail" />
                                <Input label="Global Connectivity" name="linkedin" value={cvData.personalInfo.linkedin} onChange={handleInfoChange} placeholder="linkedin.com/in/..." icon="link" />
                            </div>
                        </div>
                    </SectionDetails>

                    {/* Summary */}
                    <SectionDetails
                        title="Professional Narrative"
                        icon="auto_awesome"
                        isOpen={activeSection === 'summary'}
                        onToggle={(open) => setActiveSection(open ? 'summary' : null)}
                    >
                        <div className="w-full pt-4">
                            <p className="text-espresso/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest pb-3">Strategic Career Objective</p>
                            <textarea
                                value={cvData.summary}
                                onChange={handleSummaryChange}
                                className="w-full rounded-2xl text-espresso border border-espresso/10 bg-white/40 dark:bg-black/20 min-h-[160px] p-6 text-sm font-medium leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20 shadow-inner"
                                placeholder="Craft a compelling narrative of your professional journey..."
                            />
                            <div className="flex justify-between items-center mt-3">
                                <p className="text-[10px] text-espresso/30 italic">Tip: Highlight your most significant impact.</p>
                                <p className="text-[10px] font-black text-espresso/40 uppercase tracking-widest">{cvData.summary.length} characters encoded</p>
                            </div>
                        </div>
                    </SectionDetails>

                    {/* Certifications - Verified */}
                    <SectionDetails
                        title="Verified Intelligence"
                        icon="verified"
                        isOpen={activeSection === 'certs'}
                        onToggle={(open) => setActiveSection(open ? 'certs' : null)}
                    >
                        <div className="bg-white/40 dark:bg-black/20 rounded-2xl p-8 border border-espresso/10 mb-2 relative overflow-hidden group/certs pt-6 mt-4">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/5 group-hover/certs:bg-espresso/20 transition-colors"></div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="material-symbols-outlined text-espresso/40 text-[24px]">workspace_premium</span>
                                <h4 className="text-[10px] font-black text-espresso dark:text-white uppercase tracking-[0.2em]">Usafi Strategic Credentials</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {earnedCertificates.length > 0 ? earnedCertificates.map(cert => (
                                    <label key={cert.id} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer group/item ${cvData.selectedCertificates.includes(cert.id) ? "bg-espresso text-white border-espresso shadow-xl -translate-y-1" : "bg-white/40 border-espresso/5 hover:border-espresso/20 hover:bg-white/60"}`}>
                                        <input type="checkbox" className="hidden" checked={cvData.selectedCertificates.includes(cert.id)} onChange={() => toggleCertificate(cert.id)} />
                                        <span className={`material-symbols-outlined text-[24px] transition-transform ${cvData.selectedCertificates.includes(cert.id) ? "text-white rotate-[360deg]" : "text-espresso/20"}`}>
                                            {cvData.selectedCertificates.includes(cert.id) ? 'verified' : 'radio_button_unchecked'}
                                        </span>
                                        <div className="flex-1">
                                            <p className={`text-sm font-black tracking-tight leading-tight ${cvData.selectedCertificates.includes(cert.id) ? "text-white" : "text-espresso dark:text-white"}`}>{cert.title}</p>
                                            <p className={`text-[10px] uppercase tracking-widest mt-1 ${cvData.selectedCertificates.includes(cert.id) ? "text-white/60" : "text-espresso/40"}`}>{cert.date}</p>
                                        </div>
                                    </label>
                                )) : (
                                    <div className="col-span-full py-10 flex flex-col items-center justify-center text-espresso/30 opacity-60">
                                        <span className="material-symbols-outlined text-5xl mb-2">history_edu</span>
                                        <p className="text-sm font-serif italic">Awaiting certification milestones...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </SectionDetails>

                    {/* Skills */}
                    <SectionDetails
                        title="Operational Capabilities"
                        icon="construction"
                        isOpen={activeSection === 'skills'}
                        onToggle={(open) => setActiveSection(open ? 'skills' : null)}
                    >
                        <div className="pt-4">
                            <p className="text-[10px] font-black uppercase text-espresso/40 dark:text-white/40 tracking-widest mb-4">Tactical Skill Set</p>
                            <div className="flex flex-wrap gap-3 mb-6">
                                {cvData.skills.other?.map((skill, idx) => (
                                    <span key={idx} className="px-5 py-2.5 rounded-full bg-espresso text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg animate-fade-in group/skill hover:-translate-y-1 transition-all">
                                        {skill}
                                        <button onClick={() => removeSkill('other', idx)} className="hover:text-red-300 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                                {cvData.skills.other?.length === 0 && (
                                    <p className="text-xs text-espresso/30 font-medium italic">Define your operational edge...</p>
                                )}
                            </div>
                            <div className="flex gap-4 group/input">
                                <input
                                    className="flex-1 rounded-2xl border border-espresso/10 bg-white/40 dark:bg-black/20 h-14 px-6 text-sm font-bold text-espresso dark:text-white placeholder:text-espresso/20 focus:outline-none focus:ring-2 focus:ring-espresso transition-all shadow-sm"
                                    placeholder="Add capability (e.g. Precision Extraction)"
                                    onKeyDown={(e) => { if (e.key === 'Enter') { addSkill('other', e.target.value); e.target.value = ''; } }}
                                />
                                <button
                                    className="w-14 h-14 rounded-2xl bg-espresso text-white flex items-center justify-center shadow-xl hover:shadow-espresso/40 active:scale-95 transition-all"
                                    onClick={(e) => { const input = e.currentTarget.previousSibling; if (input.value) { addSkill('other', input.value); input.value = ''; } }}
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>
                    </SectionDetails>

                    {/* Education - Dynamic List */}
                    <SectionDetails
                        title="Academic Foundation"
                        icon="history_edu"
                        isOpen={activeSection === 'education'}
                        onToggle={(open) => setActiveSection(open ? 'education' : null)}
                    >
                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {cvData.education.map((edu, idx) => (
                                <div key={edu.id} className="bg-white/40 dark:bg-black/20 rounded-3xl p-8 border border-espresso/10 relative group/item animate-fade-in shadow-sm hover:shadow-md transition-all">
                                    <button
                                        onClick={() => removeEducation(idx)}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                                    </button>
                                    <div className="grid gap-6">
                                        <Input label="Institution" placeholder="e.g. University of Coffee Arts" value={edu.school} onChange={(e) => updateEducation(idx, 'school', e.target.value)} />
                                        <Input label="Credential" placeholder="e.g. Master in Espresso Theory" value={edu.degree} onChange={(e) => updateEducation(idx, 'degree', e.target.value)} />
                                        <Input label="Timeline" placeholder="e.g. 2020 - 2024" value={edu.year} onChange={(e) => updateEducation(idx, 'year', e.target.value)} />
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addEducation}
                                className="w-full py-10 rounded-3xl border-2 border-dashed border-espresso/10 text-espresso/40 hover:bg-white/40 hover:border-espresso/30 hover:text-espresso transition-all flex flex-col items-center justify-center gap-3 transition-all"
                            >
                                <span className="material-symbols-outlined text-4xl">add_school</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Append Education</span>
                            </button>
                        </div>
                    </SectionDetails>

                    {/* Experience - Dynamic List */}
                    <SectionDetails
                        title="Professional History"
                        icon="work_history"
                        isOpen={activeSection === 'experience'}
                        onToggle={(open) => setActiveSection(open ? 'experience' : null)}
                    >
                        <div className="pt-4 space-y-6">
                            {cvData.experience.map((exp, idx) => (
                                <div key={exp.id} className="bg-white/40 dark:bg-black/20 rounded-3xl p-10 border border-espresso/10 relative group/item animate-fade-in shadow-sm hover:shadow-md transition-all">
                                    <button
                                        onClick={() => removeExperience(idx)}
                                        className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-red-50 text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-[24px]">delete_forever</span>
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <Input label="Strategic Role" placeholder="e.g. Senior Barista Operator" value={exp.title} onChange={(e) => updateExperience(idx, 'title', e.target.value)} />
                                            <Input label="Organization" placeholder="e.g. Global Bean Collective" value={exp.company} onChange={(e) => updateExperience(idx, 'company', e.target.value)} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input type="month" label="Activation" value={exp.startDate} onChange={(e) => updateExperience(idx, 'startDate', e.target.value)} />
                                                <Input type="month" label="Termination" value={exp.endDate} onChange={(e) => updateExperience(idx, 'endDate', e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-espresso/40 dark:text-white/40 uppercase tracking-widest leading-normal pb-1.5">Operational Responsibilities</p>
                                            <textarea
                                                className="w-full rounded-2xl border border-espresso/10 bg-black/5 dark:bg-black/40 p-6 text-sm font-medium h-[180px] resize-none focus:outline-none focus:ring-2 focus:ring-espresso transition-all placeholder:text-espresso/20"
                                                placeholder="Detail your primary mission objectives..."
                                                value={exp.description}
                                                onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addExperience}
                                className="w-full py-12 rounded-[2.5rem] border-2 border-dashed border-espresso/10 text-espresso/40 hover:bg-white/40 hover:border-espresso/30 hover:text-espresso transition-all flex flex-col items-center justify-center gap-4"
                            >
                                <span className="material-symbols-outlined text-5xl">assignment_add</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Append Professional Experience</span>
                            </button>
                        </div>
                    </SectionDetails>

                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 w-full bg-[#F5DEB3]/90 dark:bg-[#1c1916]/90 backdrop-blur-md border-t border-espresso/10 p-8 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-50 rounded-b-[2.5rem]">
                    <div className="flex flex-col md:flex-row gap-6 max-w-4xl mx-auto">
                        {saveSuccess ? (
                            <button disabled className="flex-1 h-16 flex items-center justify-center gap-3 rounded-[1.25rem] border-2 border-green-600/50 text-green-600 font-black text-xs uppercase tracking-[0.2em] bg-green-50/50 backdrop-blur-sm shadow-inner transition-all">
                                <span className="material-symbols-outlined text-[20px] animate-pulse">verified_user</span>
                                State Synchronized
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 h-16 flex items-center justify-center gap-3 rounded-[1.25rem] border-2 border-espresso/20 text-espresso/60 font-black text-xs uppercase tracking-[0.2em] hover:bg-white/40 hover:border-espresso/40 transition-all active:scale-95 shadow-lg"
                            >
                                {saving ? <span className="material-symbols-outlined animate-spin text-[20px]">sync</span> : <span className="material-symbols-outlined text-[20px]">save_as</span>}
                                {saving ? "Synchronizing..." : "Synchronize State"}
                            </button>
                        )}
                        <button
                            onClick={handlePrint}
                            disabled={isPrinting}
                            className="flex-[1.5] h-16 flex items-center justify-center gap-3 rounded-[1.25rem] bg-espresso text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:shadow-espresso/40 hover:-translate-y-1 transition-all active:scale-95 group"
                        >
                            {isPrinting ? <span className="material-symbols-outlined animate-spin text-[20px]">sync</span> : <span className="material-symbols-outlined text-[20px] group-hover:translate-y-1 transition-transform">picture_as_pdf</span>}
                            {isPrinting ? "Compiling Assets..." : "Execute Print Protocol"}
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
        <details className="group w-full shrink-0 rounded-[2rem] bg-[#F5DEB3] dark:bg-neutral-800 shadow-xl border border-espresso/10 overflow-hidden transition-all duration-300 hover:shadow-2xl relative" open={isOpen}>
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
            <summary
                onClick={(e) => { e.preventDefault(); onToggle(!isOpen); }}
                className="flex cursor-pointer items-center justify-between gap-6 px-10 py-8 bg-white/40 dark:bg-neutral-800 hover:bg-white/60 transition-all list-none"
            >
                <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-espresso text-white shadow-lg shadow-espresso/20 transition-transform group-hover:scale-110">
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                    </div>
                    <p className="text-espresso dark:text-white text-2xl font-serif font-black tracking-tight leading-normal">{title}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-espresso/5 flex items-center justify-center transition-all group-hover:bg-espresso/10">
                    <span className={`material-symbols-outlined text-espresso transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                </div>
            </summary>
            {isOpen && (
                <div className="px-10 pb-10 pt-4 border-t border-espresso/5 animate-fade-in bg-white/20">
                    {children}
                </div>
            )}
        </details>
    );
}

function Input({ label, icon, ...props }) {
    return (
        <label className="flex flex-col w-full group/input">
            {label && <p className="text-espresso/40 dark:text-white/40 text-[10px] font-black uppercase tracking-widest leading-normal pb-1.5 transition-colors group-focus-within/input:text-espresso">{label}</p>}
            <div className="relative">
                {icon && <span className="absolute left-5 top-1/2 -translate-y-1/2 text-espresso/40 material-symbols-outlined text-[20px] group-focus-within/input:text-espresso transition-colors">{icon}</span>}
                <input
                    className={`w-full rounded-2xl text-espresso dark:text-white border border-espresso/10 bg-white/40 dark:bg-black/20 focus:border-espresso focus:ring-2 focus:ring-espresso focus:bg-white/60 h-14 p-6 text-sm font-bold placeholder:text-espresso/20 outline-none transition-all shadow-sm ${icon ? 'pl-14' : ''}`}
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
        <div ref={ref} className="w-[210mm] min-h-[297mm] bg-white text-[#1c1916] font-sans p-16 print:p-0">
            <style>{`
                @media print { 
                    @page { margin: 15mm; } 
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>

            {/* Header - Premium Alignment */}
            <div className="flex items-start gap-10 border-b-2 border-espresso/20 pb-12 mb-12 relative">
                <div className="absolute left-0 top-0 bottom-12 w-1 bg-espresso"></div>
                {data.personalInfo.photoURL && (
                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-espresso/10 bg-gray-50 shrink-0">
                        <img src={data.personalInfo.photoURL} className="w-full h-full object-cover" alt="Profile" />
                    </div>
                )}
                <div className="flex-1 pl-4">
                    <h1 className="text-5xl font-serif font-black text-espresso mb-4 uppercase tracking-tight">{data.personalInfo.fullName}</h1>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-bold uppercase tracking-widest text-[#1c1916]/60">
                        {data.personalInfo.email && <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">mail</span> {data.personalInfo.email}</span>}
                        {data.personalInfo.phone && <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">call</span> {data.personalInfo.phone}</span>}
                        {data.personalInfo.linkedin && <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">link</span> LinkedIn Profile</span>}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-[1.8fr_1fr] gap-16">

                {/* Main Column */}
                <div className="space-y-12">
                    {/* Summary */}
                    {data.summary && (
                        <div className="relative pl-6 border-l border-espresso/10">
                            <h3 className="text-espresso font-black uppercase tracking-[0.3em] text-[10px] mb-4">Strategic Narrative</h3>
                            <p className="text-[#1c1916]/80 text-sm leading-relaxed font-medium">{data.summary}</p>
                        </div>
                    )}

                    {/* Experience */}
                    {data.experience.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-px bg-espresso/20"></span>
                                <h3 className="text-espresso font-black uppercase tracking-[0.3em] text-[10px]">Professional Milestone History</h3>
                            </div>
                            <div className="space-y-8">
                                {data.experience.map((exp) => (
                                    <div key={exp.id} className="relative pl-6 border-l border-espresso/10 group">
                                        <div className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-espresso/20"></div>
                                        <h4 className="font-serif font-bold text-xl text-espresso leading-tight">{exp.title}</h4>
                                        <div className="flex justify-between items-center mt-2 mb-3">
                                            <span className="text-xs font-black uppercase tracking-widest text-espresso/60">{exp.company}</span>
                                            <span className="text-[10px] font-bold text-[#1c1916]/40 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">{exp.startDate} — {exp.endDate || 'Active'}</span>
                                        </div>
                                        <p className="text-sm text-[#1c1916]/70 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {data.education.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-8 h-px bg-espresso/20"></span>
                                <h3 className="text-espresso font-black uppercase tracking-[0.3em] text-[10px]">Academic Foundation</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                {data.education.map((edu) => (
                                    <div key={edu.id} className="relative pl-6 border-l border-espresso/10">
                                        <div className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-espresso/20"></div>
                                        <h4 className="font-serif font-bold text-lg text-espresso">{edu.school}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-xs font-bold text-espresso/60 uppercase tracking-widest">{edu.degree}</span>
                                            <span className="text-[10px] font-black text-[#1c1916]/30 uppercase tracking-widest">{edu.year}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-12">

                    {/* Certifications (Usafi) */}
                    {certificates.filter(c => data.selectedCertificates.includes(c.id)).length > 0 && (
                        <div>
                            <h3 className="text-espresso font-black uppercase tracking-[0.3em] text-[10px] mb-6">Verified Credentials</h3>
                            <div className="space-y-4">
                                {certificates.filter(c => data.selectedCertificates.includes(c.id)).map(cert => (
                                    <div key={cert.id} className="bg-espresso/[0.03] p-6 rounded-2xl border border-espresso/5 relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-espresso/20"></div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="material-symbols-outlined text-espresso text-[16px]">verified</span>
                                            <span className="text-[9px] font-black text-espresso uppercase tracking-[0.2em]">Usafi Strategist</span>
                                        </div>
                                        <p className="font-serif font-bold text-sm leading-tight text-espresso">{cert.title}</p>
                                        <p className="text-[9px] font-bold text-[#1c1916]/40 mt-2 uppercase tracking-widest">Authenticated {cert.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skills */}
                    {(data.skills.other?.length > 0) && (
                        <div>
                            <h3 className="text-espresso font-black uppercase tracking-[0.3em] text-[10px] mb-6">Core Capabilities</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.skills.other.map((skill, i) => (
                                    <span key={i} className="px-4 py-2 bg-gray-50 text-espresso text-[10px] font-black uppercase tracking-widest rounded-xl border border-espresso/5">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* Footer */}
            <div className="mt-20 pt-10 border-t border-espresso/10 flex justify-between items-center text-[#1c1916]/30">
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Usafi Barista Training Center • Career Division</p>
                <p className="text-[10px] font-bold italic">Authenticated Digital Document</p>
            </div>
        </div>
    );
});

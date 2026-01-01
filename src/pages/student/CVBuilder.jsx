import React, { useState, useRef } from 'react';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function CVBuilder() {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [profilePic, setProfilePic] = useState("https://ui-avatars.com/api/?name=Jane+Doe&background=random");

    // State for form fields (basic implementation)
    const [profile, setProfile] = useState({
        fullName: "Jane Doe",
        phone: "+254 712 345 678",
        email: "jane.doe@email.com",
        linkedin: "",
        objective: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        responsibilities: ""
    });

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const storageRef = ref(storage, `cv_profiles/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setProfilePic(downloadURL);
        } catch (error) {
            console.error("Error uploading image:", error);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="flex flex-col h-full w-full items-center">
            {/* Custom Styles for this page */}
            <style>{`
        ::-webkit-scrollbar {
          width: 0px;
          background: transparent;
        }
        .accordion-content {
          transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
          max-height: 0;
          opacity: 0;
          overflow: hidden;
        }
        details[open] .accordion-content {
          max-height: 1000px;
          opacity: 1;
        }
        details summary::-webkit-details-marker {
          display: none;
        }
      `}</style>

            {/* Main Container - matching max-w-md from mockup but inside our flexible dashboard */}
            <div className="relative flex h-full min-h-[800px] w-full flex-col max-w-md shadow-2xl overflow-hidden bg-[#FAF5E8] dark:bg-[#1c1916] rounded-xl border border-primary/10">

                {/* Header */}
                <div className="sticky top-0 z-50 bg-[#FAF5E8]/95 dark:bg-[#1c1916]/95 backdrop-blur-sm border-b border-[#a77c52]/10 text-[#321C00] dark:text-[#FAF5E8]">
                    <div className="flex items-center p-4 pb-2 justify-between">
                        <button className="text-[#321C00] dark:text-[#FAF5E8] hover:bg-[#a77c52]/10 rounded-full p-2 transition-colors flex items-center justify-center">
                            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                        </button>
                        <h2 className="text-[#321C00] dark:text-[#FAF5E8] text-xl font-bold font-serif leading-tight tracking-[-0.015em]">CV Builder</h2>
                        <div className="flex w-12 items-center justify-end">
                            <p className="text-[#a77c52] text-sm font-bold leading-normal tracking-[0.015em] shrink-0 cursor-pointer hover:text-[#8c6642] transition-colors">Save</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col gap-1 px-6 pb-4">
                        <div className="flex gap-6 justify-between items-end">
                            <p className="text-[#321C00]/70 dark:text-[#FAF5E8]/70 text-xs font-medium leading-normal">Profile Completeness</p>
                            <p className="text-[#a77c52] text-xs font-bold leading-normal">75%</p>
                        </div>
                        <div className="rounded-full bg-[#a77c52]/20 h-1.5 w-full overflow-hidden">
                            <div className="h-full rounded-full bg-[#a77c52] transition-all duration-500 ease-out" style={{ width: '75%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
                    <div className="flex flex-col p-4 gap-4">

                        {/* Personal Info */}
                        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                                        <span className="material-symbols-outlined text-[18px]">person</span>
                                    </div>
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">Personal Info</p>
                                </div>
                                <span className="material-symbols-outlined text-[#a77c52] group-open:rotate-180 transition-transform duration-300">expand_more</span>
                            </summary>
                            <div className="accordion-content px-5 pb-6 pt-2 flex flex-col gap-4 border-t border-[#a77c52]/5">
                                <div className="flex items-center gap-4 mb-2">
                                    <div
                                        onClick={handleImageClick}
                                        className="w-16 h-16 rounded-full bg-[#a77c52]/10 flex items-center justify-center border-2 border-[#a77c52] border-dashed relative overflow-hidden group/photo cursor-pointer shrink-0"
                                    >
                                        {uploading ? (
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#a77c52]"></div>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[#a77c52] group-hover/photo:scale-110 transition-transform">add_a_photo</span>
                                                <img
                                                    alt="Profile"
                                                    className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity"
                                                    src={profilePic}
                                                />
                                                {profilePic !== "https://ui-avatars.com/api/?name=Jane+Doe&background=random" && (
                                                    <img
                                                        alt="Profile"
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        src={profilePic}
                                                    />
                                                )}
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[#321C00] font-medium text-sm dark:text-[#FAF5E8]">Profile Photo</p>
                                        <p className="text-[#321C00]/50 text-xs dark:text-[#FAF5E8]/50">Professional headshot recommended</p>
                                    </div>
                                </div>

                                <label className="flex flex-col w-full">
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">Full Name</p>
                                    <input
                                        name="fullName"
                                        onChange={handleChange}
                                        className="w-full rounded-lg text-[#321C00] focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 placeholder:text-[#321C00]/40 p-3 text-base font-normal transition-all"
                                        placeholder="e.g. Jane Doe"
                                        defaultValue={profile.fullName}
                                    />
                                </label>

                                <div className="grid grid-cols-1 gap-4">
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">Phone Number</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#321C00]/40 material-symbols-outlined text-[18px]">call</span>
                                            <input className="w-full rounded-lg text-[#321C00] pl-10 focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 placeholder:text-[#321C00]/40 p-3 text-base font-normal transition-all" placeholder="+254 7..." defaultValue="+254 712 345 678" />
                                        </div>
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">Email Address</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#321C00]/40 material-symbols-outlined text-[18px]">mail</span>
                                            <input className="w-full rounded-lg text-[#321C00] pl-10 focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 placeholder:text-[#321C00]/40 p-3 text-base font-normal transition-all" placeholder="jane@example.com" type="email" defaultValue="jane.doe@email.com" />
                                        </div>
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">LinkedIn URL</p>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#321C00]/40 material-symbols-outlined text-[18px]">link</span>
                                            <input className="w-full rounded-lg text-[#321C00] pl-10 focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 placeholder:text-[#321C00]/40 p-3 text-base font-normal transition-all" placeholder="linkedin.com/in/..." />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </details>

                        {/* Summary */}
                        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                                        <span className="material-symbols-outlined text-[18px]">description</span>
                                    </div>
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">Summary</p>
                                </div>
                                <span className="material-symbols-outlined text-[#a77c52] group-open:rotate-180 transition-transform duration-300">expand_more</span>
                            </summary>
                            <div className="accordion-content px-5 pb-6 pt-2 border-t border-[#a77c52]/5">
                                <label className="flex flex-col w-full">
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-2">Professional Objective</p>
                                    <textarea className="w-full rounded-lg text-[#321C00] focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] min-h-[120px] placeholder:text-[#321C00]/40 p-3 text-base font-normal resize-none transition-all" placeholder="Briefly describe your passion for coffee and what you bring to the table..."></textarea>
                                    <p className="text-xs text-[#a77c52] mt-1.5 text-right">0/300 chars</p>
                                </label>
                            </div>
                        </details>

                        {/* Certifications */}
                        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                                        <span className="material-symbols-outlined text-[18px]">verified</span>
                                    </div>
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">Certifications</p>
                                </div>
                                <span className="material-symbols-outlined text-[#a77c52] group-open:rotate-180 transition-transform duration-300">expand_more</span>
                            </summary>
                            <div className="accordion-content px-5 pb-6 pt-2 border-t border-[#a77c52]/5">
                                <div className="bg-[#a77c52]/5 rounded-xl p-4 border border-[#a77c52]/20 mb-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <span className="material-symbols-outlined text-[64px] text-[#a77c52]">workspace_premium</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 relative z-10">
                                        <span className="material-symbols-outlined text-[#a77c52] text-[20px]">school</span>
                                        <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8] uppercase tracking-wide">Usafi Earned Credentials</p>
                                    </div>
                                    <label className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-[#a77c52]/20 shadow-sm cursor-pointer transition-colors mb-2 relative z-10">
                                        <div className="pt-0.5">
                                            <span className="material-symbols-outlined text-[#a77c52] text-[20px]">check_circle</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8]">Certified Professional Barista</p>
                                            </div>
                                            <p className="text-xs text-[#321C00]/70 dark:text-[#FAF5E8]/70 mt-0.5">Verified by Usafi Training Center • Issued Aug 2023</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-neutral-900/50 border border-dashed border-[#a77c52]/30 cursor-pointer transition-colors relative z-10">
                                        <input className="w-5 h-5 text-[#a77c52] border-gray-300 rounded focus:ring-[#a77c52]" type="checkbox" />
                                        <div className="flex-1 opacity-70">
                                            <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8]">Latte Art Specialist</p>
                                            <p className="text-xs text-[#321C00]/60 dark:text-[#FAF5E8]/60">Module in progress</p>
                                        </div>
                                    </label>
                                </div>
                                <p className="text-[#321C00]/60 dark:text-[#FAF5E8]/60 text-xs mb-3 font-bold uppercase tracking-wide">External Certifications</p>
                                <label className="flex items-center gap-3 p-3 rounded-lg border border-[#a77c52]/10 hover:bg-[#a77c52]/5 cursor-pointer transition-colors mb-2">
                                    <input defaultChecked className="w-5 h-5 text-[#a77c52] border-gray-300 rounded focus:ring-[#a77c52]" type="checkbox" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8]">Food Safety Level 1</p>
                                        <p className="text-xs text-[#321C00]/60 dark:text-[#FAF5E8]/60">Issued by Local Health Authority</p>
                                    </div>
                                </label>
                                <button className="mt-3 text-[#a77c52] text-sm font-medium hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[16px]">add</span> Add external certification
                                </button>
                            </div>
                        </details>

                        {/* Skills */}
                        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden" open>
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                                    </div>
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">Skills</p>
                                </div>
                                <span className="material-symbols-outlined text-[#a77c52] group-open:rotate-180 transition-transform duration-300">expand_more</span>
                            </summary>
                            <div className="accordion-content px-5 pb-6 pt-2 border-t border-[#a77c52]/5">
                                <div className="mb-4">
                                    <p className="text-[#321C00]/60 dark:text-[#FAF5E8]/60 text-xs mb-2.5 font-bold uppercase tracking-wide">Usafi Core Competencies</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="px-3 py-1.5 rounded-full bg-[#a77c52] text-white text-xs font-medium border border-[#a77c52] flex items-center gap-1 group/chip hover:bg-[#8c6642] transition-colors shadow-sm">
                                            Espresso Extraction
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                        </button>
                                        <button className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 text-[#321C00] dark:text-[#FAF5E8] text-xs font-medium border border-[#a77c52]/30 flex items-center gap-1 hover:border-[#a77c52] hover:text-[#a77c52] hover:bg-[#a77c52]/5 transition-colors">
                                            Latte Art Techniques
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                        </button>
                                        <button className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 text-[#321C00] dark:text-[#FAF5E8] text-xs font-medium border border-[#a77c52]/30 flex items-center gap-1 hover:border-[#a77c52] hover:text-[#a77c52] hover:bg-[#a77c52]/5 transition-colors">
                                            Customer Service Excellence
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <p className="text-[#321C00]/60 dark:text-[#FAF5E8]/60 text-xs mb-2.5 font-bold uppercase tracking-wide">Additional Skills</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 text-[#321C00] dark:text-[#FAF5E8] text-xs font-medium border border-[#a77c52]/30 flex items-center gap-1 hover:border-[#a77c52] hover:text-[#a77c52] transition-colors">
                                            POS Systems
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                        </button>
                                        <button className="px-3 py-1.5 rounded-full bg-white dark:bg-neutral-900 text-[#321C00] dark:text-[#FAF5E8] text-xs font-medium border border-[#a77c52]/30 flex items-center gap-1 hover:border-[#a77c52] hover:text-[#a77c52] transition-colors">
                                            Inventory Management
                                            <span className="material-symbols-outlined text-[14px]">add</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 rounded-lg text-[#321C00] border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-10 px-3 text-sm placeholder:text-[#321C00]/40" placeholder="Add custom skill..." />
                                    <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#a77c52] text-white hover:bg-[#8c6642] transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">add</span>
                                    </button>
                                </div>
                            </div>
                        </details>

                        {/* Education */}
                        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                                        <span className="material-symbols-outlined text-[18px]">school</span>
                                    </div>
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">Education</p>
                                </div>
                                <span className="material-symbols-outlined text-[#a77c52] group-open:rotate-180 transition-transform duration-300">expand_more</span>
                            </summary>
                            <div className="accordion-content px-5 pb-6 pt-2 border-t border-[#a77c52]/5 flex flex-col gap-4">
                                <div className="flex flex-col bg-[#FAF5E8]/50 dark:bg-neutral-900 rounded-lg p-3 border border-[#a77c52]/40 relative group/item shadow-sm">
                                    <div className="absolute top-0 right-0 bg-[#a77c52] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                                        VERIFIED
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-[#321C00] dark:text-[#FAF5E8] font-bold text-sm">Professional Barista Course</h4>
                                            <p className="text-[#321C00]/70 dark:text-[#FAF5E8]/70 text-xs">Usafi Training Center</p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <span className="material-symbols-outlined text-[14px] text-[#a77c52]">star</span>
                                                <p className="text-[#a77c52] text-xs font-medium">Top Graduate 2023</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-4">
                                            <button className="p-1 text-[#321C00]/40 hover:text-[#a77c52] transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                        </div>
                                    </div>
                                </div>
                                <button className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-dashed border-[#a77c52]/40 text-[#a77c52] bg-[#a77c52]/5 hover:bg-[#a77c52]/10 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                    <span className="font-medium text-sm">Add Other Education</span>
                                </button>
                            </div>
                        </details>

                        {/* Work Experience */}
                        <details className="group flex flex-col rounded-xl bg-white dark:bg-neutral-800 shadow-sm border border-[#a77c52]/10 overflow-hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 bg-white dark:bg-neutral-800 hover:bg-[#a77c52]/5 transition-colors list-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#a77c52]/10 text-[#a77c52]">
                                        <span className="material-symbols-outlined text-[18px]">work</span>
                                    </div>
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-lg font-serif font-bold leading-normal">Work Experience</p>
                                </div>
                                <span className="material-symbols-outlined text-[#a77c52] group-open:rotate-180 transition-transform duration-300">expand_more</span>
                            </summary>
                            <div className="accordion-content px-5 pb-6 pt-2 border-t border-[#a77c52]/5 flex flex-col gap-4">
                                <div className="bg-[#a77c52]/5 rounded-lg p-3 mb-2 border border-[#a77c52]/10 flex gap-3 items-start">
                                    <span className="material-symbols-outlined text-[#a77c52] text-[20px] mt-0.5">lightbulb</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#321C00] dark:text-[#FAF5E8]">Apply your training</p>
                                        <p className="text-xs text-[#321C00]/70 dark:text-[#FAF5E8]/70 mt-0.5">When adding experience, mention how you used <span className="font-semibold text-[#a77c52]">Espresso Extraction</span> or <span className="font-semibold text-[#a77c52]">Customer Service</span> skills learned at Usafi.</p>
                                    </div>
                                </div>
                                <label className="flex flex-col w-full">
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">Job Title</p>
                                    <input className="w-full rounded-lg text-[#321C00] focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 placeholder:text-[#321C00]/40 p-3 text-base font-normal transition-all" placeholder="e.g. Junior Barista" />
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">Start Date</p>
                                        <input className="w-full rounded-lg text-[#321C00] focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 p-3 text-sm font-normal transition-all" type="month" />
                                    </label>
                                    <label className="flex flex-col w-full">
                                        <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">End Date</p>
                                        <input className="w-full rounded-lg text-[#321C00] focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] h-12 p-3 text-sm font-normal transition-all" type="month" />
                                    </label>
                                </div>
                                <label className="flex flex-col w-full">
                                    <p className="text-[#321C00] dark:text-[#FAF5E8] text-sm font-medium leading-normal pb-1.5">Responsibilities</p>
                                    <textarea className="w-full rounded-lg text-[#321C00] focus:ring-2 focus:ring-[#a77c52]/50 border border-[#a77c52]/30 bg-[#FAF5E8]/30 dark:bg-neutral-900 focus:border-[#a77c52] min-h-[100px] placeholder:text-[#321C00]/40 p-3 text-base font-normal transition-all" placeholder="Describe your daily tasks..."></textarea>
                                </label>
                                <button className="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-lg border border-dashed border-[#a77c52]/40 text-[#a77c52] bg-[#a77c52]/5 hover:bg-[#a77c52]/10 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                    <span className="font-medium text-sm">Add Experience</span>
                                </button>
                            </div>
                        </details>

                    </div>
                </div>

                {/* Action Bar */}
                <div className="fixed bottom-0 w-full max-w-md bg-white dark:bg-neutral-900 border-t border-[#a77c52]/10 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 rounded-b-xl md:absolute">
                    <div className="flex gap-3">
                        <button className="flex-1 h-12 flex items-center justify-center gap-2 rounded-lg border-2 border-[#a77c52] text-[#a77c52] font-bold hover:bg-[#a77c52]/5 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                            Preview
                        </button>
                        <button className="flex-[1.5] h-12 flex items-center justify-center gap-2 rounded-lg bg-[#a77c52] text-white font-bold shadow-md hover:bg-[#8c6642] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            Download PDF
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

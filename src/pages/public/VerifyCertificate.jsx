import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function VerifyCertificate() {
    const { id } = useParams(); // This should be the Student UID
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                if (!id) throw new Error("No ID provided");

                // Add minimum loading time to prevent flicker
                await new Promise(resolve => setTimeout(resolve, 1000));

                const docRef = doc(db, "users", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().role === 'student') {
                    setStudent({ id: docSnap.id, ...docSnap.data() });
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FAF5E8] flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#a77c52] mb-4"></div>
                <p className="text-sm font-mono text-[#321C00]/50">Verifying ID: {id}...</p>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen bg-[#FAF5E8] flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-red-100">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-red-500">gpp_bad</span>
                    </div>
                    <h1 className="text-2xl font-serif font-bold text-[#321C00] mb-2">Certificate Not Found</h1>
                    <p className="text-[#321C00]/60 mb-2">
                        We could not verify a certificate with the provided ID.
                    </p>
                    <p className="text-xs font-mono bg-red-50 p-2 rounded text-red-600 mb-8 break-all">
                        Checked ID: {id}
                        <br />
                        {error ? "Error: Document fetch failed" : "Student not found"}
                    </p>
                    <Link to="/" className="inline-block px-8 py-3 bg-[#a77c52] text-white rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-[#8e6a45] transition-colors">
                        Return Home
                    </Link>
                </div>
            </div>
        );
    }

    const certificateId = `USF-${student.id.slice(0, 8).toUpperCase()}`;

    return (
        <div className="min-h-screen bg-[#FAF5E8] py-12 px-4 flex flex-col items-center">
            {/* Logo */}
            <div className="mb-12">
                <img src="/logo.jpg" alt="Usafi Coffee" className="h-16 w-auto mix-blend-multiply" />
            </div>

            <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl max-w-lg w-full border border-[#a77c52]/10 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#a77c52]/5 rounded-bl-full -mr-8 -mt-8"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#a77c52]/5 rounded-tr-full -ml-8 -mb-8"></div>

                {/* Verified Icon */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-full h-full bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-5xl text-white">verified</span>
                    </div>
                </div>

                {/* Status */}
                <div className="text-center mb-8">
                    <div className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        Officially Verified
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-[#321C00] mb-2">Valid Certificate</h1>
                    <p className="text-[#321C00]/60 text-sm">Usafi Barista Training Center</p>
                </div>

                {/* Details */}
                <div className="space-y-4 border-t border-dashed border-[#a77c52]/20 pt-8 mb-8">
                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest text-[#321C00]/40 font-bold">Student Name</span>
                        <span className="text-[#321C00] font-bold text-lg">{student.fullName || student.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest text-[#321C00]/40 font-bold">Curriculum</span>
                        <span className="text-[#321C00] font-bold text-right max-w-[200px]">{student.courseId === 'bar-tender-course' ? 'Professional Bartender' : 'Full Barista (Bean to Brew)'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest text-[#321C00]/40 font-bold">Certificate ID</span>
                        <span className="text-[#321C00] font-mono font-bold bg-[#FAF5E8] px-3 py-1 rounded-lg border border-[#a77c52]/10">{certificateId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs uppercase tracking-widest text-[#321C00]/40 font-bold">Status</span>
                        <span className="text-green-600 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Active
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-[#321C00]/40 italic">
                        This document verifies that the student has successfully completed the standard training program at Usafi.
                    </p>
                </div>
            </div>

            <div className="mt-8 text-center">
                <Link to="/" className="text-[#a77c52] text-sm font-bold hover:underline">
                    &larr; Back to Usafi Coffee
                </Link>
            </div>
        </div>
    );
}

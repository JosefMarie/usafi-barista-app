import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { GradientButton } from '../../components/ui/GradientButton';

export function PostOpportunity() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        orgName: '',
        location: '',
        contactPhone: '',
        contactEmail: '',
        type: 'Barista',
        salaryRange: '',
        genderPreference: 'Any',
        jobType: 'Full Time',
        experience: '',
        applicationLink: '',
        deadline: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';
            if (imageFile) {
                const storageRef = ref(storage, `opportunities/${Date.now()}_${imageFile.name}`);
                const uploadResult = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(uploadResult.ref);
            }

            await addDoc(collection(db, 'opportunities'), {
                ...formData,
                imageUrl,
                status: 'pending',
                createdAt: serverTimestamp(),
                deadline: formData.deadline ? new Date(formData.deadline) : null,
                targetAudience: ['public'] // Default visibility
            });

            setSuccess(true);
            // Reset form or navigate away after delay
            setTimeout(() => {
                navigate('/opportunities');
            }, 3000);
        } catch (error) {
            console.error("Error posting opportunity: ", error);
            alert(`Failed to submit opportunity: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center px-4">
                <div className="bg-[#F5DEB3] dark:bg-white/5 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-espresso/10 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-espresso dark:text-white mb-4">Submission Successful!</h2>
                    <p className="text-espresso/70 dark:text-white/70">
                        Your opportunity has been submitted for review. Once approved by an admin, it will be visible to job seekers.
                    </p>
                    <p className="text-sm text-espresso/50 mt-6">Redirecting...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark py-24 px-4 font-display">
            <div className="container mx-auto max-w-3xl">
                <div className="bg-[#F5DEB3] dark:bg-white/5 rounded-3xl shadow-2xl border border-espresso/10 p-8 md:p-12 relative overflow-hidden group">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-espresso/20 group-hover:bg-espresso transition-colors"></div>
                    <div className="text-center mb-10">
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-espresso dark:text-white mb-3">Post an Opportunity</h1>
                        <p className="text-espresso/70 dark:text-white/70">Find the perfect candidate for your venue.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Organization Details */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-primary border-b border-gray-200 dark:border-white/10 pb-2 mb-4">Organization Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Organization Name *</label>
                                    <input
                                        type="text"
                                        name="orgName"
                                        required
                                        value={formData.orgName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                        placeholder="e.g. Kigali Coffee House"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Location *</label>
                                    <input
                                        type="text"
                                        name="location"
                                        required
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                        placeholder="e.g. Kimihurura, Kigali"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Contact Phone *</label>
                                    <input
                                        type="tel"
                                        name="contactPhone"
                                        required
                                        value={formData.contactPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                        placeholder="+250..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Contact Email *</label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        required
                                        value={formData.contactEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                        placeholder="hiring@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Job Details */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-primary border-b border-gray-200 dark:border-white/10 pb-2 mb-4">Job Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Role Type *</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                    >
                                        <option value="Barista">Barista</option>
                                        <option value="Bartender">Bartender</option>
                                        <option value="Service">Service / Wait Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Employment Type *</label>
                                    <select
                                        name="jobType"
                                        value={formData.jobType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                    >
                                        <option value="Full Time">Full Time</option>
                                        <option value="Part Time">Part Time</option>
                                        <option value="Contract">Contract</option>
                                        <option value="Party Job">Party / Event Job</option>
                                        <option value="Hours">Hourly</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Salary Range</label>
                                    <input
                                        type="text"
                                        name="salaryRange"
                                        value={formData.salaryRange}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                        placeholder="e.g. 150k - 300k RWF"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Gender Preference</label>
                                    <select
                                        name="genderPreference"
                                        value={formData.genderPreference}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                    >
                                        <option value="Any">Any</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Experience / Requirements</label>
                                <textarea
                                    name="experience"
                                    rows="3"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="Briefly describe required experience or skills..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Application Link (Optional)</label>
                                    <input
                                        type="url"
                                        name="applicationLink"
                                        value={formData.applicationLink}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all placeholder:text-espresso/30"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-espresso dark:text-white mb-2">Application Deadline</label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-espresso/10 focus:ring-2 focus:ring-espresso/50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="pt-4">
                                <label className="block text-sm font-medium text-espresso dark:text-white mb-4">Opportunity Flier / Image (Optional)</label>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div
                                        onClick={() => document.getElementById('image-upload').click()}
                                        className="w-full sm:w-48 h-48 bg-white/30 dark:bg-black/20 border-2 border-dashed border-espresso/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-espresso/40 transition-all overflow-hidden relative group"
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-4xl text-espresso/20">add_photo_alternate</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-espresso/40 mt-2">Upload Flier</span>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <div className="flex-1 space-y-2">
                                        <p className="text-xs font-medium text-espresso/60 dark:text-white/60 leading-relaxed">
                                            Add a visual flier or branding to make your opportunity stand out. Supported formats: JPG, PNG, WEBP.
                                        </p>
                                        {imageFile && (
                                            <button
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-600 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-base">delete</span>
                                                Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <GradientButton onClick={handleSubmit} disabled={loading} className="w-full">
                                {loading ? 'Submitting...' : 'Submit Opportunity'}
                            </GradientButton>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';

export function ChangePasswordModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (newPassword.length < 6) {
            setError(t('change_password.err_too_short'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('change_password.err_mismatch'));
            return;
        }

        if (currentPassword === newPassword) {
            setError(t('change_password.err_same'));
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user || !user.email) {
                throw new Error(t('change_password.err_no_user'));
            }

            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update to new password
            await updatePassword(user, newPassword);

            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // Close modal after 2 seconds
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 2000);
        } catch (err) {
            console.error('Password change error:', err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError(t('change_password.err_wrong_password'));
            } else if (err.code === 'auth/weak-password') {
                setError(t('change_password.err_weak_password'));
            } else {
                setError(err.message || t('change_password.err_fail'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-espresso dark:text-white">
                        {t('change_password.title')}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-espresso/50 dark:text-white/50 hover:text-espresso dark:hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {success && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <span className="material-symbols-outlined">check_circle</span>
                            <p className="font-medium">{t('change_password.success')}</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <span className="material-symbols-outlined">error</span>
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                            {t('change_password.current_label')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder={t('change_password.current_placeholder')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-espresso/40 hover:text-espresso transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                            {t('change_password.new_label')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder={t('change_password.new_placeholder')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-espresso/40 hover:text-espresso transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-espresso dark:text-white mb-2">
                            {t('change_password.confirm_label')}
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-espresso dark:text-white placeholder:text-espresso/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder={t('change_password.confirm_placeholder')}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-espresso/40 hover:text-espresso transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-full border border-black/10 dark:border-white/10 text-espresso dark:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            {t('change_password.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading || success}
                            className="flex-1 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {loading ? t('change_password.saving') : t('change_password.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

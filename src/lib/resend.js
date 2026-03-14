import { functions, db } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Sends a password reset email via the Resend Cloud Function.
 * 
 * @param {string} email - The user's email address.
 * @param {string} resetToken - The unique reset token.
 * @param {string} userName - The user's name (optional).
 * @returns {Promise<Object>} - The Cloud Function response.
 */
export const sendPasswordResetEmail = async (email, resetToken, userName = 'User') => {
    try {
        const sendEmailFn = httpsCallable(functions, 'sendPasswordResetEmail');
        const result = await sendEmailFn({
            email,
            resetToken,
            userName
        });
        return result.data;
    } catch (error) {
        console.error('Error calling sendPasswordResetEmail function:', error);
        throw new Error(error.message || 'Failed to send password reset email via Resend.');
    }
};

/**
 * Generate and Store Reset Token in Firestore.
 * 
 * @param {string} email - The user's email address.
 * @returns {Promise<string>} - The generated reset token.
 */
export const createResetToken = async (email) => {
    // Generate a secure random token
    const resetToken = crypto.randomUUID();

    // Calculate expiration (1 hour from now)
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);

    const normalizedEmail = email.toLowerCase();

    // Store token in Firestore
    await setDoc(doc(db, 'password_reset_tokens', resetToken), {
        email: normalizedEmail,
        token: resetToken,
        expiresAt: expirationTime,
        used: false,
        createdAt: serverTimestamp()
    });

    return resetToken;
};

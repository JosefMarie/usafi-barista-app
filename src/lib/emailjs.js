import emailjs from '@emailjs/browser';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';

// EmailJS Configuration
const SERVICE_ID = 'service_g20r5el';
const TEMPLATE_ID = 'template_2ovrvfo';
const PUBLIC_KEY = 'Q9hYuRyvGFxg9anMo';

// Initialize EmailJS
export const initEmailJS = () => {
    emailjs.init(PUBLIC_KEY);
};

// Send Password Reset Email
export const sendPasswordResetEmailJS = async (email, resetToken, userName = 'User') => {
    const resetLink = `${window.location.origin}/reset-password/${resetToken}`;

    // Normalize email to lowercase for consistency, though EmailJS might not be case-sensitive
    const normalizedEmail = email.toLowerCase();

    const templateParams = {
        user_name: userName,
        email: normalizedEmail, // Use normalized email in template
        reset_link: resetLink,
    };

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        return response;
    } catch (error) {
        console.error('EmailJS Error: Failed to send password reset email.', error);
        // Re-throw a more descriptive error if needed, or just the original
        throw new Error(`Failed to send password reset email via EmailJS: ${error.message || error}`);
    }
};

// Generate and Store Reset Token
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
        expiresAt: expirationTime, // Store as Date object, Firestore converts to Timestamp
        used: false,
        createdAt: serverTimestamp()
    });

    return resetToken;
};

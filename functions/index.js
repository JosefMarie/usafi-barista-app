const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function to securely reset a user's password using a validated token.
 * Only callable if the token is valid, unused, and unexpired.
 */
exports.finalizePasswordReset = functions.https.onCall(async (data, context) => {
    const { token, newPassword } = data;

    if (!token || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'Token and new password are required.');
    }

    if (newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'Password must be at least 6 characters.');
    }

    const db = admin.firestore();
    const tokenRef = db.collection('password_reset_tokens').doc(token);

    try {
        // 1. Transaction to verifying token and ensure atomicity
        const email = await db.runTransaction(async (transaction) => {
            const tokenDoc = await transaction.get(tokenRef);

            if (!tokenDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Invalid reset token.');
            }

            const tokenData = tokenDoc.data();

            if (tokenData.used) {
                throw new functions.https.HttpsError('failed-precondition', 'Link already used.');
            }

            // Check expiration (Timestamp handling)
            const now = admin.firestore.Timestamp.now();
            if (tokenData.expiresAt < now) {
                throw new functions.https.HttpsError('failed-precondition', 'Link expired.');
            }

            // Mark as used immediately to prevent race conditions
            transaction.update(tokenRef, { used: true });

            return tokenData.email;
        });

        // 2. Find User by Email (normalize for lookup)
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
        } catch (authError) {
            console.error('Auth User Lookup Error:', authError);
            throw new functions.https.HttpsError('not-found', `No user found for email: ${email}`);
        }

        // 3. Update Password
        try {
            await admin.auth().updateUser(userRecord.uid, {
                password: newPassword,
                emailVerified: true
            });
        } catch (updateError) {
            console.error('Auth User Update Error:', updateError);
            throw new functions.https.HttpsError('internal', `Failed to update password: ${updateError.message}`);
        }

        return { success: true, message: 'Password successfully updated.' };

    } catch (error) {
        console.error('Reset Password Function Error:', error);

        // Re-throw standardized errors
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError('internal', error.message || 'Internal server error processing reset.');
    }
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Resend } = require('resend');

admin.initializeApp();

/**
 * Cloud Function to securely send a password reset email using Resend.
 */
exports.sendPasswordResetEmail = functions.https.onCall(async (request, context) => {
    const data = (request && typeof request === 'object' && 'data' in request) ? request.data : request;
    const { email, resetToken, userName = 'User' } = data || {};

    if (!email || !resetToken) {
        throw new functions.https.HttpsError('invalid-argument', 'Email and resetToken are required.');
    }

    try {
        const resendKey = process.env.RESEND_KEY || functions.config().resend?.key;
        if (!resendKey) {
            throw new Error('Resend API key is not configured. Please set RESEND_KEY in .env or via firebase functions:config.');
        }

        const resend = new Resend(resendKey);
        const appDomain = process.env.APP_DOMAIN || functions.config().app?.domain || 'usaffi-barista-app.web.app';
        const resetLink = `https://${appDomain}/reset-password/${resetToken}`;

        const { data: resendData, error } = await resend.emails.send({
            from: 'Usaffi <no-reply@usafi-barista.com>',
            to: [email],
            subject: 'Reset Your password - Usaffi',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Hello ${userName},</h2>
                    <p style="color: #555; line-height: 1.6;">We received a request to reset your password for your Usaffi account. Click the button below to choose a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="color: #777; font-size: 0.9em;">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 0.8em;">Usaffi Barista App Team</p>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            throw new functions.https.HttpsError('internal', `Resend Error: ${error.message}`);
        }

        console.log(`Password reset email sent to ${email} via Resend. ID: ${resendData.id}`);
        return { success: true, id: resendData.id };

    } catch (error) {
        console.error('sendPasswordResetEmail Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to send email.');
    }
});

/**
 * Cloud Function to securely reset a user's password using a validated token.
 * Only callable if the token is valid, unused, and unexpired.
 */
exports.finalizePasswordReset = functions.https.onCall(async (request, context) => {
    // In newer SDKs (v4+, v6+), the first argument is a 'CallableRequest' object.
    // In older SDKs, it's the raw data.
    const data = (request && typeof request === 'object' && 'data' in request) ? request.data : request;

    console.log("finalizePasswordReset triggered. Token provided:", !!data?.token);

    const { token, newPassword } = data || {};

    if (!token || !newPassword) {
        console.error("Missing fields. Token exists:", !!token, "Password exists:", !!newPassword);
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
            const expiresAtMs = tokenData.expiresAt.toMillis ? tokenData.expiresAt.toMillis() : new Date(tokenData.expiresAt).getTime();
            if (expiresAtMs < Date.now()) {
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

/**
 * Cloud Function to create a Stripe Payment Intent.
 * This securely creates a transaction and returns a client_secret for the frontend.
 */
exports.createPaymentIntent = functions.https.onCall(async (request, context) => {
    // Newer SDKs (v1.x for Callable) wrap data in 'request.data'
    const data = (request && typeof request === 'object' && 'data' in request) ? request.data : request;
    const { amount, currency = 'rwf', metadata = {} } = data || {};

    if (!amount || amount < 500) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount must be at least 500 RWF.');
    }

    try {
        const stripe = require('stripe')(functions.config().stripe.secret);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // Stripe requires integers
            currency: currency.toLowerCase(),
            metadata: {
                ...metadata,
                timestamp: new Date().toISOString()
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });

        console.log(`PaymentIntent created: ${paymentIntent.id} for amount: ${amount}`);

        return {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id
        };
    } catch (error) {
        console.error('Stripe PaymentIntent Error:', error);
        throw new functions.https.HttpsError('internal', `Stripe Error: ${error.message}`);
    }
});
/**
 * Cloud Function to broadcast an email to all users and subscribers.
 */
exports.broadcastToAll = functions.https.onCall(async (request, context) => {
    // 1. Authorization Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized. Only admins or managers can broadcast.');
    }

    const data = (request && typeof request === 'object' && 'data' in request) ? request.data : request;
    const { subject, message, title = 'Usaffi Announcement' } = data || {};

    if (!subject || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Subject and message are required.');
    }

    try {
        const resendKey = process.env.RESEND_KEY || functions.config().resend?.key;
        const resend = new Resend(resendKey);

        // 2. Fetch all emails
        const emails = new Set();

        // From Users
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => {
            const email = doc.data().email;
            if (email) emails.add(email.toLowerCase().trim());
        });

        // From Subscribers
        const subsSnapshot = await db.collection('subscribers').where('active', '==', true).get();
        subsSnapshot.forEach(doc => {
            const email = doc.data().email;
            if (email) emails.add(email.toLowerCase().trim());
        });

        const recipientList = Array.from(emails);
        
        if (recipientList.length === 0) {
            return { success: true, sentCount: 0, message: 'No recipients found.' };
        }

        // 3. Send via Resend (Using Batch API if possible, or individual sends)
        // Note: Resend Free tier has limits, for large lists we should use Audiences.
        // We'll send in batches of 100 to stay safe (Resend limit per batch)
        const batchSize = 100;
        let sentCount = 0;

        for (let i = 0; i < recipientList.length; i += batchSize) {
            const currentBatch = recipientList.slice(i, i + batchSize);
            
            const { data: resendData, error } = await resend.emails.send({
                from: 'Usaffi <no-reply@usafi-barista.com>',
                to: currentBatch,
                subject: subject,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #31211b;">${title}</h2>
                        <div style="color: #555; line-height: 1.6; font-size: 16px;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 0.8em; text-align: center;">
                            Sent from Usaffi Barista International Training Center<br>
                            If you wish to unsubscribe, please reply to this email.
                        </p>
                    </div>
                `
            });

            if (error) {
                console.error('Resend Broadcast Error in batch:', error);
            } else {
                sentCount += currentBatch.length;
            }
        }

        return { success: true, sentCount, totalRecipients: recipientList.length };

    } catch (error) {
        console.error('broadcastToAll Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to send broadcast.');
    }
});

/**
 * Cloud Function to securely reply to a contact inquiry.
 */
exports.replyToInquiry = functions.https.onCall(async (request, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
        throw new functions.https.HttpsError('permission-denied', 'Unauthorized.');
    }

    const data = (request && typeof request === 'object' && 'data' in request) ? request.data : request;
    const { messageId, recipientEmail, recipientName, subject, replyText } = data || {};

    if (!messageId || !recipientEmail || !replyText) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    try {
        const resendKey = process.env.RESEND_KEY || functions.config().resend?.key;
        const resend = new Resend(resendKey);

        const { data: resendData, error } = await resend.emails.send({
            from: 'Usaffi Support <no-reply@usafi-barista.com>',
            to: [recipientEmail],
            subject: subject || 'Response to your inquiry - Usaffi',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <p style="color: #333; font-size: 16px;">Hello ${recipientName || 'there'},</p>
                    <div style="color: #555; line-height: 1.6; font-size: 16px; margin: 20px 0;">
                        ${replyText.replace(/\n/g, '<br>')}
                    </div>
                    <p style="color: #333; font-size: 16px;">Best regards,<br>The Usaffi Team</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #999; font-size: 0.8em;">
                        This is a response to your inquiry submitted through our website.
                    </p>
                </div>
            `
        });

        if (error) {
            throw new functions.https.HttpsError('internal', `Resend Error: ${error.message}`);
        }

        // Update status in Firestore
        await db.collection('contact_messages').doc(messageId).update({
            status: 'replied',
            repliedAt: admin.firestore.FieldValue.serverTimestamp(),
            repliedBy: context.auth.uid
        });

        return { success: true };

    } catch (error) {
        console.error('replyToInquiry Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to send reply.');
    }
});

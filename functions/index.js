const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const { Resend } = require('resend');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const https = require('https');

// Initialize Firebase Admin
admin.initializeApp();

// Set global options for all v2 functions
setGlobalOptions({ maxInstances: 10, region: 'us-central1' });

/**
 * Shared branding constants for emails and documents
 */
const BRAND = {
    espresso: '#31211b',
    cream: '#F5DEB3',
    gold: '#D4Af37',
    white: '#FFFFFF',
    font: 'serif',
    sender: 'Usafi Barista <info@usafi-barista.com>',
    adminEmail: 'usaficoffee@gmail.com',
    logo: 'https://usafi-barista.com/logo.jpg',
    signature: 'https://usafi-barista.com/image/GASARASI_Signature.png',
    stamp: 'https://usafi-barista.com/image/Stamp%20PNg.png'
};

/**
 * Helper to fetch image bytes from a URL
 */
function fetchImageBytes(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: { 'User-Agent': 'Usafi-Barista-App' }
        };
        https.get(url, options, (res) => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                // Handle basic redirects
                return fetchImageBytes(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: ${res.statusCode} at ${url}`));
                return;
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', (err) => reject(err));
    });
}

/**
 * Returns a high-fidelity HTML template for emails
 */
function getBrandedTemplate(type, data) {
    const header = `
        <div style="background-color: ${BRAND.espresso}; padding: 40px 20px; text-align: center; border-radius: 20px 20px 0 0;">
            <div style="margin-bottom: 20px;">
                <img src="${BRAND.logo}" alt="Usafi Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid ${BRAND.gold};">
            </div>
            <h1 style="color: ${BRAND.white}; margin: 0; font-family: 'Playfair Display', serif; letter-spacing: 2px; text-transform: uppercase; font-size: 28px;">Usafi Barista</h1>
            <p style="color: ${BRAND.gold}; margin: 10px 0 0; font-family: sans-serif; letter-spacing: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">International Training Center</p>
        </div>
    `;

    const footer = `
        <div style="background-color: #f9f7f2; padding: 30px 20px; text-align: center; border-radius: 0 0 20px 20px; border-top: 1px solid ${BRAND.cream};">
            <p style="color: ${BRAND.espresso}; margin: 0; font-family: sans-serif; font-size: 14px; font-weight: bold;">Authenticity. Artistry. Excellence.</p>
            <p style="color: #999; margin: 10px 0 0; font-family: sans-serif; font-size: 11px;">
                Rubangura Plaza, Kigali, Rwanda<br>
                www.usafi-barista.com | info@usafi-barista.com
            </p>
        </div>
    `;

    let content = '';

    switch (type) {
        case 'welcome_pending': {
            const isBartender = data.courseName?.toLowerCase().includes('bartender') || data.courseId === 'bar-tender';
            const centerName = isBartender ? 'Usafi International Training Center' : 'Usafi Barista International Training Center';
            content = `
                <div style="padding: 40px; background-color: ${BRAND.white}; font-family: sans-serif;">
                    <h2 style="color: ${BRAND.espresso}; margin-top: 0;">Hello ${data.fullName},</h2>
                    <p style="color: #444; line-height: 1.6; font-size: 16px;">
                        Thank you for applying to the <b>${centerName}</b>. Your application for the <b>${data.courseName || 'program'}</b> has been received and is currently under review by our admissions team.
                    </p>
                    ${isBartender 
                        ? `<p style="color: #666; font-style: italic; font-size: 14px;">"Master the art of mixology and cocktail excellence."</p>`
                        : `<p style="color: #666; font-style: italic; font-size: 14px;">"Brew your future with the masters of Rwandan coffee."</p>`
                    }
                    
                    <div style="background-color: #fcfaf5; padding: 25px; border-radius: 15px; border-left: 5px solid ${BRAND.gold}; margin: 30px 0;">
                        <h4 style="color: ${BRAND.espresso}; margin-top: 0; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Your Login Credentials</h4>
                        <p style="color: #666; margin: 5px 0; font-size: 14px;">Email: <b>${data.email}</b></p>
                        <p style="color: #666; margin: 5px 0; font-size: 14px;">Password: <b>${data.password}</b></p>
                        <p style="color: #999; margin-top: 15px; font-size: 11px; font-style: italic;">Note: Keep these credentials safe. You will be able to access the student portal once your application is approved.</p>
                    </div>

                    <p style="color: #444; line-height: 1.6; font-size: 16px;">
                        <b>Next Steps:</b><br>
                        Our team will verify your details and payment (if submitted). You will receive another email the moment your account is activated.
                    </p>
                </div>
            `;
            break;
        }

        case 'admin_alert':
            content = `
                <div style="padding: 40px; background-color: ${BRAND.white}; font-family: sans-serif;">
                    <h2 style="color: ${BRAND.espresso}; margin-top: 0;">New Registration Alert</h2>
                    <p style="color: #444; line-height: 1.6; font-size: 16px;">
                        A new application has been submitted on the platform.
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 12px; text-transform: uppercase;">Applicant</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${BRAND.espresso};">${data.fullName}</td></tr>
                        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 12px; text-transform: uppercase;">Email</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
                        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 12px; text-transform: uppercase;">Phone</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.phone}</td></tr>
                        <tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 12px; text-transform: uppercase;">Program</td><td style="padding: 10px; border-bottom: 1px solid #eee; color: ${BRAND.gold}; font-weight: bold;">${data.courseName || 'N/A'}</td></tr>
                        ${data.startDate ? `<tr><td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 12px; text-transform: uppercase;">Desired Start</td><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${data.startDate}</td></tr>` : ''}
                    </table>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://usafi-barista.com/admin/students" style="display: inline-block; background-color: ${BRAND.espresso}; color: ${BRAND.white}; padding: 12px 30px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">Review in Dashboard</a>
                    </div>
                </div>
            `;
            break;

        case 'activation':
            content = `
                <div style="padding: 40px; background-color: ${BRAND.white}; font-family: sans-serif;">
                    <h2 style="color: ${BRAND.espresso}; margin-top: 0;">Account Activated!</h2>
                    <p style="color: #444; line-height: 1.6; font-size: 16px;">
                        Congratulations, <b>${data.fullName}</b>! Your application has been approved and your account is now **fully active**.
                    </p>
                    <p style="color: #444; line-height: 1.6; font-size: 16px;">
                        You can now log in to the Usafi Student Portal to access your course materials, track your progress, and join our community of world-class professionals.
                    </p>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <a href="https://usafi-barista.com/login" style="display: inline-block; background-color: ${BRAND.espresso}; color: ${BRAND.white}; padding: 15px 40px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(49, 33, 27, 0.2);">Enter Student Portal</a>
                    </div>

                    <div style="background-color: #f7f3f1; padding: 20px; border-radius: 12px; text-align: center;">
                        <p style="color: ${BRAND.espresso}; font-size: 14px; margin: 0;"><b>Attached:</b> Your official Usafi Welcome Letter (PDF)</p>
                    </div>
                </div>
            `;
            break;

        default:
            content = `<div style="padding: 40px;">${data.message || ''}</div>`;
    }

    return `
        <html>
            <body style="margin: 0; padding: 20px; background-color: #f0f0f0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: ${BRAND.white}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                    ${header}
                    ${content}
                    ${footer}
                </div>
            </body>
        </html>
    `;
}

/**
 * Utility to generate a beautiful, personalized Welcome PDF with Brand Assets
 */
async function generateWelcomePDF(userData) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    
    const fontPrimary = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const isBartender = (userData.courseName || '').toLowerCase().includes('bartender') || (userData.courseName || '').toLowerCase().includes('mixology');

    // Load Images
    let logoImage, signatureImage, stampImage;
    try {
        const [logoBytes, sigBytes, stampBytes] = await Promise.all([
            fetchImageBytes(BRAND.logo),
            fetchImageBytes(BRAND.signature),
            fetchImageBytes(BRAND.stamp)
        ]);
        logoImage = await pdfDoc.embedJpg(logoBytes);
        signatureImage = await pdfDoc.embedPng(sigBytes);
        stampImage = await pdfDoc.embedPng(stampBytes);
    } catch (err) {
        console.error("Image loading failed for PDF:", err);
    }

    // Background Color
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.98, 0.96, 0.92), // Soft Cream
    });

    // Border
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderWidth: 2,
        borderColor: rgb(0.19, 0.13, 0.11), // Espresso
    });

    // Draw Logo if available
    if (logoImage) {
        const logoDims = logoImage.scale(0.07); // Reduced by half again
        page.drawImage(logoImage, {
            x: 50,
            y: height - 95, // Aligned with the title text
            width: logoDims.width,
            height: logoDims.height,
        });
    }

    // Header Title
    page.drawText('USAFI BARISTA', {
        x: 130, // Pushed right to avoid interference
        y: height - 90, // Aligned with logo center
        size: 32,
        font: fontPrimary,
        color: rgb(0.19, 0.13, 0.11),
    });

    page.drawText('INTERNATIONAL TRAINING CENTER', {
        x: 130,
        y: height - 110,
        size: 12,
        font: fontRegular,
        color: rgb(0.83, 0.68, 0.21), // Gold
    });

    // Body
    page.drawText('LETTER OF ADMISSION', {
        x: width / 2 - 100,
        y: height - 250,
        size: 20,
        font: fontPrimary,
        color: rgb(0.19, 0.13, 0.11),
    });

    const bodyText = [
        `Dear ${userData.fullName},`,
        '',
        'It is with great pleasure that we welcome you to the Usafi Barista International Training Center.',
        'Your application has been reviewed and approved for the following program:',
        '',
        `Program: ${userData.courseName || 'Professional Training Certification'}`,
        `Role: ${userData.role || 'Student'}`,
        `Start Date: ${userData.startDate || 'To Be Scheduled'}`,
        '',
        isBartender 
            ? 'At Usafi, we believe that mixology is an delicate balance of flavor, technique, and presentation.'
            : 'At Usafi, we believe that coffee is more than just a beverage—it is an art, a science, and a community.',
        isBartender
            ? 'You are now part of a network of elite beverage professionals dedicated to the mastery of the bar.'
            : 'You are now part of a network of elite professionals dedicated to the pursuit of excellence in every cup.',
        '',
        'We look forward to seeing you thrive in our operational facilities.',
        '',
        'Best regards,',
    ];

    let currentY = height - 320;
    for (const line of bodyText) {
        page.drawText(line, {
            x: 50,
            y: currentY,
            size: 12,
            font: fontRegular,
            color: rgb(0.3, 0.3, 0.3),
        });
        currentY -= 20;
    }

    // Signatures and Stamp Section
    const sigY = currentY - 60;
    
    if (signatureImage) {
        const sigDims = signatureImage.scale(0.3);
        page.drawImage(signatureImage, {
            x: 50,
            y: sigY,
            width: sigDims.width,
            height: sigDims.height,
        });
    }

    if (stampImage) {
        const stampDims = stampImage.scale(0.1); // Micro scale
        page.drawImage(stampImage, {
            x: 140, 
            y: sigY - 45, // Aligned down a little as requested
            width: stampDims.width,
            height: stampDims.height,
            opacity: 0.85
        });
    }

    page.drawText('________________________', { x: 50, y: sigY - 10, size: 12, font: fontRegular, color: rgb(0.19, 0.13, 0.11) });
    page.drawText('Gasarasi', { x: 50, y: sigY - 30, size: 14, font: fontPrimary, color: rgb(0.19, 0.13, 0.11) });
    page.drawText('CEO & Founder', { x: 50, y: sigY - 45, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Usafi International Training Center', { x: 50, y: sigY - 60, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });

    // Footer decoration
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: 10,
        color: rgb(0.19, 0.13, 0.11),
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

/**
 * Cloud Function to securely send a password reset email using Resend.
 */
exports.sendPasswordResetEmail = onCall(async (request) => {
    const { email, resetToken, userName = 'User' } = request.data || {};

    if (!email || !resetToken) {
        throw new HttpsError('invalid-argument', 'Email and resetToken are required.');
    }

    try {
        const resendKey = process.env.RESEND_KEY;
        const resend = new Resend(resendKey);
        const appDomain = process.env.APP_DOMAIN || 'usafi-barista.com';
        const resetLink = `https://${appDomain}/reset-password/${resetToken}`;

        const { data: resendData, error } = await resend.emails.send({
            from: BRAND.sender,
            to: [email],
            subject: 'Reset Your password - Usafi',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: ${BRAND.espresso};">Hello ${userName},</h2>
                    <p style="color: #555; line-height: 1.6;">We received a request to reset your password for your Usafi account. Click the button below to choose a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: ${BRAND.espresso}; color: ${BRAND.white}; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                    </div>
                    <p style="color: #777; font-size: 0.9em;">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 0.8em;">Usafi Barista App Team</p>
                </div>
            `
        });

        if (error) {
            console.error('Resend Error:', error);
            throw new HttpsError('internal', `Resend Error: ${error.message}`);
        }

        return { success: true, id: resendData.id };
    } catch (error) {
        console.error('sendPasswordResetEmail Error:', error);
        throw new HttpsError('internal', error.message || 'Failed to send email.');
    }
});

/**
 * Cloud Function to securely reset a user's password using a validated token.
 */
exports.finalizePasswordReset = onCall(async (request) => {
    const { token, newPassword } = request.data || {};

    if (!token || !newPassword) {
        throw new HttpsError('invalid-argument', 'Token and new password are required.');
    }

    const db = admin.firestore();
    const tokenRef = db.collection('password_reset_tokens').doc(token);

    try {
        const email = await db.runTransaction(async (transaction) => {
            const tokenDoc = await transaction.get(tokenRef);
            if (!tokenDoc.exists) throw new HttpsError('not-found', 'Invalid reset token.');
            const tokenData = tokenDoc.data();
            if (tokenData.used) throw new HttpsError('failed-precondition', 'Link already used.');
            const expiresAtMs = tokenData.expiresAt.toMillis ? tokenData.expiresAt.toMillis() : new Date(tokenData.expiresAt).getTime();
            if (expiresAtMs < Date.now()) throw new HttpsError('failed-precondition', 'Link expired.');
            transaction.update(tokenRef, { used: true });
            return tokenData.email;
        });

        const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());
        await admin.auth().updateUser(userRecord.uid, { password: newPassword, emailVerified: true });

        return { success: true, message: 'Password successfully updated.' };
    } catch (error) {
        console.error('Reset Password Function Error:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'Internal server error processing reset.');
    }
});

/**
 * Cloud Function to create a Stripe Payment Intent.
 */
exports.createPaymentIntent = onCall(async (request) => {
    const { amount, currency = 'rwf', metadata = {} } = request.data || {};
    const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

    try {
        const stripe = require('stripe')(stripeSecret);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: currency.toLowerCase(),
            metadata: { ...metadata, timestamp: new Date().toISOString() },
            automatic_payment_methods: { enabled: true },
        });

        return { clientSecret: paymentIntent.client_secret, id: paymentIntent.id };
    } catch (error) {
        console.error('Stripe PaymentIntent Error:', error);
        throw new HttpsError('internal', `Stripe Error: ${error.message}`);
    }
});

/**
 * Cloud Function to broadcast an email to all users and subscribers.
 */
exports.broadcastToAll = onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const { subject, message, title = 'Usafi Announcement' } = data || {};
    const db = admin.firestore();
    
    try {
        const userDoc = await db.collection('users').doc(auth.uid).get();
        const userData = userDoc.data();
        if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
            throw new HttpsError('permission-denied', 'Unauthorized.');
        }

        const resendKey = process.env.RESEND_KEY;
        const resend = new Resend(resendKey);

        const emails = new Set();
        const usersSnapshot = await db.collection('users').get();
        usersSnapshot.forEach(doc => { if (doc.data().email) emails.add(doc.data().email.toLowerCase().trim()); });

        const subsSnapshot = await db.collection('subscribers').where('active', '==', true).get();
        subsSnapshot.forEach(doc => { if (doc.data().email) emails.add(doc.data().email.toLowerCase().trim()); });

        const recipientList = Array.from(emails);
        if (recipientList.length === 0) return { success: true, sentCount: 0 };

        const batchSize = 100;
        let sentCount = 0;
        for (let i = 0; i < recipientList.length; i += batchSize) {
            const currentBatch = recipientList.slice(i, i + batchSize);
            const { data: resendData, error } = await resend.emails.send({
                from: BRAND.sender,
                to: currentBatch,
                subject: subject,
                html: getBrandedTemplate('generic', { title, message })
            });
            if (!error) sentCount += currentBatch.length;
        }

        return { success: true, sentCount, totalRecipients: recipientList.length };
    } catch (error) {
        console.error('broadcastToAll Error:', error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', error.message || 'Failed to send broadcast.');
    }
});

/**
 * Cloud Function to securely reply to a contact inquiry.
 */
exports.replyToInquiry = onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    if (!userData || (userData.role !== 'admin' && userData.role !== 'manager')) {
        throw new HttpsError('permission-denied', 'Unauthorized.');
    }

    const { messageId, recipientEmail, recipientName, subject, replyText } = data || {};
    if (!messageId || !recipientEmail || !replyText) throw new HttpsError('invalid-argument', 'Missing fields.');

    try {
        const resendKey = process.env.RESEND_KEY;
        const resend = new Resend(resendKey);

        const { error } = await resend.emails.send({
            from: BRAND.sender,
            to: [recipientEmail],
            subject: subject || 'Response to your inquiry - Usafi',
            html: getBrandedTemplate('generic', { 
                message: `Hello ${recipientName || 'there'},\n\n${replyText}\n\nBest regards,\nThe Usafi Team` 
            })
        });

        if (error) throw new HttpsError('internal', `Resend Error: ${error.message}`);

        await db.collection('contact_messages').doc(messageId).update({
            status: 'replied',
            repliedAt: admin.firestore.FieldValue.serverTimestamp(),
            repliedBy: auth.uid
        });

        return { success: true };
    } catch (error) {
        console.error('replyToInquiry Error:', error);
        throw new HttpsError('internal', error.message || 'Failed to send reply.');
    }
});

/**
 * Cloud Function to send immediate registration notice.
 */
exports.sendRegistrationNotice = onCall(async (request) => {
    const { fullName, email, phone, courseName, password, type, startDate } = request.data || {};
    if (!email || !fullName) throw new HttpsError('invalid-argument', 'Missing fields.');

    const resendKey = process.env.RESEND_KEY;
    const resend = new Resend(resendKey);

    try {
        await resend.emails.send({
            from: BRAND.sender,
            to: [email],
            subject: 'Application Received - Usafi Barista',
            html: getBrandedTemplate('welcome_pending', { fullName, email, password, courseName, startDate })
        });

        await resend.emails.send({
            from: BRAND.sender,
            to: [BRAND.adminEmail],
            subject: `New Application: ${fullName} (${type || 'Student'})`,
            html: getBrandedTemplate('admin_alert', { fullName, email, phone, courseName, startDate })
        });

        return { success: true };
    } catch (error) {
        console.error('sendRegistrationNotice Error:', error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * Cloud Function Trigger: When user status changes to 'active'.
 */
exports.onUserStatusChange = onDocumentUpdated("users/{userId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if ((before.status === 'pending' || !before.status) && after.status === 'active') {
        const userId = event.params.userId;
        console.log(`onUserStatusChange: Activating user ${userId}`);

        try {
            const resendKey = process.env.RESEND_KEY;
            const resend = new Resend(resendKey);

            const pdfBytes = await generateWelcomePDF({
                fullName: after.fullName || after.name,
                role: after.role,
                courseName: after.courseName || after.courseId || 'Professional Training Course',
                startDate: after.startDate
            });

            await resend.emails.send({
                from: BRAND.sender,
                to: [after.email],
                subject: 'Your Usafi Account is Active!',
                html: getBrandedTemplate('activation', { fullName: after.fullName || after.name, courseName: after.courseName || after.courseId }),
                attachments: [
                    {
                        filename: 'Usafi_Welcome_Letter.pdf',
                        content: Buffer.from(pdfBytes).toString('base64')
                    }
                ]
            });

            console.log(`Activation email sent to ${after.email}`);
        } catch (error) {
            console.error('onUserStatusChange Error:', error);
        }
    }
});

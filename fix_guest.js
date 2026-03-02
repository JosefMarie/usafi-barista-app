import { db, auth } from './src/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

async function createGuestAccount() {
    const email = 'guest@test.com';
    const password = 'password123';

    console.log(`Creating guest account: ${email}`);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            name: 'Weekend Guest',
            email: email,
            role: 'weekend_guest',
            status: 'active',
            createdAt: serverTimestamp(),
            phone: '',
            bio: 'Test Guest Account',
            avatar: `https://ui-avatars.com/api/?name=Guest&background=rose&color=white`
        });

        console.log('Guest account created successfully!');
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('Account already exists in Auth, updating Firestore role...');
            // Logic to just update role if needed, but usually we need UID
            console.log('Try to sign in first to get UID or check console if you can see it.');
        } else {
            console.error('Error creating guest account:', error);
        }
    }
}

createGuestAccount();

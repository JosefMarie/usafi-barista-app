import { db, auth } from './src/lib/firebase';
import { query, collection, where, getDocs } from 'firebase/firestore';

async function verifyUser() {
    const email = 'guest@test.com';
    console.log(`Checking for user: ${email}`);

    try {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('User not found in Firestore "users" collection.');
        } else {
            querySnapshot.forEach((doc) => {
                console.log(`Found User: ${doc.id}`);
                console.log('Data:', doc.data());
            });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

verifyUser();

import { doc, getDoc, setDoc, collection, serverTimestamp, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export const seedSystemData = async (force = false) => {
    console.log("System Seeder: Checking integrity...");
    const results = {
        courses: 0,
        modules: 0,
        settings: false
    };

    try {
        // 1. Seed Global Settings (Settings already in App.jsx but good to have here too)
        const settingsRef = doc(db, 'system_settings', 'global');
        const settingsSnap = await getDoc(settingsRef);
        if (!settingsSnap.exists() || force) {
            await setDoc(settingsRef, {
                maintenanceMode: false,
                registrationsOpen: true,
                updatedAt: serverTimestamp()
            }, { merge: true });
            results.settings = true;
        }

        // 2. Seed Default Courses
        const defaultCourses = [
            {
                id: 'bean-to-brew',
                data: {
                    title: 'Bean to Brew: The Complete Barista Guide',
                    description: 'Master the art of coffee making from bean selection to perfect extraction and customer service.',
                    status: 'published',
                    thumbnail: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=1000',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            },
            {
                id: 'bar-tender-course',
                data: {
                    title: 'Professional Bartender Course',
                    description: 'Master the art of mixology, cocktail crafting, and bar management.',
                    status: 'draft',
                    thumbnail: 'https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&q=80&w=1000',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            }
        ];

        for (const course of defaultCourses) {
            const courseRef = doc(db, 'courses', course.id);
            const courseSnap = await getDoc(courseRef);
            if (!courseSnap.exists() || force) {
                await setDoc(courseRef, course.data, { merge: true });
                results.courses++;

                // 3. Seed Basic Modules for the main course
                if (course.id === 'bean-to-brew') {
                    const modulesRef = collection(db, 'courses', course.id, 'modules');
                    const modulesSnap = await getDocs(modulesRef);

                    if (modulesSnap.empty || force) {
                        const starterModules = [
                            {
                                title: "Module 1: The Coffee Bean Odyssey",
                                description: "Discover the origins and varieties of coffee beans.",
                                status: "published",
                                isFinalAssessment: false,
                                order: 1,
                                content: [
                                    { type: "text", title: "History of Coffee", body: "Coffee's journey began in the ancient coffee forests on the Ethiopian plateau..." },
                                    { type: "image", title: "Coffee Regions", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000" }
                                ]
                            },
                            {
                                title: "Module 2: Extraction Science",
                                description: "The chemistry of the perfect pour.",
                                status: "published",
                                isFinalAssessment: false,
                                order: 2,
                                content: [
                                    { type: "text", title: "Water and Heat", body: "The ideal temperature for extraction is between 90°C and 96°C..." }
                                ]
                            },
                            {
                                title: "Final Assessment",
                                description: "Test your knowledge to earn your certification.",
                                isFinalAssessment: true,
                                status: "published",
                                order: 99,
                                quiz: {
                                    passMark: 75,
                                    questions: [
                                        { question: "What is the ideal extraction temperature range?", options: ["80-85°C", "90-96°C", "100-105°C"], correct: 1 }
                                    ]
                                }
                            }
                        ];

                        for (const mod of starterModules) {
                            await addDoc(modulesRef, {
                                ...mod,
                                createdAt: serverTimestamp()
                            });
                            results.modules++;
                        }
                    }
                }
            }
        }

        console.log("System Seeder: Sync complete.", results);
        return results;
    } catch (error) {
        console.error("System Seeder: Failed during sync:", error);
        throw error;
    }
};

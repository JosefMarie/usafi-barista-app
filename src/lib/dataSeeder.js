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
            }

            // 3. Seed Basic Modules for the main course
            if (course.id === 'bean-to-brew') {
                const modulesRef = collection(db, 'courses', course.id, 'modules');
                const modulesSnap = await getDocs(modulesRef);

                // NEW: Specific check for Syrup's Tips to ensure it's added even if other modules exist
                const syrupTipsTitle = "Module 20: Syrup's Tips";
                const hasSyrupTips = modulesSnap.docs.some(d => d.data().title === syrupTipsTitle || d.data().title?.includes("Syrup's Tips"));

                if (modulesSnap.empty || force || !hasSyrupTips) {
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
                            title: syrupTipsTitle,
                            description: "Expert tips on using syrups to enhance your coffee creations.",
                            status: "published",
                            isFinalAssessment: false,
                            noExam: true,
                            order: 20,
                            content: [
                                { type: "text", title: "Syrup Basics", body: "Syrups are concentrated solutions of sugar in water, often flavored with extracts or oils. They are essential for creating specialty coffee drinks like lattes, macchiatos, and frappés." },
                                { type: "text", title: "Common Flavor Profiles", body: "Vanilla, Caramel, Hazelnut, and Chocolate are the classics. But don't be afraid to experiment with Lavender, Rose, or spicy flavors like Cinnamon and Cardamom." },
                                { type: "text", title: "Dosing and Ratio", body: "A standard pump is usually 1/4 ounce (7.5ml). For a 12oz drink, use 2 pumps. For 16oz, use 3 pumps. Adjust according to the sweetness of the syrup brand." },
                                { type: "text", title: "Storage and Maintenance", body: "Keep syrups in a cool, dry place. Always use a pump or a pour spout to prevent contamination. Clean pumps regularly with warm water to prevent crystallization." },
                                { type: "text", title: "Creative Combinations", body: "Try mixing flavors! Vanilla and Caramel create a 'Dulce de Leche' profile. Hazelnut and Chocolate give a 'Nutella' vibe." }
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
                        // Only add if it doesn't exist by title to avoid duplicates during partial syncs
                        const exists = modulesSnap.docs.some(d => d.data().title === mod.title);
                        if (!exists || force) {
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

        // 4. Seed Default Equipment & Tools
        const equipmentRef = collection(db, 'equipment');
        const equipmentSnap = await getDocs(equipmentRef);
        
        if (equipmentSnap.empty || force) {
            const defaultEquipment = [
                // Machinery
                {
                    name: "Espresso Machine",
                    category: "machinery",
                    description: "Institutional Grade dual-boiler system with PID temp control and high pressure stability. Essential for high-volume service.",
                    price: "4,500,000 RWF",
                    tags: ["Master Asset", "Institutional Grade"],
                    icon: "coffee_maker",
                    imageUrl: "/image/espresso-machine.jpeg",
                    order: 1
                },
                {
                    name: "Professional Grinder",
                    category: "machinery",
                    description: "Stepless adjustment with 64mm flat burrs. Delivers uniform particle size for perfect extraction consistency.",
                    price: "1,200,000 RWF",
                    tags: ["Precision Node", "Consistency"],
                    icon: "settings_input_component",
                    imageUrl: "/image/coffee-grinder.jpeg",
                    order: 2
                },
                // Smallwares
                {
                    name: "Precision Tamper",
                    category: "smallwares",
                    description: "58.5mm stainless steel flat base with ergonomic handle for perfectly level tamping pressure.",
                    tag: "Core Essential",
                    icon: "hardware",
                    imageUrl: "/image/tamper.jpeg",
                    order: 3
                },
                {
                    name: "Milk Pitcher",
                    category: "smallwares",
                    description: "Teflon coated 600ml pitcher with precision spout for advanced latte art and temperature control.",
                    tag: "Core Essential",
                    icon: "local_cafe",
                    imageUrl: "/image/pitcher.jpeg",
                    order: 4
                },
                {
                    name: "Knock Box",
                    category: "smallwares",
                    description: "Heavy-duty commercial grade knock box with shock-absorbing bar for efficient puck disposal.",
                    tag: "Core Essential",
                    icon: "delete",
                    imageUrl: "/image/knock-box.jpeg",
                    order: 5
                },
                {
                    name: "Digital Scales",
                    category: "smallwares",
                    description: "0.1g accuracy with built-in timer. Waterproof nano-coating for intensive bar use.",
                    tag: "High Precision",
                    icon: "scale",
                    imageUrl: "/image/scale.jpeg",
                    order: 6
                },
                // Serving
                {
                    name: "Glassware & Ceramics",
                    category: "serving",
                    description: "Heat-retaining double-walled glasses and high-density ceramic cups for optimal temperature stability.",
                    icon: "coffee",
                    order: 7
                },
                {
                    name: "Inventory Storage",
                    category: "serving",
                    description: "Airtight, UV-protected bean hoppers and modular storage systems for ingredient freshness.",
                    icon: "inventory_2",
                    order: 8
                },
                {
                    name: "Digital POS System",
                    category: "serving",
                    description: "Integrated cloud-based point of sale for seamless transaction management and inventory tracking.",
                    icon: "point_of_sale",
                    order: 9
                },
                // Hygiene
                {
                    name: "Maintenance Kit",
                    category: "hygiene",
                    description: "Full set of group-head brushes, steam wand needles, and portafilter scrapers.",
                    icon: "cleaning_services",
                    order: 10
                },
                {
                    name: "Cleaning Agents",
                    category: "hygiene",
                    description: "Food-safe backflush detergent and milk-line cleaners for daily architectural hygiene.",
                    icon: "science",
                    order: 11
                },
                {
                    name: "Protective Gear",
                    category: "hygiene",
                    description: "High-grade leather aprons and thermal gloves for operational safety and professional aesthetic.",
                    icon: "shield",
                    order: 12
                }
            ];

            for (const item of defaultEquipment) {
                // Use name as part of check to avoid duplicates during partial seeding
                const exists = equipmentSnap.docs.some(d => d.data().name === item.name);
                if (!exists || force) {
                    await addDoc(equipmentRef, {
                        ...item,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
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

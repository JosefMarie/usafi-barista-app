const fs = require('fs');

const studentKeys = {
    "dashboard": {
        "welcome": "Welcome back, {{name}}!",
        "subtitle": "Ready to brew some excellence today?",
        "current_expedition": "Current Expedition",
        "stats": {
            "courses": "Courses Available",
            "completed": "Completed Modules",
            "certificates": "Certificates Earned",
            "mins": "mins"
        },
        "curriculum": {
            "title": "Primary Curriculum",
            "view_map": "View Learning Map",
            "status_active": "In Extraction",
            "sync": "Sync",
            "resume_btn": "Resume Professional Journey",
            "empty": "No active curriculum detected."
        },
        "next_step": {
            "title": "Strategic Next Step",
            "upcoming": "Upcoming Module",
            "duration": "Duration",
            "units": "Units",
            "slides": "Slides",
            "initiate_btn": "Initiate Module",
            "completed_title": "Peak Excellence Achieved",
            "completed_subtitle": "All objectives successfully extracted."
        }
    },
    "courses": {
        "not_found": "Course not found.",
        "academic_standard": "Academic Standard",
        "units_count_one": "1 Strategic Unit",
        "units_count_other": "{{count}} Strategic Units",
        "curriculum_map": "Curriculum Map",
        "unit_label": "Strategic Unit",
        "auth_required": "Authorization Required",
        "locked_note": "Contact instructor for strategic clearance",
        "reexamine": "Re-examine",
        "commence": "Commence",
        "locked_btn": "Locked"
    }
};

const frKeys = {
    "dashboard": {
        "welcome": "Bon retour, {{name}} !",
        "subtitle": "Prêt à préparer l'excellence aujourd'hui ?",
        "current_expedition": "Expédition Actuelle",
        "stats": {
            "courses": "Cours Disponibles",
            "completed": "Modules Terminés",
            "certificates": "Certificats Obtenus",
            "mins": "mins"
        },
        "curriculum": {
            "title": "Programme Principal",
            "view_map": "Voir la Carte d'Apprentissage",
            "status_active": "En Extraction",
            "sync": "Sync",
            "resume_btn": "Reprendre le Parcours Professionnel",
            "empty": "Aucun programme actif détecté."
        },
        "next_step": {
            "title": "Prochaine Étape Stratégique",
            "upcoming": "Module à Venir",
            "duration": "Durée",
            "units": "Unités",
            "slides": "Diapositives",
            "initiate_btn": "Initier le Module",
            "completed_title": "Excellence Maximale Atteinte",
            "completed_subtitle": "Tous les objectifs ont été extraits avec succès."
        }
    },
    "courses": {
        "not_found": "Cours non trouvé.",
        "academic_standard": "Norme Académique",
        "units_count_one": "1 Unité Stratégique",
        "units_count_other": "{{count}} Unités Stratégiques",
        "curriculum_map": "Carte du Programme",
        "unit_label": "Unité Stratégique",
        "auth_required": "Autorisation Requise",
        "locked_note": "Contactez l'instructeur pour une autorisation stratégique",
        "reexamine": "Réexaminer",
        "commence": "Commencer",
        "locked_btn": "Verrouillé"
    }
};

const rwKeys = {
    "dashboard": {
        "welcome": "Murakaza neza, {{name}}!",
        "subtitle": "Witeguye gukora neza uyu munsi?",
        "current_expedition": "Gahunda y'Ubu",
        "stats": {
            "courses": "Amasomo Ahari",
            "completed": "Modire Zarangiye",
            "certificates": "Impamyabumenyi",
            "mins": "Iminota"
        },
        "curriculum": {
            "title": "Integanyanyigisho y'Ibanze",
            "view_map": "Reba Ikarita yo Kwiga",
            "status_active": "Iri Gukorwa",
            "sync": "Guhenura",
            "resume_btn": "Komeza Urugendo rw'Umwuga",
            "empty": "Nta nteganyanyigisho yabonetse."
        },
        "next_step": {
            "title": "Intambwe Ikurikira",
            "upcoming": "Modire Ikurikira",
            "duration": "Igihe",
            "units": "Ibice",
            "slides": "Slides",
            "initiate_btn": "Tangira",
            "completed_title": "Wageze ku Ntsinzi",
            "completed_subtitle": "Intego zose zagezweho neza."
        }
    },
    "courses": {
        "not_found": "Isomo ntiryabonetse.",
        "academic_standard": "Ireme ry'Uburezi",
        "units_count_one": "Igice 1",
        "units_count_other": "Ibice {{count}}",
        "curriculum_map": "Ikarita y'Integanyanyigisho",
        "unit_label": "Igice",
        "auth_required": "Uruhushya rurakenewe",
        "locked_note": "Ohereza ubutumwa mwarimu kugira ufungurirwe",
        "reexamine": "Ongera urebe",
        "commence": "Tangira",
        "locked_btn": "Hafunze"
    }
};

function updateFile(filePath, keys) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.student = keys;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${filePath}`);
}

updateFile('d:/Usaffi/usafi-barista-app/src/locales/en.json', studentKeys);
updateFile('d:/Usaffi/usafi-barista-app/src/locales/fr.json', frKeys);
updateFile('d:/Usaffi/usafi-barista-app/src/locales/rw.json', rwKeys);

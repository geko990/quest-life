/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   Constants Module
   ============================================ */

export const APP_VERSION = '2.8.00';

export const DEFAULT_ATTRIBUTES = [
    { id: 'str', name: 'Forza', icon: '💪', description: 'Forza fisica e mentale. Esercizio, resistenza, disciplina e capacità di affrontare sfide difficili.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'dex', name: 'Destrezza', icon: '⚡', description: 'Agilità e velocità. Produttività, adattamento e rapidità decisionale. Multitasking efficiente.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'con', name: 'Costituzione', icon: '🛡️', description: 'Salute e resistenza. Alimentazione, sonno, gestione stress e cura del corpo.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'int', name: 'Intelligenza', icon: '🧠', description: 'Apprendimento e problem solving. Studio, lettura, pensiero critico. Include l\'empatia cognitiva.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'wis', name: 'Saggezza', icon: '✨', description: 'Intuizione e consapevolezza. Mindfulness, riflessione, decisioni allineate ai tuoi valori.', type: 'attribute', visible: true, level: 1, xp: 0 },
    { id: 'cha', name: 'Carisma', icon: '👑', description: 'Presenza e comunicazione. Leadership, networking, public speaking e capacità di ispirare.', type: 'attribute', visible: true, level: 1, xp: 0 }
];

export const DEFAULT_ABILITIES = [
    { id: 'cre', name: 'Creatività', icon: '🎨', description: 'Immaginazione e creazione. Arte, musica, scrittura, design e innovazione.', type: 'ability', visible: false, level: 1, xp: 0 }
];

export const AVATAR_EMOJIS = ['⚔️', '🗡️', '🏹', '🛡️', '👑', '🧙', '🧝', '🧚', '🦸', '🦹', '🥷', '🧑‍🚀', '👤', '🐉', '🦅', '🐺', '🦁', '🐻', '🌟', '💎', '🔥', '❄️', '⚡', '🌙'];

export const ACCENT_COLORS = ['violet', 'blue', 'indigo', 'cyan', 'teal', 'emerald', 'gold', 'orange', 'rose', 'pink', 'red', 'green', 'yellow', 'lime', 'sky'];

export const XP_CONFIG = {
    baseXpPerLevel: 100,
    levelMultiplier: 1.5,
    starsMultiplier: { 1: 0.5, 2: 0.75, 3: 1, 4: 1.5, 5: 2 },
    secondaryRatio: 0.33
};

export const TITLES = [
    { level: 1, title: 'Novizio' }, { level: 5, title: 'Apprendista' }, { level: 10, title: 'Avventuriero' },
    { level: 15, title: 'Veterano' }, { level: 20, title: 'Esperto' }, { level: 25, title: 'Maestro' },
    { level: 30, title: 'Campione' }, { level: 40, title: 'Leggenda' }, { level: 50, title: 'Eroe' }
];

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

export const DB_NAME = 'QuestLifeDB';
export const DB_VERSION = 1;
export const DB_STORE = 'handles';

export const CHALLENGE_TEMPLATES = [
    // ================== PUSH-UP CHALLENGES (3 Levels) ==================
    {
        id: 'pushup_lv1',
        name: '💪 Flessioni Liv.1',
        description: 'Programma principianti: da 5 a 30 flessioni in 30 giorni. Costruisci le basi della forza.',
        duration: 30,
        icon: '💪',
        category: 'fitness',
        stars: 3,
        level: 1,
        primaryStatId: 'str',
        color: '#22c55e',
        unlockRequirement: null, // Always available
        generateSubquests: () => {
            // Based on research: Week 1 foundation (5-15), Week 2 (18-28), Week 3 (30-42), Week 4 (45-60)
            const daily = [
                5, 7, 9, 'R', 10, 12, 'R', // Week 1
                15, 17, 19, 'R', 21, 23, 'R', // Week 2
                25, 27, 28, 'R', 30, 32, 'R', // Week 3
                35, 38, 40, 'R', 45, 50, 'R', 55, 60 // Week 4
            ].filter(v => v !== 'R');
            return daily.map((reps, i) => ({
                id: `day_${i + 1}`,
                name: `Giorno ${i + 1}: ${reps} flessioni`,
                targetReps: reps,
                completed: false
            }));
        }
    },
    {
        id: 'pushup_lv2',
        name: '💪 Flessioni Liv.2',
        description: 'Programma intermedio: da 40 a 80 flessioni in 30 giorni. Aumenta volume e resistenza.',
        duration: 30,
        icon: '💪',
        category: 'fitness',
        stars: 4,
        level: 2,
        primaryStatId: 'str',
        color: '#f59e0b',
        unlockRequirement: 'pushup_lv1',
        generateSubquests: () => {
            const daily = [
                40, 42, 45, 'R', 48, 50, 'R', // Week 1
                52, 55, 57, 'R', 60, 62, 'R', // Week 2
                65, 67, 70, 'R', 72, 75, 'R', // Week 3
                78, 80, 82, 'R', 85, 90, 'R', 95, 100 // Week 4
            ].filter(v => v !== 'R');
            return daily.map((reps, i) => ({
                id: `day_${i + 1}`,
                name: `Giorno ${i + 1}: ${reps} flessioni`,
                targetReps: reps,
                completed: false
            }));
        }
    },
    {
        id: 'pushup_lv3',
        name: '💪 Flessioni Liv.3',
        description: 'Programma avanzato: da 80 a 150+ flessioni in 30 giorni. Raggiungi il massimo potenziale.',
        duration: 30,
        icon: '💪',
        category: 'fitness',
        stars: 5,
        level: 3,
        primaryStatId: 'str',
        color: '#ef4444',
        unlockRequirement: 'pushup_lv2',
        generateSubquests: () => {
            const daily = [
                80, 85, 90, 'R', 95, 100, 'R', // Week 1
                105, 110, 115, 'R', 120, 125, 'R', // Week 2
                130, 135, 140, 'R', 145, 150, 'R', // Week 3
                155, 160, 165, 'R', 170, 175, 'R', 180, 200 // Week 4
            ].filter(v => v !== 'R');
            return daily.map((reps, i) => ({
                id: `day_${i + 1}`,
                name: `Giorno ${i + 1}: ${reps} flessioni (+ varianti)`,
                targetReps: reps,
                completed: false
            }));
        }
    },

    // ================== NUTRITION CHALLENGES (3 Types) ==================
    {
        id: 'nutrition_maintain',
        name: '🥗 Nutrizione Mantenimento',
        description: '30 giorni di alimentazione equilibrata. Proteine 1g/kg, 8 bicchieri acqua, pasti regolari.',
        duration: 30,
        icon: '🥗',
        category: 'health',
        stars: 3,
        level: 1,
        primaryStatId: 'con',
        color: '#22c55e',
        trackingMode: 'checkbox', // can be 'checkbox' or 'detailed'
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Pasti equilibrati ✓`,
            goals: ['Proteine OK', '8 bicchieri acqua', 'No junk food', 'Pasti regolari'],
            completed: false
        }))
    },
    {
        id: 'nutrition_cut',
        name: '🔥 Nutrizione Dimagrimento',
        description: '30 giorni in deficit calorico (-500kcal). Proteine alte, 10k passi, niente alcol.',
        duration: 30,
        icon: '🔥',
        category: 'health',
        stars: 4,
        level: 1,
        primaryStatId: 'con',
        color: '#f59e0b',
        trackingMode: 'checkbox',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Deficit mantenuto`,
            goals: ['Deficit -500kcal', 'Proteine 1.2g/kg', '10k passi', 'No alcol'],
            completed: false
        }))
    },
    {
        id: 'nutrition_bulk',
        name: '🏋️ Nutrizione Massa',
        description: '30 giorni in surplus calorico (+300kcal). Proteine 1.5g/kg, allenamento forza, pasto post-workout.',
        duration: 30,
        icon: '🏋️',
        category: 'health',
        stars: 4,
        level: 1,
        primaryStatId: 'str',
        color: '#ef4444',
        trackingMode: 'checkbox',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Surplus + Forza`,
            goals: ['Surplus +300kcal', 'Proteine 1.5g/kg', 'Allenamento forza', 'Pasto post-workout'],
            completed: false
        }))
    },

    // ================== OTHER CHALLENGES ==================
    {
        id: 'no_smoke_30',
        name: '🚭 Detox Sigarette',
        description: '30 giorni senza fumare. Ogni giorno è una vittoria verso una vita più sana.',
        duration: 30,
        icon: '🚭',
        category: 'health',
        stars: 5,
        primaryStatId: 'con',
        color: '#10b981',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1} senza sigarette`,
            completed: false
        }))
    },
    {
        id: 'nofap_30',
        name: '🚫 NoFap Challenge',
        description: '30 giorni di astinenza. Riprendi il controllo della tua energia e focus.',
        duration: 30,
        icon: '🚫',
        category: 'discipline',
        stars: 5,
        primaryStatId: 'wis',
        color: '#8b5cf6',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1} completato`,
            completed: false
        }))
    },
    {
        id: 'no_junk_30',
        name: '🍎 No Junk Food',
        description: '30 giorni senza cibo spazzatura. Nutri il tuo corpo con cibo vero.',
        duration: 30,
        icon: '🍎',
        category: 'health',
        stars: 4,
        primaryStatId: 'con',
        color: '#22c55e',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1} senza junk food`,
            completed: false
        }))
    },
    {
        id: 'reading_30',
        name: '📚 Reading Challenge',
        description: 'Leggi almeno 20 pagine al giorno per 30 giorni. Espandi la tua mente.',
        duration: 30,
        icon: '📚',
        category: 'growth',
        stars: 3,
        primaryStatId: 'int',
        color: '#3b82f6',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: 20+ pagine lette`,
            completed: false
        }))
    },
    {
        id: 'meditation_21',
        name: '🧘 21 Days Meditation',
        description: '21 giorni di meditazione quotidiana. Costruisci una mente calma e presente.',
        duration: 21,
        icon: '🧘',
        category: 'mindfulness',
        stars: 3,
        primaryStatId: 'wis',
        color: '#06b6d4',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 21 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Sessione meditazione`,
            completed: false
        }))
    },
    {
        id: 'cold_shower_30',
        name: '🧊 Cold Shower Challenge',
        description: '30 giorni di docce fredde. Costruisci disciplina mentale e resilienza.',
        duration: 30,
        icon: '🧊',
        category: 'discipline',
        stars: 4,
        primaryStatId: 'str',
        color: '#0ea5e9',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 30 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Doccia fredda ✓`,
            completed: false
        }))
    },
    {
        id: 'digital_detox_7',
        name: '📱 Digital Detox',
        description: '7 giorni con uso limitato dello smartphone. Riconquista il tuo tempo.',
        duration: 7,
        icon: '📱',
        category: 'mindfulness',
        stars: 4,
        primaryStatId: 'wis',
        color: '#f59e0b',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 7 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Max 1h schermo`,
            completed: false
        }))
    }
];

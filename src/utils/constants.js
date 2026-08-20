export const BUILD_TIME = '2026-08-20T00:55:47.029Z';
export const APP_VERSION = '5.9.136';

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
    {
        id: 'pushup_lv1',
        name: 'Flessioni Liv.1',
        description: 'Programma principianti: 30 giorni a serie progressive per arrivare a 30+ flessioni. Recupero tra serie: 60s.',
        duration: 30,
        icon: '💪',
        category: 'fitness',
        stars: 3,
        level: 1,
        primaryStatId: 'str',
        color: '#22c55e',
        unlockRequirement: null,
        generateSubquests: () => {
            const daily = [
                '4-3-2-2', '4-3-3-2', '5-4-3-2', 'Recupero',
                '5-4-3-3', '6-4-4-3', '6-5-4-3', 'Recupero',
                '7-5-4-4', '7-6-5-4', '8-6-5-4', 'Recupero',
                '8-7-6-5', '9-7-6-5', '9-8-6-5', 'Recupero',
                '10-8-6-5', '10-8-7-6', '11-9-7-6', 'Recupero',
                '12-9-8-6', '12-10-8-7', '13-10-8-7', 'Recupero',
                '14-11-9-8', '14-12-10-8', '15-12-10-9', 'Recupero',
                '16-13-11-10', 'TEST: 30 Max'
            ];
            return daily.map((target, i) => {
                let totalReps = 0;
                let displayTarget = null;
                if (target !== 'Recupero' && !target.startsWith('TEST')) {
                    displayTarget = target;
                    const parts = target.split('-').map(Number);
                    if (!parts.some(isNaN)) {
                        totalReps = parts.reduce((a, b) => a + b, 0);
                    }
                }
                const isRest = target === 'Recupero';
                const nameText = isRest 
                    ? 'Riposo Attivo 🧘' 
                    : (target.startsWith('TEST') ? target : `${target} (${totalReps} flessioni)`);
                return {
                    id: `day_${i + 1}`,
                    name: `Giorno ${i + 1}: ${nameText}`,
                    targetReps: totalReps,
                    displayTarget: displayTarget,
                    completed: false
                };
            });
        }
    },
    {
        id: 'pushup_lv2',
        name: 'Flessioni Liv.2',
        description: 'Programma intermedio: 30 giorni per arrivare a 60+ flessioni. Recupero tra serie: 45-60s.',
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
                '10-10-8-6', '12-10-8-6', '12-10-10-8', 'Recupero',
                '14-12-10-8', '14-12-12-8', '15-13-12-10', 'Recupero',
                '16-14-12-10', '16-14-14-10', '18-16-14-12', 'Recupero',
                '18-16-15-12', '20-18-15-12', '20-18-16-14', 'Recupero',
                '22-20-15-14', '22-20-18-14', '24-22-18-14', 'Recupero',
                '25-22-20-15', '26-24-20-16', '28-24-20-18', 'Recupero',
                '30-26-22-18', '32-28-24-20', '35-30-25-20', 'Recupero',
                '40-30-25-20', 'TEST: 60 Max'
            ];
            return daily.map((target, i) => {
                let totalReps = 0;
                let displayTarget = null;
                if (target !== 'Recupero' && !target.startsWith('TEST')) {
                    displayTarget = target;
                    const parts = target.split('-').map(Number);
                    if (!parts.some(isNaN)) totalReps = parts.reduce((a, b) => a + b, 0);
                }
                const isRest = target === 'Recupero';
                const nameText = isRest 
                    ? 'Riposo Attivo 🧘' 
                    : (target.startsWith('TEST') ? target : `${target} (${totalReps} flessioni)`);
                return {
                    id: `day_${i + 1}`,
                    name: `Giorno ${i + 1}: ${nameText}`,
                    targetReps: totalReps,
                    displayTarget: displayTarget,
                    completed: false
                };
            });
        }
    },
    {
        id: 'pushup_lv3',
        name: 'Flessioni Liv.3',
        description: 'Programma avanzato: 30 giorni per superare i 100. Recupero minimo tra serie.',
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
                '20-15-15-10', '20-20-15-10', '25-20-15-15', 'Recupero',
                '30-25-20-15', '30-25-20-20', '35-30-20-15', 'Recupero',
                '35-30-25-20', '40-30-25-20', '40-35-25-20', 'Recupero',
                '45-35-30-20', '45-40-30-25', '50-40-30-25', 'Recupero',
                '50-45-35-30', '50-45-40-35', '55-45-40-35', 'Recupero',
                '55-50-40-35', '60-50-40-40', '60-50-45-45', 'Recupero',
                '65-55-45-40', '70-55-45-40', '70-60-50-45', 'Recupero',
                '80-60-50-50', 'TEST: 100 Challenge'
            ];
            return daily.map((target, i) => {
                let totalReps = 0;
                let displayTarget = null;
                if (target !== 'Recupero' && !target.startsWith('TEST')) {
                    displayTarget = target;
                    const parts = target.split('-').map(Number);
                    if (!parts.some(isNaN)) totalReps = parts.reduce((a, b) => a + b, 0);
                }
                const isRest = target === 'Recupero';
                const nameText = isRest 
                    ? 'Riposo Attivo 🧘' 
                    : (target.startsWith('TEST') ? target : `${target} (${totalReps} flessioni)`);
                return {
                    id: `day_${i + 1}`,
                    name: `Giorno ${i + 1}: ${nameText}`,
                    targetReps: totalReps,
                    displayTarget: displayTarget,
                    completed: false
                };
            });
        }
    },
    {
        id: 'situp_lv1',
        name: 'Sit-Ups Liv.1',
        description: 'Core base: 30 giorni a serie progressive per addominali d\'acciaio.',
        duration: 30,
        icon: '🍫',
        category: 'fitness',
        stars: 3,
        level: 1,
        primaryStatId: 'str',
        color: '#22c55e',
        unlockRequirement: null,
        generateSubquests: () => {
            const daily = [
                '8-6-6-4', '10-8-6-4', '10-8-8-6', 'Recupero',
                '12-10-8-6', '12-10-10-8', '14-12-10-8', 'Recupero',
                '15-12-10-10', '16-14-12-10', '18-14-12-10', 'Recupero',
                '18-16-14-12', '20-16-14-12', '20-18-16-12', 'Recupero',
                '22-18-16-14', '24-20-16-14', '25-20-18-15', 'Recupero',
                '26-22-18-15', '28-22-20-16', '30-24-20-16', 'Recupero',
                '32-25-22-18', '35-28-24-18', '38-30-25-20', 'Recupero',
                '40-30-25-20', 'TEST: Max Sit-Ups'
            ];
            return daily.map((target, i) => {
                let totalReps = 0;
                let displayTarget = null;
                if (target !== 'Recupero' && !target.startsWith('TEST')) {
                    displayTarget = target;
                    const parts = target.split('-').map(Number);
                    if (!parts.some(isNaN)) totalReps = parts.reduce((a, b) => a + b, 0);
                }
                const isRest = target === 'Recupero';
                const nameText = isRest 
                    ? 'Riposo Attivo 🧘' 
                    : (target.startsWith('TEST') ? target : `${target} (${totalReps} sit-ups)`);
                return {
                    id: `day_${i + 1}`,
                    name: `Giorno ${i + 1}: ${nameText}`,
                    targetReps: totalReps,
                    displayTarget: displayTarget,
                    completed: false
                };
            });
        }
    },
    {
        id: 'situp_lv2',
        name: 'Sit-Ups Liv.2',
        description: 'Core avanzato: 30 giorni di fuoco a serie progressive per veri atleti.',
        duration: 30,
        icon: '🍫',
        category: 'fitness',
        stars: 4,
        level: 2,
        primaryStatId: 'str',
        color: '#f59e0b',
        unlockRequirement: 'situp_lv1',
        generateSubquests: () => {
            const daily = [
                '20-15-15-10', '25-20-15-10', '25-20-20-15', 'Recupero',
                '30-25-20-15', '35-25-20-15', '35-30-25-20', 'Recupero',
                '40-30-30-20', '45-35-30-20', '50-40-30-25', 'Recupero',
                '50-45-35-25', '55-45-40-30', '60-50-40-30', 'Recupero',
                '65-50-45-35', '70-55-50-35', '75-60-50-40', 'Recupero',
                '80-60-50-40', '85-65-55-45', '90-70-60-45', 'Recupero',
                '95-75-65-50', '100-80-70-50', '110-90-80-60', 'Recupero',
                '120-100-80-60', 'TEST: 200 Sit-Ups'
            ];
            return daily.map((target, i) => {
                let totalReps = 0;
                let displayTarget = null;
                if (target !== 'Recupero' && !target.startsWith('TEST')) {
                    displayTarget = target;
                    const parts = target.split('-').map(Number);
                    if (!parts.some(isNaN)) totalReps = parts.reduce((a, b) => a + b, 0);
                }
                const isRest = target === 'Recupero';
                const nameText = isRest 
                    ? 'Riposo Attivo 🧘' 
                    : (target.startsWith('TEST') ? target : `${target} (${totalReps} sit-ups)`);
                return {
                    id: `day_${i + 1}`,
                    name: `Giorno ${i + 1}: ${nameText}`,
                    targetReps: totalReps,
                    displayTarget: displayTarget,
                    completed: false
                };
            });
        }
    },
    {
        id: 'plank_30',
        name: 'Plank Challenge',
        description: '30 Giorni di acciaio. Da 20s a 5 minuti di plank.',
        duration: 30,
        icon: '🪵',
        category: 'fitness',
        stars: 4,
        level: 1,
        primaryStatId: 'con',
        color: '#0ea5e9',
        unlockRequirement: null,
        generateSubquests: () => {
            const daily = [
                '20s', '20s', 'Recupero', '30s',
                '30s', 'Recupero', '40s', '45s',
                'Recupero', '50s', '55s', 'Recupero',
                '60s', '60s', 'Recupero', '90s',
                '90s', 'Recupero', '120s', '120s',
                'Recupero', '150s', '180s', 'Recupero',
                '210s', '240s', 'Recupero', '270s',
                '300s', 'TEST: Max Plank'
            ];
            return daily.map((target, i) => {
                const isRest = target === 'Recupero';
                return {
                    id: `day_${i + 1}`,
                    name: `Giorno ${i + 1}: ${isRest ? 'Riposo Attivo 🧘' : target + ' Plank'}`,
                    displayTarget: isRest ? null : target + ' Plank',
                    completed: false
                };
            });
        }
    },
    {
        id: 'nutrition_maintain',
        name: 'Nutrizione Mantenimento',
        description: '30 giorni di alimentazione equilibrata. Proteine 1g/kg, 8 bicchieri acqua, pasti regolari.',
        duration: 30,
        icon: '🥗',
        category: 'health',
        stars: 3,
        level: 1,
        primaryStatId: 'con',
        color: '#22c55e',
        trackingMode: 'checkbox',
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
        name: 'Nutrizione Dimagrimento',
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
        name: 'Nutrizione Massa',
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
    {
        id: 'no_smoke_7',
        name: 'Detox Sigarette (7gg)',
        description: '7 giorni senza fumare. Una settimana per riprendere il controllo.',
        duration: 7,
        icon: '🚭',
        category: 'health',
        stars: 2,
        primaryStatId: 'con',
        color: '#10b981',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 7 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1} senza sigarette`,
            completed: false
        }))
    },
    {
        id: 'nofap_7',
        name: 'NoFap Week',
        description: '7 giorni di astinenza. Riprendi il controllo della tua energia.',
        duration: 7,
        icon: '🚫',
        category: 'discipline',
        stars: 2,
        primaryStatId: 'wis',
        color: '#8b5cf6',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 7 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1} completato`,
            completed: false
        }))
    },
    {
        id: 'no_junk_7',
        name: 'No Junk Food (7gg)',
        description: '7 giorni senza cibo spazzatura. Disintossicati dagli zuccheri.',
        duration: 7,
        icon: '🍎',
        category: 'health',
        stars: 2,
        primaryStatId: 'con',
        color: '#22c55e',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 7 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1} senza junk food`,
            completed: false
        }))
    },
    {
        id: 'reading_7',
        name: 'Campagna Lettura (7gg)',
        description: 'Leggere ogni giorno per una settimana. Bastano 20 pagine.',
        duration: 7,
        icon: '📚',
        category: 'growth',
        stars: 2,
        primaryStatId: 'int',
        color: '#3b82f6',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 7 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: 20+ pagine lette`,
            completed: false
        }))
    },
    {
        id: 'meditation_7',
        name: 'Campagna Meditazione (7gg)',
        description: '7 giorni di mindfulness. Ritrova la calma interiore.',
        duration: 7,
        icon: '🧘',
        category: 'mindfulness',
        stars: 2,
        primaryStatId: 'wis',
        color: '#06b6d4',
        unlockRequirement: null,
        generateSubquests: () => Array.from({ length: 7 }, (_, i) => ({
            id: `day_${i + 1}`,
            name: `Giorno ${i + 1}: Sessione meditazione`,
            completed: false
        }))
    },
    {
        id: 'cold_shower_30',
        name: 'Campagna Docce Fredde',
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
        name: 'Campagna Digital Detox',
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

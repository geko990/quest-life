/* ============================================
   QUEST LIFE - RPG Habit Tracker v2
   Utils Module
   ============================================ */
import { state } from './state.js';
import { XP_CONFIG, DAY_NAMES } from './constants.js';

export function getGameDateObj() {
    const now = new Date();
    const startHour = state && state.settings ? (parseInt(state.settings.dayStartTime) || 0) : 0;
    return new Date(now.getTime() - startHour * 60 * 60 * 1000);
}

export function formatISO(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getGameDate() {
    return formatISO(getGameDateObj());
}

export function getGameDateString() {
    return getGameDateObj().toDateString();
}

// Helpers for periodic habits
export function getWeekIdentifier(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    // Get week start preference (default: Sunday = 0)
    const weekStartMonday = state?.settings?.weekStart === 'monday';

    // Adjust day number based on week start
    let dayNum = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    if (weekStartMonday) {
        // For Monday start: shift so Monday=1, Sunday=7
        dayNum = dayNum === 0 ? 7 : dayNum;
    } else {
        // For Sunday start: shift so Sunday=1, Saturday=7
        dayNum = dayNum + 1;
    }

    // Calculate week number (ISO-like but respecting week start)
    const startOfYear = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const dayOfYear = Math.floor((d - startOfYear) / 86400000) + 1;
    const weekNo = Math.ceil((dayOfYear + (weekStartMonday ? 0 : 1)) / 7);

    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

export function getMonthIdentifier(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

export function getYearIdentifier(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return `${date.getFullYear()}`;
}

export function calculateXp(stars) {
    const baseXp = 20;
    return Math.round(baseXp * XP_CONFIG.starsMultiplier[stars]);
}

export function getXpForLevel(level) {
    const rawXp = XP_CONFIG.baseXpPerLevel * Math.pow(XP_CONFIG.levelMultiplier, level - 1);
    return Math.round(rawXp / 50) * 50; // Round to nearest 50
}

export function getCumulativeXpForLevel(targetLevel) {
    let total = 0;
    for (let i = 1; i < targetLevel; i++) {
        total += getXpForLevel(i + 1);
    }
    return total;
}

export function calculateLevelFromXp(totalXp) {
    let level = 1;
    while (totalXp >= getCumulativeXpForLevel(level + 1)) {
        level++;
    }
    return level;
}

export function generateId(prefix = '') {
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

export function ensureUniqueIds(list, prefix) {
    if (!list) return;
    const seen = new Set();
    list.forEach(item => {
        if (seen.has(item.id)) {
            // Generate new ID
            const newId = generateId(prefix);
            console.warn(`Duplicate ID found: ${item.id} -> replaced with ${newId}`);
            item.id = newId;
        }
        seen.add(item.id);
    });
}

export function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}

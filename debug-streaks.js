const fs = require('fs');
const path = require('path');

// Path to backup
const backupPath = './file da analizzare/quest-life-backup 3feb2026.json';

try {
    const raw = fs.readFileSync(backupPath, 'utf8');
    const data = JSON.parse(raw);

    console.log("Loaded backup for:", data.player.name);

    // Mock State
    const state = {
        habits: data.habits,
        completionLog: data.completionLog
    };

    // Mock Date Utils
    function formatISO(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function isDone(habitId, dateStr) {
        const log = state.completionLog[dateStr];
        if (!log) return false;
        if (Array.isArray(log)) return log.includes(habitId);
        if (typeof log === 'object') return log.habits && log.habits.includes(habitId);
        return false;
    }

    console.log("\n--- Analyzing Streaks ---");
    const today = new Date(); // Using today relative to system, but we might need to pretend it's Feb 4th 2026?
    // User said "backup of yesterday" (Feb 3). So today is Feb 4.
    // Let's set reference date to Feb 4, 2026 if necessary, or just use today if the system time is synced.
    // The backup filename says '3feb2026'.
    // Let's check the last entry in the log to guess 'today'.

    const logDates = Object.keys(state.completionLog).sort();
    const lastLogDate = logDates[logDates.length - 1];
    console.log("Last Log Entry:", lastLogDate);

    // Use Feb 4, 2026 as 'Today' for simulation
    const simToday = new Date("2026-02-04T12:00:00");
    const todayStr = formatISO(simToday);
    console.log(`Simulating Date: ${todayStr}`);

    state.habits.forEach(h => {
        if (h.frequency && h.frequency !== 'daily') return;

        let streak = 0;
        let checkDate = new Date(simToday);

        // Logic mirroring app.js
        if (!isDone(h.id, formatISO(checkDate))) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        let trace = [];

        for (let i = 0; i < 50; i++) {
            const dateStr = formatISO(checkDate);
            if (isDone(h.id, dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
                trace.push(dateStr);
            } else {
                trace.push(`STOP at ${dateStr}`);
                break;
            }
        }

        console.log(`Habit: ${h.name.padEnd(20)} | Saved Streak: ${h.streak.toString().padEnd(3)} | Calc Streak: ${streak}`);
        if (h.streak !== streak) {
            console.log(`   Mismatch! Trace: ${trace.slice(0, 5).join(', ')}...`);
        }
    });

} catch (e) {
    console.error("Error:", e.message);
}

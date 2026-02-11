
// Script temporaneo per verificare se l'applicazione forzata del tema risolve il glitch
(function () {
    try {
        console.log("Applying theme fix...");
        // Tentativo di leggere lo stato salvato grezzo
        const rawState = localStorage.getItem('questlife_state');
        if (rawState) {
            const state = JSON.parse(rawState);
            if (state.settings) {
                if (state.settings.theme) document.body.dataset.theme = state.settings.theme;
                if (state.settings.mode) document.body.dataset.mode = state.settings.mode;
                if (state.settings.accent) document.body.dataset.accent = state.settings.accent;
                console.log("Theme forced from raw state:", state.settings.theme, state.settings.mode);
            }
        }
    } catch (e) {
        console.error("Theme fix failed:", e);
    }
})();


// Script temporaneo per verificare se l'applicazione forzata del tema risolve il glitch
// Script temporaneo per verificare se l'applicazione forzata del tema risolve il glitch
(function () {
    function applyTheme() {
        try {
            console.log("Applying theme fix...");
            const rawState = localStorage.getItem('questlife_state_v2') || localStorage.getItem('questlife_state');

            let theme = 'standard';
            let mode = 'light';
            let accent = 'violet';

            if (rawState) {
                const state = JSON.parse(rawState);
                if (state.settings) {
                    if (state.settings.theme) theme = state.settings.theme;
                    if (state.settings.mode) mode = state.settings.mode;
                    if (state.settings.accent) accent = state.settings.accent;
                }
            }

            if (document.body) {
                document.body.dataset.theme = theme;
                document.body.dataset.mode = mode;
                document.body.dataset.accent = accent;
                console.log("Theme applied:", theme, mode);
            } else {
                // If body is not ready, wait for it
                document.addEventListener('DOMContentLoaded', applyTheme);
            }
        } catch (e) {
            console.error("Theme fix failed:", e);
        }
    }

    // Attempt immediately if body exists, otherwise wait
    if (document.body) {
        applyTheme();
    } else {
        // Use MutationObserver to detect body injection if needed, or just DOMContentLoaded
        document.addEventListener('DOMContentLoaded', applyTheme);
    }
})();

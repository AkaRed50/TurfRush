// Handles entry portal language switching and room routing

class PortalController {
    // Initializes portal bindings and form submission
    static async init() {
        const portalLangSelect = document.getElementById("portalLang");
        const savedLang = localStorage.getItem("turfrush_lang") || "en";

        if (window.I18n) {
            await window.I18n.init(savedLang);
        }

        if (portalLangSelect) {
            portalLangSelect.value = savedLang;
            portalLangSelect.addEventListener("change", async (e) => {
                const newLang = e.target.value;
                localStorage.setItem("turfrush_lang", newLang);
                if (window.I18n) await window.I18n.setLanguage(newLang);
                if (window.UiI18nBinder) window.UiI18nBinder.applyPortalTexts();
            });
        }

        if (window.UiI18nBinder) window.UiI18nBinder.applyPortalTexts();

        const urlParams = new URLSearchParams(window.location.search);
        const autoRoom = urlParams.get("room");
        if (autoRoom) {
            window.location.href = `client.html?room=${encodeURIComponent(autoRoom)}`;
            return;
        }

        const btnHost = document.getElementById("btnHost");
        if (btnHost) {
            btnHost.addEventListener("click", () => {
                window.location.href = "host.html";
            });
        }

        const joinForm = document.getElementById("joinForm");
        if (joinForm) {
            joinForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const room = document.getElementById("roomInput").value.trim().toUpperCase();
                const name = document.getElementById("nameInput").value.trim();
                if (room && name) {
                    window.location.href = `client.html?room=${encodeURIComponent(room)}&name=${encodeURIComponent(name)}`;
                }
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    PortalController.init();
});
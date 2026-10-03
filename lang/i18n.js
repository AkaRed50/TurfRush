// Translation dictionary loader and text interpolation manager

class I18nManager {
    constructor(basePath = "lang") {
        this.basePath = basePath;
        this.currentLang = "en";
        this.translations = {};
        this.fallbackTranslations = {};
    }

    // Loads fallback and language
    async init(lang = "en") {
        this.fallbackTranslations = await this.fetchDictionary("en");
        await this.setLanguage(lang);
    }

    // Fetches translation JSON file
    async fetchDictionary(lang) {
        const cacheBuster = `?v=${Date.now()}`;
        const cleanBase = this.basePath.replace(/^\/+|\/+$/g, "");
        const pathsToTry = [
            `${cleanBase}/${lang}.json${cacheBuster}`,
            `./${cleanBase}/${lang}.json${cacheBuster}`,
            `../${cleanBase}/${lang}.json${cacheBuster}`,
            `/TurfRush/${cleanBase}/${lang}.json${cacheBuster}`
        ];

        for (const url of pathsToTry) {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    return await res.json();
                }
            } catch (e) {}
        }

        console.error(`I18n: Failed to load ${lang}.json from all paths.`);
        return {};
    }

    // Updates the active language
    async setLanguage(lang) {
        if (lang === "en" && Object.keys(this.fallbackTranslations).length > 0) {
            this.currentLang = "en";
            this.translations = this.fallbackTranslations;
            return;
        }

        const dict = await this.fetchDictionary(lang);
        if (Object.keys(dict).length > 0) {
            this.currentLang = lang;
            this.translations = dict;
        } else {
            this.currentLang = "en";
            this.translations = this.fallbackTranslations;
        }
    }

    // Resolves key path translation
    t(keyPath, params = {}) {
        if (!keyPath || typeof keyPath !== "string") return "";

        const resolve = (obj, path) => {
            if (!obj) return null;
            const parts = path.split(".");
            let curr = obj;
            for (const part of parts) {
                if (curr && typeof curr === "object") {
                    if (curr[part] !== undefined) {
                        curr = curr[part];
                    } else {
                        // Case-insensitive lookup fallback
                        const lowerKey = Object.keys(curr).find(k => k.toLowerCase() === part.toLowerCase());
                        if (lowerKey && curr[lowerKey] !== undefined) {
                            curr = curr[lowerKey];
                        } else {
                            return null;
                        }
                    }
                } else {
                    return null;
                }
            }
            return curr;
        };

        let value = resolve(this.translations, keyPath);
        if (value === null || value === undefined) {
            value = resolve(this.fallbackTranslations, keyPath);
        }

        if (value === null || value === undefined) {
            // Provide sensible fallback instead of raw key
            const lastPart = keyPath.split(".").pop();
            return this.interpolate(lastPart, params);
        }

        if (Array.isArray(value)) {
            const item = value[Math.floor(Math.random() * value.length)];
            return this.interpolate(item, params);
        }

        if (typeof value === "string") {
            return this.interpolate(value, params);
        }

        return String(value);
    }

    // Replaces placeholders in text
    interpolate(template, params) {
        if (typeof template !== "string") return String(template);
        return Object.keys(params).reduce((str, paramKey) => {
            const val = params[paramKey];
            return str
                .replaceAll(`#{${paramKey}}`, val)
                .replaceAll(`{${paramKey}}`, val);
        }, template);
    }
}

window.I18n = new I18nManager();
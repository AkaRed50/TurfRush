// Generates race announcements and live commentary

class HostNarrator {
    constructor(logContainerId = "announcementsLog") {
        this.logBox = document.getElementById(logContainerId);
    }

    // Appends a new message
    addLog(text) {
        if (!this.logBox || !text) return;
        
        // Ignore bets and connections
        const lower = text.toLowerCase();
        if (
            lower.includes("connected") || 
            lower.includes("conectad") || 
            lower.includes("bets $") || 
            lower.includes("apuesta $") ||
            lower.includes("prop:") ||
            lower.includes("exotic:") ||
            lower.includes("side:")
        ) {
            return;
        }

        const entry = document.createElement("span");
        entry.className = "announcement-entry";
        entry.innerText = text;
        
        this.logBox.prepend(entry);
        this.logBox.scrollLeft = 0;
    }

    // Clears the commentary log
    clear() {
        if (this.logBox) this.logBox.innerHTML = "";
    }

    // Gets runner display label
    getRunnerDisplayName(horse) {
        if (window.UmaManager && window.UmaManager.isThemeActive) {
            return window.UmaManager.getUmaName(horse.id);
        }
        return `#${horse.label}`;
    }

    // Generates contextual race commentary
    generateSituationalNarrative(horse, stepsMoved, bonusApplied, previousPositions, horses) {
        const horseName = this.getRunnerDisplayName(horse);
        if (!window.I18n) return `${horseName} moves ${stepsMoved}`;
        const t = (k, p) => window.I18n.t(k, p);

        const oldPos = previousPositions[horse.id] ?? 0;
        const newPos = horse.position;

        if (bonusApplied) {
            return t("narrative.streak", { label: horseName, steps: stepsMoved });
        }

        const prevPositionsList = horses.map(h => ({
            id: h.id,
            label: this.getRunnerDisplayName(h),
            pos: previousPositions[h.id] ?? 0
        }));
        const prevSorted = [...prevPositionsList].sort((a, b) => b.pos - a.pos);
        const currSorted = [...horses].map(h => ({
            id: h.id,
            label: this.getRunnerDisplayName(h),
            pos: h.position
        })).sort((a, b) => b.pos - a.pos);

        const oldLeader = prevSorted[0];
        const newLeader = currSorted[0];

        if (newLeader.id === horse.id && oldLeader.id !== horse.id) {
            return t("narrative.takeLead", { label: horseName, prevLeader: oldLeader.label });
        }

        const overtaken = prevPositionsList.filter(other =>
            other.id !== horse.id && oldPos <= other.pos && newPos > other.pos
        );
        if (overtaken.length > 0) {
            overtaken.sort((a, b) => b.pos - a.pos);
            return t("narrative.overtake", { label: horseName, overtaken: overtaken[0].label });
        }

        const tied = currSorted.find(other =>
            other.id !== horse.id && other.pos === newPos && oldPos < newPos && newPos >= 3
        );
        if (tied) {
            return t("narrative.neckAndNeck", { label: horseName, rival: tied.label, pos: newPos });
        }

        if (newLeader.id === horse.id && currSorted.length > 1) {
            const chaser = currSorted[1];
            const gap = newLeader.pos - chaser.pos;
            if (gap >= 2) {
                return t("narrative.pullAway", { label: horseName, gap, chaser: chaser.label });
            }
        }

        const wasLast = prevSorted[prevSorted.length - 1].id === horse.id;
        if (wasLast && oldPos === 0) {
            return t("narrative.lastComeback", { label: horseName });
        }

        return t("narrative.standard", { label: horseName, steps: stepsMoved });
    }
}

window.HostNarrator = HostNarrator;
// Manages Uma Musume DLC characters, lanes, and voice lines

class UmaManager {
    constructor() {
        this.rosterData = null;
        this.isThemeActive = false;

        this.laneKeys = [
            "lane_2_3", "lane_4", "lane_5", "lane_6",
            "lane_7", "lane_8", "lane_9", "lane_10", "lane_11_12"
        ];

        this.laneLabels = [
            "2/3", "4", "5", "6", "7", "8", "9", "10", "11/12"
        ];

        this.laneColors = [
            "blue", "blue", "orange", "red", "black", "red", "orange", "blue", "blue"
        ];

        this.currentLineup = new Array(9).fill(null);
    }

    // Initializes manager and lanes
    async init() {
        await this.loadRosterData();
        this.randomizeAllLanes();
    }

    // Fetches character roster json
    async loadRosterData() {
        try {
            const cacheBuster = `?v=${Date.now()}`;
            const res = await fetch(`assets/data/uma_roster.json${cacheBuster}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            this.rosterData = await res.json();
        } catch (e) {
            console.error("UmaManager: Error cargando uma_roster.json", e);
            this.rosterData = { lanes: {} };
        }
    }

    // Returns available character pool
    getAvailableUmasForLane(laneIndex) {
        if (!this.rosterData || !this.rosterData.lanes) return [];
        const key = this.laneKeys[laneIndex];
        return this.rosterData.lanes[key] || [];
    }

    // Assigns character to lane
    assignUmaToLane(laneIndex, umaId) {
        if (laneIndex < 0 || laneIndex >= 9) return null;
        const pool = this.getAvailableUmasForLane(laneIndex);
        const selectedUma = pool.find(u => u.id === umaId);
        if (!selectedUma) return null;

        this.currentLineup[laneIndex] = {
            laneIndex,
            laneKey: this.laneKeys[laneIndex],
            laneLabel: this.laneLabels[laneIndex],
            laneColor: this.laneColors[laneIndex],
            id: selectedUma.id,
            name: selectedUma.name,
            icon: selectedUma.icon
        };
        return this.currentLineup[laneIndex];
    }

    // Re-rolls random lane character
    rerollLane(laneIndex) {
        if (laneIndex < 0 || laneIndex >= 9) return null;
        const pool = this.getAvailableUmasForLane(laneIndex);
        if (pool.length === 0) return null;

        const currentAssigned = this.currentLineup[laneIndex];
        let availableOptions = pool;
        if (currentAssigned && pool.length > 1) {
            availableOptions = pool.filter(u => u.id !== currentAssigned.id);
        }

        const randomIndex = Math.floor(Math.random() * availableOptions.length);
        const chosen = availableOptions[randomIndex];

        this.currentLineup[laneIndex] = {
            laneIndex,
            laneKey: this.laneKeys[laneIndex],
            laneLabel: this.laneLabels[laneIndex],
            laneColor: this.laneColors[laneIndex],
            id: chosen.id,
            name: chosen.name,
            icon: chosen.icon
        };
        return this.currentLineup[laneIndex];
    }

    // Randomizes all active lanes
    randomizeAllLanes() {
        for (let i = 0; i < 9; i++) {
            this.rerollLane(i);
        }
        return this.getLineup();
    }

    // Returns current lane lineup
    getLineup() {
        return [...this.currentLineup];
    }

    // Gets lane assignment data
    getUmaForLane(laneIndex) {
        return this.currentLineup[laneIndex] || null;
    }

    // Gets runner display name
    getUmaName(laneIndex) {
        const entry = this.currentLineup[laneIndex];
        return entry ? entry.name : `#${this.laneLabels[laneIndex]}`;
    }

    // Gets runner icon url
    getUmaIcon(laneIndex) {
        const entry = this.currentLineup[laneIndex];
        return entry ? entry.icon : null;
    }

    // Toggles Uma Musume theme
    setThemeActive(active) {
        this.isThemeActive = Boolean(active);
        if (document.body) {
            document.body.classList.toggle("theme-uma", this.isThemeActive);
            document.body.classList.toggle("theme-western", !this.isThemeActive);
        }
    }
}

window.UmaManager = new UmaManager();
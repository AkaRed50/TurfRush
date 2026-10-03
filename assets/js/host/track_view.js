// Controls racetrack layout, runner movement, and dice display

class HostTrackView {
    constructor() {
        this.trackContainer = document.getElementById("trackContainer");
        this.die1Elem = document.getElementById("die1");
        this.die2Elem = document.getElementById("die2");
        this.diceSumElem = document.getElementById("diceSum");
        this.streakBadge = document.getElementById("streakBadge");
        this.bettingBadge = document.getElementById("bettingStatusBadge");
    }

    // Builds the track UI
    buildTrackUI(horses, trackLength, redLinePosition) {
        if (!this.trackContainer) return;
        this.trackContainer.innerHTML = "";

        const totalColumns = trackLength + 1;
        const isUmaTheme = Boolean(window.UmaManager && window.UmaManager.isThemeActive);

        horses.forEach(horse => {
            const lane = document.createElement("div");
            lane.className = "track-lane";
            lane.id = `lane-${horse.id}`;

            const badge = document.createElement("div");
            badge.className = `lane-badge ${horse.color}`;

            let umaInfo = null;
            if (isUmaTheme && window.UmaManager) {
                umaInfo = window.UmaManager.getUmaForLane(horse.id);
            }

            if (umaInfo) {
                badge.innerHTML = `
                    <span style="font-size:0.8rem; font-weight:900;">#${horse.label}</span>
                    <span style="font-size:0.65rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:64px;" title="${umaInfo.name}">${umaInfo.name}</span>
                    <span style="font-size:0.6rem; color:#ffd54f;">+${horse.bonus}</span>
                `;
            } else {
                badge.innerHTML = `<span>#${horse.label}</span><span style="font-size:0.65rem;">+${horse.bonus}</span>`;
            }

            const grid = document.createElement("div");
            grid.className = "lane-grid";
            grid.style.gridTemplateColumns = `repeat(${totalColumns}, 1fr)`;

            for (let i = 0; i <= trackLength; i++) {
                const cell = document.createElement("div");
                cell.className = "cell";
                if (i === redLinePosition) cell.classList.add("red-line");
                if (i === trackLength) cell.classList.add("finish-line");
                grid.appendChild(cell);
            }

            const initialPercentage = (0.5 / totalColumns) * 100;
            const runner = document.createElement("div");
            runner.className = "runner";
            runner.id = `runner-${horse.id}`;
            runner.style.left = `${initialPercentage}%`;

            if (umaInfo && umaInfo.icon) {
                runner.style.backgroundImage = `url("${umaInfo.icon}")`;
                runner.innerText = "";
            } else {
                runner.style.backgroundImage = "none";
                runner.innerText = horse.label;
            }

            grid.appendChild(runner);
            lane.appendChild(badge);
            lane.appendChild(grid);
            this.trackContainer.appendChild(lane);
        });
    }

    // Updates runner position
    updateRunnerPosition(horseId, position, trackLength, isBonus) {
        const runner = document.getElementById(`runner-${horseId}`);
        if (!runner) return;

        const totalColumns = trackLength + 1;
        const clampedPos = Math.max(0, Math.min(position, trackLength));
        const percentage = ((clampedPos + 0.5) / totalColumns) * 100;

        runner.style.left = `${percentage}%`;

        if (isBonus) {
            runner.classList.add("bonus-streak");
            setTimeout(() => runner.classList.remove("bonus-streak"), 500);
        }
    }

    // Animates dice roll
    animateDice(finalD1, finalD2, onComplete) {
        if (window.SFX) window.SFX.playDiceRoll();
        if (this.die1Elem) this.die1Elem.classList.add("rolling");
        if (this.die2Elem) this.die2Elem.classList.add("rolling");
        if (this.diceSumElem) this.diceSumElem.innerText = "?";

        const rollInterval = setInterval(() => {
            if (this.die1Elem) this.die1Elem.innerText = Math.floor(Math.random() * 6) + 1;
            if (this.die2Elem) this.die2Elem.innerText = Math.floor(Math.random() * 6) + 1;
        }, 50);

        setTimeout(() => {
            clearInterval(rollInterval);
            if (this.die1Elem) {
                this.die1Elem.classList.remove("rolling");
                this.die1Elem.innerText = finalD1;
            }
            if (this.die2Elem) {
                this.die2Elem.classList.remove("rolling");
                this.die2Elem.innerText = finalD2;
            }
            if (this.diceSumElem) {
                this.diceSumElem.innerText = finalD1 + finalD2;
            }
            if (onComplete) onComplete();
        }, 250);
    }

    // Sets streak badge text
    setStreakBadge(text = "") {
        if (this.streakBadge) this.streakBadge.innerText = text;
    }

    // Clears dice display
    resetDiceDisplay() {
        if (this.die1Elem) this.die1Elem.innerText = "-";
        if (this.die2Elem) this.die2Elem.innerText = "-";
        if (this.diceSumElem) this.diceSumElem.innerText = "-";
        this.setStreakBadge("");
    }

    // Updates betting phase alert
    updateBettingBadge(firstMoveDone, betsClosed) {
        if (!this.bettingBadge) return;
        if (!firstMoveDone) {
            this.bettingBadge.className = "status-alert closed";
            this.bettingBadge.innerText = window.I18n ? window.I18n.t("client.waitingStartTitle") : "WAITING FOR START";
        } else if (betsClosed) {
            this.bettingBadge.className = "status-alert closed";
            this.bettingBadge.innerText = window.I18n ? window.I18n.t("host.betsClosed") : "NO MORE BETS! BETS CLOSED";
        } else {
            this.bettingBadge.className = "status-alert open";
            this.bettingBadge.innerText = window.I18n ? window.I18n.t("host.betsOpen") : "BETS OPEN";
        }
    }
}

window.HostTrackView = HostTrackView;
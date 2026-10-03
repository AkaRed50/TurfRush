// Renders the race results and podium screen

class HostResultsView {
    constructor() {
        this.resultsContainer = document.getElementById("resultsContent");
        this.resumeBubble = document.getElementById("btnResumeResults");
    }

    // Renders podium and arrivals
    render(options) {
        const {
            standings,
            podium,
            isFinalRound,
            currentRound,
            horses,
            onNextAction,
            onMinimize
        } = options;

        if (!this.resultsContainer) return;

        // Translation helper with default text fallbacks
        const t = (k, p, fallback) => {
            if (window.I18n) {
                const val = window.I18n.t(k, p);
                if (val && !val.includes(".")) return val;
            }
            return fallback || k;
        };

        const isUma = Boolean(window.UmaManager && window.UmaManager.isThemeActive);

        const titleText = isFinalRound
            ? t("host.results.tournamentFinished", {}, "FINAL CHAMPIONSHIP STANDINGS")
            : t("host.results.roundCompleted", { round: currentRound }, `RACE ${currentRound} OF 5 COMPLETED`);

        const btnText = isFinalRound
            ? t("host.results.newTournamentBtn", {}, "NEW TOURNAMENT")
            : t("host.results.nextRaceBtn", { nextRound: currentRound + 1 }, `NEXT RACE (ROUND ${currentRound + 1})`);

        const sortedHorses = [...horses].sort((a, b) => b.position - a.position);

        const rankTitles = [
            t("host.results.podiumGold", {}, "1ST PLACE 🥇"),
            t("host.results.podiumSilver", {}, "2ND PLACE 🥈"),
            t("host.results.podiumBronze", {}, "3RD PLACE 🥉")
        ];

        const rankBorderColors = ["#ffd54f", "#cbd5e1", "#cd7f32"];
        const rankGradients = [
            "linear-gradient(180deg, #3d280e 0%, #1e1307 100%)",
            "linear-gradient(180deg, #2a2c31 0%, #14161a 100%)",
            "linear-gradient(180deg, #381e0f 0%, #1a0e07 100%)"
        ];

        const podiumCardsHtml = [0, 1, 2].map(idx => {
            const h = sortedHorses[idx];
            if (!h) return `<div class="podium-card empty" style="flex: 1;"></div>`;

            const uma = isUma ? window.UmaManager.getUmaForLane(h.id) : null;
            const runnerName = uma ? uma.name : `#${h.label}`;
            const iconUrl = uma?.icon || "";
            const tileText = t("host.tileLabel", { pos: h.position }, `Tile: ${h.position}`);

            return `
                <div class="podium-card" style="
                    flex: 1;
                    background: ${rankGradients[idx]};
                    border: 3px solid ${rankBorderColors[idx]};
                    border-radius: 12px;
                    padding: 24px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
                ">
                    <span style="font-size: 1.3rem; font-weight: 900; color: ${rankBorderColors[idx]}; letter-spacing: 1.5px; margin-bottom: 12px; text-transform: uppercase;">
                        ${rankTitles[idx]}
                    </span>
                    
                    ${iconUrl ? `
                        <div class="podium-avatar" style="background-image: url('${iconUrl}'); border-color:${rankBorderColors[idx]};"></div>
                    ` : `
                        <div class="podium-token-circle lane-badge ${h.color}">${h.label}</div>
                    `}

                    <div style="font-size: 2rem; font-weight: 900; color: #ffffff; margin-bottom: 10px; text-shadow: 2px 2px 4px #000;">
                        ${runnerName}
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <span class="lane-badge ${h.color}" style="width: auto; padding: 6px 16px; margin: 0; font-size: 1.1rem; border-radius: 6px;">#${h.label}</span>
                        <span style="font-size: 1.25rem; font-weight: 900; color: #ffd54f;">${tileText}</span>
                    </div>
                </div>
            `;
        }).join("");

        const otherHorsesRows = sortedHorses.slice(3).map((h, i) => {
            const rank = i + 4;
            const uma = isUma ? window.UmaManager.getUmaForLane(h.id) : null;
            const name = uma ? uma.name : `#${h.label}`;
            const iconUrl = uma?.icon || "";
            const tileText = t("host.tileLabel", { pos: `<b style="color: #ffd54f; font-size: 1.5rem;">${h.position}</b>` }, `Tile: <b style="color: #ffd54f; font-size: 1.5rem;">${h.position}</b>`);

            return `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    background: #1c0e07;
                    border: 2px solid #4a2912;
                    border-radius: 10px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
                ">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <span style="font-weight: 900; color: #c4a482; min-width: 36px; font-size: 1.5rem;">#${rank}</span>
                        
                        ${iconUrl ? `
                            <div style="width: 52px; height: 52px; border-radius: 50%; background-image: url('${iconUrl}'); background-size: cover; background-position: center; border: 2.5px solid #ffd54f; flex-shrink: 0;"></div>
                        ` : `
                            <div class="lane-badge ${h.color}" style="width: 52px; height: 52px; border-radius: 50\%; font-size: 1.15rem; margin: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${h.label}</div>
                        `}

                        <span class="lane-badge ${h.color}" style="width: auto; padding: 6px 14px; margin: 0; font-size: 1.05rem; border-radius: 6px;">#${h.label}</span>
                        
                        <span style="font-weight: 800; color: #f7eed8; font-size: 1.35rem;">${name}</span>
                    </div>

                    <span style="font-size: 1.3rem; color: #e8d0b5;">${tileText}</span>
                </div>
            `;
        }).join("");

        const horseArrivalsText = t("host.horseArrivals", {}, "🏁 HORSE ARRIVALS");
        const viewTrackText = t("host.viewTrack", {}, "🏁 VIEW TRACK");

        this.resultsContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(229,179,88,0.4); padding-bottom: 12px; margin-bottom: 20px; flex-shrink: 0;">
                <h2 style="color: #ffd54f; margin: 0; font-size: 2.3rem; letter-spacing: 2px; text-shadow: 0 0 12px rgba(255,213,79,0.3);">${titleText}</h2>
                <button id="btnMinimizeResults" class="speed-btn active" style="padding: 12px 24px; font-size: 1.05rem; border-radius: 6px; cursor: pointer;">${viewTrackText}</button>
            </div>
            
            <div style="display: flex; gap: 24px; width: 100%; margin-bottom: 24px; flex-shrink: 0;">
                ${podiumCardsHtml}
            </div>

            <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; background: rgba(20, 10, 5, 0.7); padding: 20px 24px; border-radius: 12px; border: 2px solid #4a2912;">
                <div style="font-size: 1.3rem; font-weight: 900; color: #e5b358; margin-bottom: 16px; letter-spacing: 1.5px; text-transform: uppercase;">
                    ${horseArrivalsText}
                </div>
                <div style="flex: 1; overflow-y: auto; padding-right: 8px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; align-content: start;">
                    ${otherHorsesRows}
                </div>
            </div>

            <button id="btnActionNext" class="primary" style="width: 100%; padding: 18px; margin-top: 18px; font-size: 1.4rem; letter-spacing: 1px; font-weight: 900; flex-shrink: 0; cursor: pointer;">
                ${btnText}
            </button>
        `;

        const minBtn = document.getElementById("btnMinimizeResults");
        if (minBtn) {
            minBtn.onclick = () => {
                if (onMinimize) onMinimize();
            };
        }

        const nextBtn = document.getElementById("btnActionNext");
        if (nextBtn) {
            nextBtn.onclick = () => {
                if (onNextAction) onNextAction();
            };
        }
    }
}

window.HostResultsView = HostResultsView;
// Calculates payouts, podium ranks, and cash balances

class PayoutEngine {
    // Computes top three finishers
    static calculatePodium(horses) {
        const sorted = [...horses].sort((a, b) => b.position - a.position);
        const winList = [];
        const placeList = [];
        const showList = [];

        if (sorted.length === 0) {
            return { winList, placeList, showList, sorted };
        }

        const topPos = sorted[0].position;
        sorted.forEach(h => {
            if (h.position === topPos) {
                winList.push(h.id);
            }
        });

        if (winList.length === 1) {
            const nonWinners = sorted.filter(h => !winList.includes(h.id));
            if (nonWinners.length > 0) {
                const secondPos = nonWinners[0].position;
                const secondTied = nonWinners.filter(h => h.position === secondPos);
                secondTied.forEach(h => placeList.push(h.id));

                if (secondTied.length === 1) {
                    const nonPlace = nonWinners.filter(h => !placeList.includes(h.id));
                    if (nonPlace.length > 0) {
                        const thirdPos = nonPlace[0].position;
                        nonPlace.filter(h => h.position === thirdPos).forEach(h => showList.push(h.id));
                    }
                }
            }
        } else if (winList.length === 2) {
            winList.forEach(id => placeList.push(id));
            const nonWinners = sorted.filter(h => !winList.includes(h.id));
            if (nonWinners.length > 0) {
                const thirdPos = nonWinners[0].position;
                nonWinners.filter(h => h.position === thirdPos).forEach(h => showList.push(h.id));
            }
        } else {
            winList.forEach(id => {
                placeList.push(id);
                showList.push(id);
            });
        }

        return { winList, placeList, showList, sorted };
    }

    // Checks exotic bet condition
    static evaluateExoticCard(card, horses, podium, sorted) {
        const topHorse = sorted[0];
        const secondHorse = sorted[1];

        switch (card.id) {
            case "exotic_blowout":
                return Boolean(topHorse && secondHorse && (topHorse.position - secondHorse.position >= 3));

            case "exotic_tightrace":
                return horses.every(h => h.position >= 6);

            case "exotic_photofinish": {
                const posMap = {};
                horses.forEach(h => {
                    posMap[h.position] = (posMap[h.position] || 0) + 1;
                });
                const podiumHorses = horses.filter(h =>
                    podium.win.includes(h.id) || podium.place.includes(h.id) || podium.show.includes(h.id)
                );
                return podiumHorses.some(h => posMap[h.position] > 1);
            }

            case "exotic_longest_odds":
                return Boolean(topHorse && topHorse.color === "blue");

            case "exotic_favorite_fall": {
                const h7Rank = sorted.findIndex(h => h.label === "7") + 1;
                return h7Rank >= 6;
            }

            default:
                return false;
        }
    }

    // Evaluates prop card outcome
    static evaluatePropCard(card, horses) {
        const horseA = horses.find(h => h.id === card.hA);
        if (!horseA) return false;

        if (card.type === "H_VS_H") {
            const horseB = horses.find(h => h.id === card.hB);
            if (!horseB) return false;
            return horseA.position > horseB.position;
        }

        if (card.type === "H_VS_COLOR") {
            const rivalHorses = horses.filter(h => h.color === card.colorB);
            return rivalHorses.every(rh => horseA.position > rh.position);
        }

        return false;
    }

    // Resolves all round bets
    static resolveRace(params) {
        const {
            players,
            activeBets,
            activeSideBets,
            activePropBets = new Map(),
            activeExoticBets = new Map(),
            activePropsDeck = [],
            activeExoticsDeck = [],
            horses,
            boardData,
            allowDebt
        } = params;

        const t = (k, p) => (window.I18n ? window.I18n.t(k, p) : k);

        const { winList, placeList, showList, sorted } = this.calculatePodium(horses);
        const podium = { win: winList, place: placeList, show: showList };

        const isWin = (hId) => winList.includes(hId);
        const isPlace = (hId) => isWin(hId) || placeList.includes(hId);
        const isShow = (hId) => isPlace(hId) || showList.includes(hId);

        const playersMap = new Map();
        players.forEach(p => {
            playersMap.set(p.id, {
                id: p.id,
                name: p.name,
                color: p.color,
                money: p.money,
                delta: 0,
                breakdown: []
            });
        });

        activeBets.forEach(bet => {
            const p = playersMap.get(bet.playerId);
            if (!p) return;

            const horseConfig = boardData.mainBets.find(b => b.horseId === bet.horseId);
            const odds = horseConfig[bet.category][bet.slotIndex];
            let won = false;

            if (bet.category === "win" && isWin(bet.horseId)) won = true;
            if (bet.category === "place" && isPlace(bet.horseId)) won = true;
            if (bet.category === "show" && isShow(bet.horseId)) won = true;

            let betKey = "payouts.winBet";
            if (bet.category === "place") betKey = "payouts.placeBet";
            if (bet.category === "show") betKey = "payouts.showBet";

            const label = t(betKey, { label: bet.horseLabel });

            if (won) {
                const gain = bet.chipValue * odds.m;
                p.delta += gain;
                p.breakdown.push({ label, amount: gain, won: true });
            } else {
                const loss = odds.p;
                p.delta -= loss;
                p.breakdown.push({ label, amount: -loss, won: false });
            }
        });

        const winningHorse = horses.find(h => winList.includes(h.id));
        const winningColor = winningHorse ? winningHorse.color : null;
        const horse7Rank = sorted.findIndex(h => h.label === "7") + 1;

        activeSideBets.forEach(bet => {
            const p = playersMap.get(bet.playerId);
            if (!p) return;

            const odds = boardData.sideBets[bet.sideType];
            let won = false;

            if (bet.sideType === "blue" && winningColor === "blue") won = true;
            if (bet.sideType === "orange" && winningColor === "orange") won = true;
            if (bet.sideType === "red" && winningColor === "red") won = true;
            if (bet.sideType === "black" && horse7Rank >= 5) won = true;

            const label = t("payouts.sideBet", { side: bet.sideType.toUpperCase() });

            if (won) {
                const gain = bet.chipValue * odds.m;
                p.delta += gain;
                p.breakdown.push({ label, amount: gain, won: true });
            } else {
                const loss = odds.p;
                p.delta -= loss;
                p.breakdown.push({ label, amount: -loss, won: false });
            }
        });

        activePropBets.forEach(bet => {
            const p = playersMap.get(bet.playerId);
            if (!p) return;

            const card = activePropsDeck.find(c => c.id === bet.propId);
            if (!card) return;

            const label = t("payouts.propBet", { title: card.title });
            const won = this.evaluatePropCard(card, horses);

            if (won) {
                const gain = bet.chipValue * card.m;
                p.delta += gain;
                p.breakdown.push({ label, amount: gain, won: true });
            } else {
                const loss = card.p;
                p.delta -= loss;
                p.breakdown.push({ label, amount: -loss, won: false });
            }
        });

        activeExoticBets.forEach(bet => {
            const p = playersMap.get(bet.playerId);
            if (!p) return;

            const card = activeExoticsDeck.find(c => c.id === bet.exoticId);
            if (!card) return;
            const slotOdds = card.slots[bet.slotIndex];
            if (!slotOdds) return;

            const label = t("payouts.exoticBet", { title: card.title });
            const won = this.evaluateExoticCard(card, horses, podium, sorted);

            if (won) {
                const gain = bet.chipValue * slotOdds.m;
                p.delta += gain;
                p.breakdown.push({ label, amount: gain, won: true });
            } else {
                const loss = slotOdds.p;
                p.delta -= loss;
                p.breakdown.push({ label, amount: -loss, won: false });
            }
        });

        playersMap.forEach(p => {
            let nextMoney = p.money + p.delta;
            if (!allowDebt && nextMoney < 0) {
                nextMoney = 0;
            }
            p.money = nextMoney;
        });

        const standings = Array.from(playersMap.values()).sort((a, b) => b.money - a.money);

        return {
            podium,
            standings
        };
    }
}

window.PayoutEngine = PayoutEngine;
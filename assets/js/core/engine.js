// Core race mechanics, movement rules, and loop control

class RaceEngine {
    constructor(boardData = null, options = {}) {
        const config = (boardData && boardData.track) ? boardData.track : {};
        this.trackLength = options.trackLength || config.length || 15;
        this.redLinePosition = options.redLinePosition || config.redLine || 10;
        this.stepDelayMs = options.stepDelayMs || 1000;

        if (boardData && Array.isArray(boardData.horses)) {
            this.horses = boardData.horses.map(h => ({
                id: h.id,
                label: h.label,
                color: h.color,
                bonus: h.bonus,
                position: 0
            }));
        } else {
            this.horses = [
                { id: 0, label: "2/3", color: "blue", bonus: 3, position: 0 },
                { id: 1, label: "4", color: "blue", bonus: 3, position: 0 },
                { id: 2, label: "5", color: "orange", bonus: 2, position: 0 },
                { id: 3, label: "6", color: "red", bonus: 1, position: 0 },
                { id: 4, label: "7", color: "black", bonus: 0, position: 0 },
                { id: 5, label: "8", color: "red", bonus: 1, position: 0 },
                { id: 6, label: "9", color: "orange", bonus: 2, position: 0 },
                { id: 7, label: "10", color: "blue", bonus: 3, position: 0 },
                { id: 8, label: "11/12", color: "blue", bonus: 3, position: 0 }
            ];
        }

        this.currentRound = 1;
        this.totalRounds = 5;
        this.lastRolledHorseId = null;
        this.consecutiveRollCount = 0;
        this.redLineCrossedCount = 0;
        this.betsClosed = false;
        this.raceFinished = false;
        this.timer = null;

        this.podium = {
            win: [],
            place: [],
            show: []
        };

        this.onDiceRolled = null;
        this.onHorseMoved = null;
        this.onRedLineCrossed = null;
        this.onBetsClosed = null;
        this.onRaceFinished = null;
    }

    // Generates random dice values
    rollDice() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const sum = d1 + d2;
        return { d1, d2, sum };
    }

    // Maps total to lane index
    mapDiceToHorse(sum) {
        if (sum === 2 || sum === 3) return 0;
        if (sum === 4) return 1;
        if (sum === 5) return 2;
        if (sum === 6) return 3;
        if (sum === 7) return 4;
        if (sum === 8) return 5;
        if (sum === 9) return 6;
        if (sum === 10) return 7;
        if (sum === 11 || sum === 12) return 8;
        return 4;
    }

    // Executes single race step
    step() {
        if (this.raceFinished) return;

        const dice = this.rollDice();
        const horseId = this.mapDiceToHorse(dice.sum);
        const horse = this.horses[horseId];

        if (this.lastRolledHorseId === horseId) {
            this.consecutiveRollCount++;
        } else {
            this.lastRolledHorseId = horseId;
            this.consecutiveRollCount = 1;
        }

        const isStreak = (this.consecutiveRollCount % 2 === 0);
        let stepsToMove = 1;

        if (isStreak) {
            stepsToMove += horse.bonus;
        }

        if (this.onDiceRolled) {
            this.onDiceRolled({ dice, horse, stepsToMove, bonusApplied: isStreak });
        }

        const prevPos = horse.position;
        horse.position += stepsToMove;

        if (prevPos < this.redLinePosition && horse.position >= this.redLinePosition) {
            this.redLineCrossedCount++;
            if (this.onRedLineCrossed) {
                this.onRedLineCrossed({ horse, count: this.redLineCrossedCount });
            }
            if (this.redLineCrossedCount >= 3 && !this.betsClosed) {
                this.betsClosed = true;
                if (this.onBetsClosed) {
                    this.onBetsClosed();
                }
            }
        }

        if (this.onHorseMoved) {
            this.onHorseMoved({ horse, bonusApplied: isStreak, stepsMoved: stepsToMove });
        }

        if (horse.position >= this.trackLength) {
            this.concludeRace();
        }
    }

    // Resolves race finish state
    concludeRace() {
        this.raceFinished = true;
        this.betsClosed = true;
        this.pauseLoop();

        const sorted = [...this.horses].sort((a, b) => b.position - a.position);

        this.podium.win = [sorted[0].id];
        this.podium.place = sorted[1] ? [sorted[1].id] : [];
        this.podium.show = sorted[2] ? [sorted[2].id] : [];

        if (this.onRaceFinished) {
            this.onRaceFinished({
                horses: sorted,
                winner: sorted[0],
                podium: this.podium,
                round: this.currentRound,
                isFinalRound: this.currentRound >= this.totalRounds
            });
        }
    }

    // Starts continuous step interval
    startAutoLoop() {
        if (this.timer || this.raceFinished) return;
        this.step();
        this.timer = setInterval(() => {
            if (!this.raceFinished) {
                this.step();
            } else {
                this.pauseLoop();
            }
        }, this.stepDelayMs);
    }

    // Pauses race step interval
    pauseLoop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    // Adjusts race tick interval
    setSpeed(speedMs) {
        this.stepDelayMs = speedMs;
        if (this.timer) {
            this.pauseLoop();
            this.startAutoLoop();
        }
    }

    // Advances to next race
    prepareNextRound() {
        this.currentRound++;
        this.reset();
    }

    // Resets positions and counters
    reset() {
        this.pauseLoop();
        this.horses.forEach(h => {
            h.position = 0;
        });
        this.lastRolledHorseId = null;
        this.consecutiveRollCount = 0;
        this.redLineCrossedCount = 0;
        this.betsClosed = false;
        this.raceFinished = false;
        this.podium = { win: [], place: [], show: [] };
    }
}

window.RaceEngine = RaceEngine;
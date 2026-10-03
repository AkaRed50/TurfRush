// Handles dice rolling and horse lane mapping

class DiceRoller {
    // Rolls two standard dice
    static roll() {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const sum = d1 + d2;
        return { d1, d2, sum };
    }

    // Maps roll sum to horse
    static mapSumToHorseId(sum) {
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
}

window.DiceRoller = DiceRoller;
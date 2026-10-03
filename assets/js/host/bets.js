// Manages bet registrations, player chips, and cards

class HostBetManager {
    constructor() {
        this.CANONICAL_CHIPS = [2, 3, 3, 4, 5];
        this.playerTokenInventory = new Map();

        this.activeBets = new Map();
        this.activeSideBets = new Map();
        this.activePropBets = new Map();
        this.activeExoticBets = new Map();

        this.activePropsDeck = [];
        this.activeExoticsDeck = [];
        this.remainingExoticPool = [];
    }

    // Resets chips for all players
    resetAllPlayerTokens(players = []) {
        this.playerTokenInventory.clear();
        players.forEach(p => {
            this.initPlayerTokens(p.id);
        });
    }

    // Initializes chips for a player
    initPlayerTokens(playerId) {
        this.playerTokenInventory.set(playerId, [...this.CANONICAL_CHIPS]);
    }

    // Removes player tokens
    removePlayer(playerId) {
        this.playerTokenInventory.delete(playerId);
    }

    // Clears all active bets
    clearRoundBets() {
        this.activeBets.clear();
        this.activeSideBets.clear();
        this.activePropBets.clear();
        this.activeExoticBets.clear();
    }

    // Prepares prop and exotic decks
    setupDecksForRound(round, boardData) {
        if (!boardData) return;

        if (boardData.propDeck && Array.isArray(boardData.propDeck)) {
            const shuffled = [...boardData.propDeck].sort(() => 0.5 - Math.random());
            this.activePropsDeck = shuffled.slice(0, 5);
        }

        if (round === 1) {
            this.remainingExoticPool = [...(boardData.exoticDeck || [])].sort(() => 0.5 - Math.random());
            this.activeExoticsDeck = [];
            if (this.remainingExoticPool.length > 0) {
                this.activeExoticsDeck.push(this.remainingExoticPool.shift());
            }
        } else {
            if (this.remainingExoticPool.length > 0) {
                this.activeExoticsDeck.push(this.remainingExoticPool.shift());
            }
        }
    }

    // Consumes a chip by index
    consumeChip(playerId, chipIndex) {
        if (typeof chipIndex !== "number" || chipIndex < 0 || chipIndex >= this.CANONICAL_CHIPS.length) {
            return null;
        }
        const chips = this.playerTokenInventory.get(playerId);
        if (!chips || chips[chipIndex] === null) {
            return null;
        }
        const val = chips[chipIndex];
        chips[chipIndex] = null;
        return val;
    }

    // Registers a main board bet
    registerMainBet(payload, player, horse) {
        const { horseId, category, slotIndex, chipIndex } = payload;
        const slotKey = `slot-${horseId}-${category}-${slotIndex}`;

        if (this.activeBets.has(slotKey)) return null;

        const val = this.consumeChip(player.id, chipIndex);
        if (val === null) return null;

        const bet = {
            slotId: slotKey,
            playerId: player.id,
            horseId,
            horseLabel: horse.label,
            category,
            slotIndex,
            chipValue: val,
            color: player.color
        };
        this.activeBets.set(slotKey, bet);
        return bet;
    }

    // Registers a side bet
    registerSideBet(payload, player) {
        const { sideType, chipIndex } = payload;
        const slotKey = `side-${sideType}`;

        if (this.activeSideBets.has(slotKey)) return null;

        const val = this.consumeChip(player.id, chipIndex);
        if (val === null) return null;

        const bet = {
            slotId: slotKey,
            playerId: player.id,
            sideType,
            chipValue: val,
            color: player.color
        };
        this.activeSideBets.set(slotKey, bet);
        return bet;
    }

    // Registers a prop bet
    registerPropBet(payload, player) {
        const { propId, chipIndex } = payload;
        const slotKey = `prop-${propId}`;

        if (this.activePropBets.has(slotKey)) return null;

        const card = this.activePropsDeck.find(p => p.id === propId);
        if (!card) return null;

        const val = this.consumeChip(player.id, chipIndex);
        if (val === null) return null;

        const bet = {
            slotId: slotKey,
            playerId: player.id,
            propId,
            chipValue: val,
            color: player.color,
            cardTitle: card.title
        };
        this.activePropBets.set(slotKey, bet);
        return bet;
    }

    // Registers an exotic finish bet
    registerExoticBet(payload, player) {
        const { exoticId, slotIndex, chipIndex } = payload;
        const slotKey = `exotic-${exoticId}-${slotIndex}`;

        if (this.activeExoticBets.has(slotKey)) return null;

        let alreadyPlaced = false;
        this.activeExoticBets.forEach(eb => {
            if (eb.exoticId === exoticId && eb.playerId === player.id) {
                alreadyPlaced = true;
            }
        });
        if (alreadyPlaced) return null;

        const card = this.activeExoticsDeck.find(e => e.id === exoticId);
        if (!card || !card.slots[slotIndex]) return null;

        const val = this.consumeChip(player.id, chipIndex);
        if (val === null) return null;

        const bet = {
            slotId: slotKey,
            playerId: player.id,
            exoticId,
            slotIndex,
            chipValue: val,
            color: player.color,
            cardTitle: card.title
        };
        this.activeExoticBets.set(slotKey, bet);
        return bet;
    }
}

window.HostBetManager = HostBetManager;
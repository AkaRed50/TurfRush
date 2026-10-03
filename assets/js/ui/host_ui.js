// Coordinates race engine, P2P network, and host views

class HostController {
    constructor() {
        this.boardData = null;
        this.engine = null;
        this.p2p = null;
        this.trackView = new HostTrackView();
        this.narrator = new HostNarrator();
        this.lobby = null;
        this.betManager = new HostBetManager();
        this.resultsView = new HostResultsView();

        this.isRolling = false;
        this.isGameStarted = false;
        this.firstMoveDone = false;
        this.snapshotPositions = {};

        const savedLang = localStorage.getItem("turfrush_lang") || "en";

        this.roomConfig = {
            roomCode: this.generateRoomCode(),
            maxPlayers: 8,
            initialMoney: 0,
            allowDebt: false,
            theme: "western",
            lang: savedLang
        };
    }

    // Generates 6-character room code
    generateRoomCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    // Prepares state synchronization payload
    getRoundSyncPayload() {
        return {
            round: this.engine ? this.engine.currentRound : 1,
            totalRounds: this.engine ? this.engine.totalRounds : 5,
            config: this.roomConfig,
            activeProps: this.betManager.activePropsDeck,
            activeExotics: this.betManager.activeExoticsDeck,
            umaLineup: window.UmaManager ? window.UmaManager.getLineup() : []
        };
    }

    // Toggles active fullscreen view
    switchView(viewId) {
        const views = ["lobbyView", "umaSetupModal", "gameView", "resultsView", "activePlayersModal"];
        views.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const target = document.getElementById(viewId);
        if (target) target.classList.remove("hidden");
    }

    // Initializes host subsystems
    async init() {
        if (window.UmaManager) {
            await window.UmaManager.init();
        }

        try {
            if (window.I18n) {
                await window.I18n.init(this.roomConfig.lang);
            }
        } catch (e) {}

        this.lobby = new HostLobby({
            onMaxPlayersChange: (max) => {
                this.roomConfig.maxPlayers = max;
                if (this.p2p && this.p2p.options) this.p2p.options.maxPlayers = max;
                this.updateLobbyPlayers();
            },
            onThemeChange: (theme) => {
                this.roomConfig.theme = theme;
                const isUma = (theme === "uma");
                if (window.UmaManager) {
                    window.UmaManager.setThemeActive(isUma);
                }
            },
            onLanguageChange: async (lang) => {
                await this.changeLanguage(lang);
            },
            onKickPlayer: (playerId) => {
                if (this.p2p) this.p2p.kickPlayer(playerId);
            },
            onOpenPlayersModal: () => {
                this.updateLobbyPlayers();
                const modal = document.getElementById("activePlayersModal");
                if (modal) modal.classList.remove("hidden");
            },
            onStartGame: (formConfig) => {
                Object.assign(this.roomConfig, formConfig);
                this.lobby.setHeaderRoomCode(this.roomConfig.roomCode);
                this.updateLangToggleButton();

                const isUma = (this.roomConfig.theme === "uma");
                if (window.UmaManager) {
                    window.UmaManager.setThemeActive(isUma);
                }

                if (isUma) {
                    this.openUmaLineupModal();
                } else {
                    this.launchActiveGameSession();
                }
            }
        });

        this.lobby.setRoomCode(this.roomConfig.roomCode);
        if (window.UiI18nBinder) window.UiI18nBinder.applyHostTexts();
        this.updateLangToggleButton();

        await this.loadBoardData();
        this.engine = new RaceEngine(this.boardData, { stepDelayMs: 1000 });
        this.setupEngineEvents();
        this.initP2P();
        this.setupHeaderControls();
        this.setupUmaModalControls();

        const themeSelect = document.getElementById("configTheme");
        if (themeSelect && themeSelect.value === "uma") {
            this.roomConfig.theme = "uma";
            if (window.UmaManager) window.UmaManager.setThemeActive(true);
        }
    }

    // Updates application language
    async changeLanguage(lang) {
        this.roomConfig.lang = lang;
        localStorage.setItem("turfrush_lang", lang);
        if (window.I18n) {
            await window.I18n.setLanguage(lang);
        }
        if (window.UiI18nBinder) {
            window.UiI18nBinder.applyHostTexts();
        }
        if (this.lobby && this.lobby.configLang) {
            this.lobby.configLang.value = lang;
        }
        this.trackView.updateBettingBadge(this.firstMoveDone, this.engine ? this.engine.betsClosed : false);
        this.updateLangToggleButton();
        if (this.p2p) {
            this.p2p.broadcast(NetEvents.LANG_UPDATE, { lang });
        }
    }

    // Updates language toggle button
    updateLangToggleButton() {
        const btnLangToggle = document.getElementById("btnLangToggle");
        if (!btnLangToggle) return;
        const currentLang = (this.roomConfig.lang || "en").toLowerCase();
        const displayLabel = currentLang === "es" ? "ES" : "EN";
        btnLangToggle.innerText = `🌐 ${displayLabel}`;
        btnLangToggle.title = currentLang === "es" ? "Cambiar a Inglés" : "Switch to Spanish";
    }

    // Sets up Uma selection listeners
    setupUmaModalControls() {
        const btnCancel = document.getElementById("btnUmaCancelSetup");
        const btnConfirm = document.getElementById("btnUmaConfirmSetup");
        const btnRollAll = document.getElementById("btnUmaRandomizeAll");

        if (btnCancel) {
            btnCancel.addEventListener("click", () => {
                if (!this.isGameStarted) {
                    this.switchView("lobbyView");
                } else {
                    this.switchView("gameView");
                }
            });
        }

        if (btnRollAll) {
            btnRollAll.addEventListener("click", () => {
                if (window.UmaManager) {
                    window.UmaManager.randomizeAllLanes();
                    this.renderUmaLanesList();
                    if (window.SFX) window.SFX.playDiceRoll();
                }
            });
        }

        if (btnConfirm) {
            btnConfirm.addEventListener("click", () => {
                this.launchActiveGameSession();
            });
        }
    }

    // Opens runner assignment modal
    openUmaLineupModal() {
        this.renderUmaLanesList();
        this.switchView("umaSetupModal");
    }

    // Renders lane character pickers
    renderUmaLanesList() {
        const container = document.getElementById("umaLanesList");
        if (!container || !window.UmaManager) return;
        container.innerHTML = "";

        const lineup = window.UmaManager.getLineup();
        const diceTitle = window.I18n ? window.I18n.t("host.umaSetup.rollLaneTitle") : "Roll Random Uma";

        lineup.forEach((umaEntry, laneIdx) => {
            const row = document.createElement("div");
            row.className = "uma-lane-row";

            const availableUmas = window.UmaManager.getAvailableUmasForLane(laneIdx);
            const optionsHtml = availableUmas.map(u => {
                const isSelected = umaEntry && (u.id === umaEntry.id);
                return `<option value="${u.id}" ${isSelected ? "selected" : ""}>${u.name}</option>`;
            }).join("");

            const iconUrl = (umaEntry && umaEntry.icon) ? umaEntry.icon : "";

            row.innerHTML = `
                <div class="lane-badge ${umaEntry.laneColor}" style="width:100%; margin:0; font-size:0.85rem;">
                    #${umaEntry.laneLabel}
                </div>
                <div class="uma-lane-preview-icon" id="umaPreview-${laneIdx}" style="background-image: url('${iconUrl}');"></div>
                <select class="uma-select-dropdown" id="umaSelect-${laneIdx}">
                    ${optionsHtml}
                </select>
                <button class="btn-uma-lane-dice" id="btnUmaRoll-${laneIdx}" title="${diceTitle}">🎲</button>
            `;

            const selectEl = row.querySelector(`#umaSelect-${laneIdx}`);
            const diceBtn = row.querySelector(`#btnUmaRoll-${laneIdx}`);
            const previewEl = row.querySelector(`#umaPreview-${laneIdx}`);

            selectEl.addEventListener("change", (e) => {
                const assigned = window.UmaManager.assignUmaToLane(laneIdx, e.target.value);
                if (assigned && previewEl) {
                    previewEl.style.backgroundImage = `url('${assigned.icon}')`;
                }
            });

            diceBtn.addEventListener("click", () => {
                const rolled = window.UmaManager.rerollLane(laneIdx);
                if (rolled) {
                    selectEl.value = rolled.id;
                    if (previewEl) {
                        previewEl.style.backgroundImage = `url('${rolled.icon}')`;
                    }
                    if (window.SFX) window.SFX.playDiceRoll();
                }
            });

            container.appendChild(row);
        });
    }

    // Starts active race session
    launchActiveGameSession() {
        this.isGameStarted = true;
        this.switchView("gameView");

        this.betManager.setupDecksForRound(this.engine.currentRound, this.boardData);
        this.betManager.resetAllPlayerTokens(this.p2p ? this.p2p.getPlayersList() : []);
        this.firstMoveDone = false;

        this.trackView.buildTrackUI(this.engine.horses, this.engine.trackLength, this.engine.redLinePosition);
        this.trackView.resetDiceDisplay();
        this.trackView.updateBettingBadge(this.firstMoveDone, this.engine.betsClosed);

        const btnStart = document.getElementById("btnStart");
        const btnPause = document.getElementById("btnPause");
        const btnStep = document.getElementById("btnStep");
        if (btnStart) btnStart.disabled = false;
        if (btnPause) btnPause.disabled = false;
        if (btnStep) btnStep.disabled = false;

        this.p2p.broadcast(NetEvents.GAME_START, this.getRoundSyncPayload());
    }

    // Fetches board data file
    async loadBoardData() {
        try {
            const res = await fetch("assets/data/board_odds.json");
            this.boardData = await res.json();
        } catch (e) {
            console.error("Could not fetch board_odds.json", e);
        }
    }

    // Refreshes lobby players view
    updateLobbyPlayers() {
        if (!this.p2p || !this.lobby) return;
        this.lobby.updatePlayersUI(this.p2p.getPlayersList(), this.roomConfig.maxPlayers);
    }

    // Binds race engine callbacks
    setupEngineEvents() {
        this.engine.onDiceRolled = ({ dice, horse, stepsToMove, bonusApplied }) => {
            this.snapshotPositions = {};
            this.engine.horses.forEach(h => this.snapshotPositions[h.id] = h.position);

            this.trackView.animateDice(dice.d1, dice.d2, () => {
                if (bonusApplied) {
                    const runnerName = (window.UmaManager && window.UmaManager.isThemeActive)
                        ? window.UmaManager.getUmaName(horse.id)
                        : `#${horse.label}`;

                    const badgeText = window.I18n
                        ? window.I18n.t("host.log.streakBadge", { label: runnerName, steps: stepsToMove })
                        : `STREAK! ${runnerName} +${stepsToMove}`;
                    this.trackView.setStreakBadge(badgeText);
                } else {
                    this.trackView.setStreakBadge("");
                }
                this.p2p.broadcast(NetEvents.DICE_ROLLED, { dice, horseId: horse.id, stepsToMove, bonusApplied });
            });
        };

        this.engine.onHorseMoved = ({ horse, bonusApplied, stepsMoved }) => {
            setTimeout(() => {
                if (!this.firstMoveDone) {
                    this.firstMoveDone = true;
                    this.trackView.updateBettingBadge(this.firstMoveDone, this.engine.betsClosed);
                    this.p2p.broadcast(NetEvents.BETS_OPENED, {});
                }

                this.trackView.updateRunnerPosition(horse.id, horse.position, this.engine.trackLength, bonusApplied);
                const phrase = this.narrator.generateSituationalNarrative(
                    horse, stepsMoved || 1, bonusApplied, this.snapshotPositions, this.engine.horses
                );
                this.narrator.addLog(phrase);
                this.p2p.broadcast(NetEvents.HORSE_MOVED, { horseId: horse.id, position: horse.position, bonusApplied });
            }, 260);
        };

        this.engine.onRedLineCrossed = ({ horse, count }) => {
            setTimeout(() => {
                if (window.SFX) window.SFX.playRedLineBell();
                const runnerName = (window.UmaManager && window.UmaManager.isThemeActive)
                    ? window.UmaManager.getUmaName(horse.id)
                    : `#${horse.label}`;

                const phrase = window.I18n
                    ? window.I18n.t("narrative.redLine", { label: runnerName, count })
                    : `${runnerName} crossed red line (${count}/3)`;
                this.narrator.addLog(phrase);
                this.p2p.broadcast(NetEvents.RED_LINE_ALERT, { horseId: horse.id, count });
            }, 260);
        };

        this.engine.onBetsClosed = () => {
            setTimeout(() => {
                this.trackView.updateBettingBadge(this.firstMoveDone, this.engine.betsClosed);
                this.narrator.addLog(window.I18n ? window.I18n.t("narrative.betsClosed") : "No more bets!");
                this.p2p.broadcast(NetEvents.BETS_CLOSED, {});
            }, 260);
        };

        this.engine.onRaceFinished = ({ horses, winner, round, isFinalRound }) => {
            setTimeout(() => {
                if (window.SFX) window.SFX.playFinishFanfare();
                const winningHorse = winner || (horses && horses[0]) || this.engine.horses[0];
                const winnerName = (window.UmaManager && window.UmaManager.isThemeActive)
                    ? window.UmaManager.getUmaName(winningHorse.id)
                    : `#${winningHorse.label}`;

                this.narrator.addLog(window.I18n ? window.I18n.t("narrative.victory", { label: winnerName }) : `${winnerName} won!`);

                const btnStart = document.getElementById("btnStart");
                const btnPause = document.getElementById("btnPause");
                const btnStep = document.getElementById("btnStep");
                if (btnStart) btnStart.disabled = true;
                if (btnPause) btnPause.disabled = true;
                if (btnStep) btnStep.disabled = true;
                this.trackView.updateBettingBadge(this.firstMoveDone, this.engine.betsClosed);

                this.p2p.broadcast(NetEvents.RACE_FINISHED, { winnerId: winningHorse.id, round });

                const playersList = this.p2p.getPlayersList();
                try {
                    const { podium, standings } = PayoutEngine.resolveRace({
                        players: playersList,
                        activeBets: this.betManager.activeBets,
                        activeSideBets: this.betManager.activeSideBets,
                        activePropBets: this.betManager.activePropBets,
                        activeExoticBets: this.betManager.activeExoticBets,
                        activePropsDeck: this.betManager.activePropsDeck,
                        activeExoticsDeck: this.betManager.activeExoticsDeck,
                        horses: this.engine.horses,
                        boardData: this.boardData,
                        allowDebt: this.roomConfig.allowDebt
                    });

                    standings.forEach(st => {
                        const connObj = this.p2p.connections.get(st.id);
                        if (connObj) connObj.info.money = st.money;
                    });

                    this.updateLobbyPlayers();
                    this.p2p.broadcast(NetEvents.ROUND_RESOLVED, { round, isFinalRound, podium, standings });

                    setTimeout(() => {
                        const resumeBubble = document.getElementById("btnResumeResults");
                        this.resultsView.render({
                            standings,
                            podium,
                            isFinalRound,
                            currentRound: this.engine.currentRound,
                            horses: this.engine.horses,
                            onMinimize: () => {
                                this.switchView("gameView");
                                if (resumeBubble) resumeBubble.style.display = "block";
                            },
                            onNextAction: () => {
                                if (resumeBubble) resumeBubble.style.display = "none";
                                if (!isFinalRound) {
                                    this.engine.prepareNextRound();
                                    this.betManager.clearRoundBets();
                                    const isUma = (this.roomConfig.theme === "uma");
                                    if (isUma) {
                                        this.openUmaLineupModal();
                                    } else {
                                        this.launchActiveGameSession();
                                    }
                                } else {
                                    window.location.reload();
                                }
                            }
                        });

                        this.switchView("resultsView");
                        if (resumeBubble) {
                            resumeBubble.style.display = "none";
                            resumeBubble.onclick = () => {
                                this.switchView("resultsView");
                                resumeBubble.style.display = "none";
                            };
                        }
                    }, 1200);
                } catch (error) {
                    console.error("Payout calculation failed", error);
                    const errorMsg = window.I18n ? window.I18n.t("host.log.payoutError") : "ERROR calculating payouts.";
                    this.narrator.addLog(errorMsg);
                }
            }, 260);
        };
    }

    // Configures host P2P instance
    initP2P() {
        this.p2p = new P2PManager(true, {
            maxPlayers: this.roomConfig.maxPlayers,
            initialMoney: this.roomConfig.initialMoney,
            roomConfig: this.roomConfig,
            isGameStarted: () => this.isGameStarted,
            getBetState: () => (this.firstMoveDone && !this.engine.betsClosed)
        });

        this.p2p.initHost(this.roomConfig.roomCode);

        this.p2p.onPlayerJoined = (player) => {
            this.betManager.initPlayerTokens(player.id);
            this.updateLobbyPlayers();
        };

        this.p2p.onPlayerLeft = (player) => {
            this.betManager.removePlayer(player.id);
            this.updateLobbyPlayers();
        };

        this.p2p.onDataReceived = (playerId, data) => {
            if (!data || !data.type) return;

            const player = this.p2p.connections.get(playerId)?.info;
            if (!player) return;

            if (this.engine.betsClosed || this.engine.raceFinished || !this.firstMoveDone) return;

            if (data.type === NetEvents.PLACE_BET_REQUEST) {
                const horse = this.engine.horses[data.payload?.horseId];
                if (!horse) return;

                const bet = this.betManager.registerMainBet(data.payload, player, horse);
                if (bet) {
                    this.p2p.broadcast(NetEvents.BET_ACCEPTED, {
                        slotId: bet.slotId,
                        playerId,
                        chipIndex: data.payload.chipIndex,
                        chipValue: bet.chipValue,
                        color: player.color
                    });
                }
            }

            if (data.type === NetEvents.PLACE_SIDE_BET_REQUEST) {
                const bet = this.betManager.registerSideBet(data.payload, player);
                if (bet) {
                    this.p2p.broadcast(NetEvents.BET_ACCEPTED, {
                        slotId: bet.slotId,
                        playerId,
                        chipIndex: data.payload.chipIndex,
                        chipValue: bet.chipValue,
                        color: player.color
                    });
                }
            }

            if (data.type === NetEvents.PLACE_PROP_BET_REQUEST) {
                const bet = this.betManager.registerPropBet(data.payload, player);
                if (bet) {
                    this.p2p.broadcast(NetEvents.BET_ACCEPTED, {
                        slotId: bet.slotId,
                        playerId,
                        chipIndex: data.payload.chipIndex,
                        chipValue: bet.chipValue,
                        color: player.color
                    });
                }
            }

            if (data.type === NetEvents.PLACE_EXOTIC_BET_REQUEST) {
                const bet = this.betManager.registerExoticBet(data.payload, player);
                if (bet) {
                    this.p2p.broadcast(NetEvents.BET_ACCEPTED, {
                        slotId: bet.slotId,
                        playerId,
                        chipIndex: data.payload.chipIndex,
                        chipValue: bet.chipValue,
                        color: player.color
                    });
                }
            }
        };
    }

    // Binds header buttons and speed selector
    setupHeaderControls() {
        const btnStart = document.getElementById("btnStart");
        const btnPause = document.getElementById("btnPause");
        const btnStep = document.getElementById("btnStep");
        const btnReset = document.getElementById("btnReset");
        const btnCopyInGame = document.getElementById("btnCopyInGameLink");
        const btnLangToggle = document.getElementById("btnLangToggle");

        if (btnCopyInGame && this.lobby) {
            btnCopyInGame.addEventListener("click", () => {
                this.lobby.copyInvitationLink(btnCopyInGame);
            });
        }

        const speedBtns = document.querySelectorAll(".speed-btn");
        speedBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const clickedBtn = e.currentTarget;
                speedBtns.forEach(b => b.classList.remove("active"));
                clickedBtn.classList.add("active");
                const speedMs = parseInt(clickedBtn.dataset.speed, 10);
                if (this.engine) this.engine.setSpeed(speedMs);
            });
        });

        if (btnLangToggle) {
            btnLangToggle.addEventListener("click", async () => {
                const current = (this.roomConfig.lang || "en").toLowerCase();
                const nextLang = current === "en" ? "es" : "en";
                await this.changeLanguage(nextLang);
            });
        }

        if (btnStart) {
            btnStart.addEventListener("click", () => {
                if (!this.isRolling && this.engine) this.engine.startAutoLoop();
            });
        }
        if (btnPause) {
            btnPause.addEventListener("click", () => {
                if (this.engine) this.engine.pauseLoop();
            });
        }
        if (btnStep) {
            btnStep.addEventListener("click", () => {
                if (!this.isRolling && this.engine) this.engine.step();
            });
        }
        if (btnReset) {
            btnReset.addEventListener("click", () => {
                if (!this.engine) return;
                const resumeBubble = document.getElementById("btnResumeResults");
                if (resumeBubble) resumeBubble.style.display = "none";

                this.switchView("gameView");

                this.engine.reset();
                this.betManager.clearRoundBets();
                this.betManager.setupDecksForRound(1, this.boardData);
                this.betManager.resetAllPlayerTokens(this.p2p ? this.p2p.getPlayersList() : []);
                this.firstMoveDone = false;

                this.trackView.buildTrackUI(this.engine.horses, this.engine.trackLength, this.engine.redLinePosition);
                this.trackView.resetDiceDisplay();
                this.trackView.updateBettingBadge(this.firstMoveDone, this.engine.betsClosed);
                this.narrator.clear();

                if (btnStart) btnStart.disabled = false;
                if (btnPause) btnPause.disabled = false;
                if (btnStep) btnStep.disabled = false;

                this.p2p.broadcast(NetEvents.RACE_RESET, this.getRoundSyncPayload());
            });
        }
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.HostApp = new HostController();
    window.HostApp.init();
});
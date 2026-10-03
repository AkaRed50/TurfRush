// Controls client betting board, chip management, and networking events

class ClientController {
    constructor() {
        this.p2p = null;
        this.boardData = null;
        this.player = null;
        this.roomConfig = null;
        this.umaLineup = [];

        this.selectedChipIndex = null;
        this.playerChips = [2, 3, 3, 4, 5];
        this.placedChips = new Map();
        this.betsLocked = true;

        this.activeProps = [];
        this.activeExotics = [];
        this.latestStandings = [];

        this.joinModal = document.getElementById("joinModal");
        this.statusOverlay = document.getElementById("statusOverlay");
        this.overlayTitle = document.getElementById("overlayTitle");
        this.overlaySubtitle = document.getElementById("overlaySubtitle");

        this.roundPayoutModal = document.getElementById("roundPayoutModal");
        this.payoutModalTitle = document.getElementById("payoutModalTitle");
        this.personalPayoutSection = document.getElementById("personalPayoutSection");
        this.payoutModalDelta = document.getElementById("payoutModalDelta");
        this.payoutModalBalance = document.getElementById("payoutModalBalance");
        this.payoutBreakdownContainer = document.getElementById("payoutBreakdownContainer");
        this.payoutLeaderboardContainer = document.getElementById("payoutLeaderboardContainer");
        this.btnPayoutModalClose = document.getElementById("btnPayoutModalClose");
        this.btnOpenStandingsModal = document.getElementById("btnOpenStandingsModal");

        this.boardContainer = document.getElementById("boardContainer");
        this.chipBar = document.getElementById("chipBar");
        this.propBetsContainer = document.getElementById("propBetsContainer");

        this.interactiveBetModal = document.getElementById("interactiveBetModal");
        this.interactiveDeckContainer = document.getElementById("interactiveDeckContainer");
    }

    // Toggles theme CSS classes
    applyTheme(themeName) {
        const isUma = Boolean(themeName === "uma");
        if (document.body) {
            document.body.classList.toggle("theme-uma", isUma);
            document.body.classList.toggle("theme-western", !isUma);
        }
    }

    // Locks or unlocks betting
    setBettingLocked(locked) {
        this.betsLocked = locked;
        const felt = document.querySelector(".felt-board");
        if (felt) felt.classList.toggle("betting-locked", locked);
        if (this.chipBar) this.chipBar.classList.toggle("betting-locked", locked);
    }

    // Initializes client application
    async init() {
        const savedLang = localStorage.getItem("turfrush_lang") || "en";
        if (window.I18n) {
            await window.I18n.init(savedLang);
        }
        if (window.UiI18nBinder) {
            window.UiI18nBinder.applyClientTexts();
        }

        await this.loadBoardData();
        this.setupEventListeners();
        this.renderChipBar();
        this.setBettingLocked(true);
        this.checkUrlAutoJoin();
    }

    // Loads betting board configuration
    async loadBoardData() {
        try {
            const res = await fetch("assets/data/board_odds.json");
            this.boardData = await res.json();
            this.renderBoard();
        } catch (e) {
            console.error("Client: Failed to fetch board_odds.json", e);
        }
    }

    // Binds modal and click listeners
    setupEventListeners() {
        const btnConnect = document.getElementById("btnConnect");
        if (btnConnect) {
            btnConnect.addEventListener("click", () => this.handleConnect());
        }

        const btnOpenExotic = document.getElementById("btnOpenExotic");
        if (btnOpenExotic) {
            btnOpenExotic.addEventListener("click", () => {
                if (this.interactiveBetModal) {
                    this.interactiveBetModal.classList.remove("hidden");
                }
            });
        }

        const btnInteractiveClose = document.getElementById("btnInteractiveClose");
        if (btnInteractiveClose) {
            btnInteractiveClose.addEventListener("click", () => {
                if (this.interactiveBetModal) {
                    this.interactiveBetModal.classList.add("hidden");
                }
            });
        }

        if (this.btnPayoutModalClose) {
            this.btnPayoutModalClose.addEventListener("click", () => {
                if (this.roundPayoutModal) {
                    this.roundPayoutModal.classList.add("hidden");
                }
            });
        }

        if (this.btnOpenStandingsModal) {
            this.btnOpenStandingsModal.addEventListener("click", () => {
                this.renderLeaderboardOnlyModal();
            });
        }

        const sideCards = document.querySelectorAll(".side-bet-card");
        sideCards.forEach(card => {
            card.addEventListener("click", () => {
                const sideType = card.dataset.side;
                this.requestPlaceSideBet(sideType);
            });
        });
    }

    // Handles URL join parameters
    checkUrlAutoJoin() {
        const urlParams = new URLSearchParams(window.location.search);
        const autoRoom = urlParams.get("room");
        const autoName = urlParams.get("name");

        const roomInput = document.getElementById("clientRoomCode");
        const nameInput = document.getElementById("clientPlayerName");

        if (autoRoom && roomInput) roomInput.value = autoRoom.toUpperCase();
        if (autoName && nameInput) nameInput.value = autoName;

        if (autoRoom && autoName) {
            this.handleConnect();
        }
    }

    // Connects to host via P2P
    handleConnect() {
        const roomInput = document.getElementById("clientRoomCode");
        const nameInput = document.getElementById("clientPlayerName");

        const roomCode = roomInput?.value.trim().toUpperCase();
        const playerName = nameInput?.value.trim();

        if (!roomCode || !playerName) return;

        this.p2p = new P2PManager(false);
        this.p2p.initClient(roomCode, playerName);

        this.p2p.onConnectedToHost = async (player, config, gameStarted, betsOpen) => {
            this.player = player;
            this.roomConfig = config;

            if (config && config.theme) {
                this.applyTheme(config.theme);
            }

            if (this.joinModal) this.joinModal.classList.add("hidden");

            const nameDisplay = document.getElementById("playerNameDisplay");
            const colorPill = document.getElementById("playerColorPill");
            const cashDisplay = document.getElementById("playerCashDisplay");

            if (nameDisplay) nameDisplay.innerText = player.name;
            if (colorPill) colorPill.style.backgroundColor = player.color;
            if (cashDisplay) cashDisplay.innerText = `$${player.money}`;

            const langToUse = config?.lang || localStorage.getItem("turfrush_lang") || "en";
            if (window.I18n) {
                await window.I18n.setLanguage(langToUse);
            }
            if (window.UiI18nBinder) {
                window.UiI18nBinder.applyClientTexts();
            }

            this.renderBoard();
            this.renderChipBar();
            this.renderPropBetsBar();
            this.renderExoticDeckModal();

            this.hideStatusOverlay();
            this.setBettingLocked(!betsOpen);
        };

        this.p2p.onDisconnectedFromHost = () => {
            this.showStatusOverlay(
                window.I18n ? window.I18n.t("common.alertConnError") : "Connection Error",
                window.I18n ? window.I18n.t("common.alertConnError") : "Disconnected from Host"
            );
        };

        this.p2p.onDataReceived = (data) => {
            this.handleHostMessage(data);
        };
    }

    // Handles incoming host network packets
    handleHostMessage(data) {
        if (!data || !data.type) return;

        switch (data.type) {
            case NetEvents.LANG_UPDATE:
                if (window.I18n && data.payload?.lang) {
                    window.I18n.setLanguage(data.payload.lang).then(() => {
                        if (window.UiI18nBinder) window.UiI18nBinder.applyClientTexts();
                        this.renderBoard();
                        this.renderPropBetsBar();
                        this.renderExoticDeckModal();
                    });
                }
                break;

            case NetEvents.GAME_START:
            case NetEvents.NEXT_ROUND_READY:
                if (data.payload?.config?.theme) {
                    this.applyTheme(data.payload.config.theme);
                }
                this.activeProps = data.payload?.activeProps || [];
                this.activeExotics = data.payload?.activeExotics || [];
                this.umaLineup = data.payload?.umaLineup || [];
                this.resetForNewRound();
                this.renderBoard();
                this.renderExoticDeckModal();
                this.renderPropBetsBar();
                if (this.roundPayoutModal) this.roundPayoutModal.classList.add("hidden");
                this.hideStatusOverlay();
                this.setBettingLocked(true);
                break;

            case NetEvents.BETS_OPENED:
                if (window.SFX) window.SFX.playStartGateFanfare();
                this.hideStatusOverlay();
                this.setBettingLocked(false);
                break;

            case NetEvents.BETS_CLOSED:
                if (window.SFX) window.SFX.playRedLineBell();
                this.setBettingLocked(true);
                break;

            case NetEvents.RACE_FINISHED:
                this.setBettingLocked(true);
                break;

            case NetEvents.BET_ACCEPTED:
                this.onBetAccepted(data.payload);
                break;

            case NetEvents.ROUND_RESOLVED:
                this.onRoundResolved(data.payload);
                break;

            case NetEvents.RACE_RESET:
                if (data.payload?.config?.theme) {
                    this.applyTheme(data.payload.config.theme);
                }
                this.activeProps = data.payload?.activeProps || [];
                this.activeExotics = data.payload?.activeExotics || [];
                this.umaLineup = data.payload?.umaLineup || [];
                this.resetForNewRound();
                this.renderBoard();
                this.renderExoticDeckModal();
                this.renderPropBetsBar();
                if (this.roundPayoutModal) this.roundPayoutModal.classList.add("hidden");
                this.hideStatusOverlay();
                this.setBettingLocked(true);
                break;

            case NetEvents.KICKED:
                alert(window.I18n ? window.I18n.t("common.alertKicked") : "You have been kicked from the room.");
                window.location.reload();
                break;
        }
    }

    // Resets chips and board slots
    resetForNewRound() {
        this.selectedChipIndex = null;
        this.playerChips = [2, 3, 3, 4, 5];
        this.placedChips.clear();

        document.querySelectorAll(".bet-slot").forEach(s => {
            s.classList.remove("occupied");
            s.innerHTML = s.dataset.defaultHtml || s.innerHTML;
        });

        document.querySelectorAll(".side-bet-card").forEach(s => {
            s.classList.remove("occupied");
            const existingChip = s.querySelector(".placed-chip");
            if (existingChip) existingChip.remove();
        });

        this.renderChipBar();
    }

    // Renders main betting board grid
    renderBoard() {
        if (!this.boardContainer || !this.boardData) return;
        this.boardContainer.innerHTML = "";

        const isUma = Boolean(this.umaLineup && this.umaLineup.length === 9);

        this.boardData.horses.forEach((horse, idx) => {
            const row = document.createElement("div");
            row.className = "board-row";

            const horseOdds = this.boardData.mainBets.find(b => b.horseId === horse.id);

            const buildSlotGroupHtml = (category, slots) => {
                return `
                    <div class="bet-slot-group ${category}">
                        ${slots.map((s, slotIdx) => `
                            <div class="bet-slot" id="slot-${horse.id}-${category}-${slotIdx}" data-horse="${horse.id}" data-cat="${category}" data-idx="${slotIdx}">
                                <span class="bet-mult">${s.m}x</span>${s.p > 0 ? `<span class="bet-penalty-pill">-${s.p}</span>` : ""}
                            </div>
                        `).join("")}
                    </div>
                `;
            };

            const showHtml = buildSlotGroupHtml("show", horseOdds.show);
            const placeHtml = buildSlotGroupHtml("place", horseOdds.place);
            const winHtml = buildSlotGroupHtml("win", horseOdds.win);

            let tagInner = `<span>#${horse.label}</span>`;
            if (isUma && this.umaLineup[idx]) {
                const uma = this.umaLineup[idx];
                tagInner = `
                    <div style="width: 26px; height: 26px; border-radius: 50%; background-image: url('${uma.icon}'); background-size: cover; background-position: center; margin-bottom: 2px; border: 1.5px solid var(--accent-bright);"></div>
                    <span style="font-size: 0.55rem; line-height: 1; max-width: 48px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${uma.name}</span>
                `;
            }

            row.innerHTML = `
                ${showHtml}
                ${placeHtml}
                ${winHtml}
                <div class="horse-cell-tag ${horse.color}">
                    ${tagInner}
                </div>
            `;

            row.querySelectorAll(".bet-slot").forEach(slot => {
                slot.dataset.defaultHtml = slot.innerHTML;
                slot.addEventListener("click", () => {
                    const hId = parseInt(slot.dataset.horse, 10);
                    const cat = slot.dataset.cat;
                    const sIdx = parseInt(slot.dataset.idx, 10);
                    this.requestPlaceBet(hId, cat, sIdx);
                });
            });

            this.boardContainer.appendChild(row);
        });
    }

    // Renders bottom chip bar
    renderChipBar() {
        if (!this.chipBar) return;
        this.chipBar.innerHTML = "";

        this.playerChips.forEach((val, idx) => {
            const btn = document.createElement("button");
            btn.className = "chip-btn";
            btn.innerText = val !== null ? val : "-";

            if (val === null) {
                btn.classList.add("used");
                btn.disabled = true;
            } else {
                if (this.selectedChipIndex === idx) {
                    btn.classList.add("selected");
                }
                btn.addEventListener("click", () => {
                    if (this.selectedChipIndex === idx) {
                        this.selectedChipIndex = null;
                    } else {
                        this.selectedChipIndex = idx;
                    }
                    this.renderChipBar();
                });
            }

            this.chipBar.appendChild(btn);
        });
    }

    // Renders proposition bets container
    renderPropBetsBar() {
        if (!this.propBetsContainer) return;
        this.propBetsContainer.innerHTML = "";

        const isEs = Boolean(window.I18n && window.I18n.currentLang === "es");

        this.activeProps.forEach(card => {
            const btn = document.createElement("div");
            btn.id = `prop-${card.id}`;
            btn.className = "side-bet-card";
            btn.style.minHeight = "40px";
            btn.style.background = "#142d19";

            const title = (isEs && card.title_es) ? card.title_es : card.title;

            btn.innerHTML = `
                <span class="side-title" style="font-size: 0.55rem;">${title}</span>
                <span class="side-mult" style="font-size: 0.85rem;">${card.m}x</span>
                ${card.p > 0 ? `<span class="side-penalty">-${card.p}</span>` : ""}
            `;

            btn.addEventListener("click", () => {
                this.requestPlacePropBet(card.id);
            });

            this.propBetsContainer.appendChild(btn);
        });
    }

    // Renders exotic finish deck modal
    renderExoticDeckModal() {
        if (!this.interactiveDeckContainer) return;
        this.interactiveDeckContainer.innerHTML = "";

        const isEs = Boolean(window.I18n && window.I18n.currentLang === "es");

        this.activeExotics.forEach(card => {
            const entry = document.createElement("div");
            entry.className = "bet-card-entry";

            const title = (isEs && card.title_es) ? card.title_es : card.title;
            const desc = (isEs && card.desc_es) ? card.desc_es : card.desc;

            const slotsHtml = card.slots.map((s, idx) => `
                <div class="interactive-slot" id="exotic-${card.id}-${idx}" data-exotic="${card.id}" data-idx="${idx}">
                    <span class="bet-mult">${s.m}x</span>
                    ${s.p > 0 ? `<span class="bet-penalty-pill">-${s.p}</span>` : ""}
                </div>
            `).join("");

            entry.innerHTML = `
                <div class="bet-card-title">${title}</div>
                <div class="bet-card-desc">${desc}</div>
                <div class="exotic-slots-row">
                    ${slotsHtml}
                </div>
            `;

            entry.querySelectorAll(".interactive-slot").forEach(slot => {
                slot.addEventListener("click", () => {
                    const eId = slot.dataset.exotic;
                    const sIdx = parseInt(slot.dataset.idx, 10);
                    this.requestPlaceExoticBet(eId, sIdx);
                });
            });

            this.interactiveDeckContainer.appendChild(entry);
        });
    }

    // Sends main bet request
    requestPlaceBet(horseId, category, slotIndex) {
        if (this.betsLocked || this.selectedChipIndex === null) return;
        this.p2p.sendToHost(NetEvents.PLACE_BET_REQUEST, {
            horseId,
            category,
            slotIndex,
            chipIndex: this.selectedChipIndex
        });
    }

    // Sends side bet request
    requestPlaceSideBet(sideType) {
        if (this.betsLocked || this.selectedChipIndex === null) return;
        this.p2p.sendToHost(NetEvents.PLACE_SIDE_BET_REQUEST, {
            sideType,
            chipIndex: this.selectedChipIndex
        });
    }

    // Sends prop bet request
    requestPlacePropBet(propId) {
        if (this.betsLocked || this.selectedChipIndex === null) return;
        this.p2p.sendToHost(NetEvents.PLACE_PROP_BET_REQUEST, {
            propId,
            chipIndex: this.selectedChipIndex
        });
    }

    // Sends exotic bet request
    requestPlaceExoticBet(exoticId, slotIndex) {
        if (this.betsLocked || this.selectedChipIndex === null) return;
        this.p2p.sendToHost(NetEvents.PLACE_EXOTIC_BET_REQUEST, {
            exoticId,
            slotIndex,
            chipIndex: this.selectedChipIndex
        });
    }

    // Places chip on slot
    onBetAccepted(payload) {
        const { slotId, playerId, chipIndex, chipValue, color } = payload;

        const targetSlot = document.getElementById(slotId);
        if (targetSlot) {
            targetSlot.classList.add("occupied");
            const chip = document.createElement("div");
            chip.className = "placed-chip";
            chip.style.backgroundColor = color;
            chip.innerText = chipValue;

            chip.addEventListener("click", (e) => {
                e.stopPropagation();
                chip.classList.toggle("peeking");
            });

            targetSlot.appendChild(chip);
        }

        if (this.player && playerId === this.player.id) {
            if (window.SFX) window.SFX.playChipBet();
            if (typeof chipIndex === "number" && chipIndex >= 0) {
                this.playerChips[chipIndex] = null;
                this.selectedChipIndex = null;
                this.renderChipBar();
            }
        }
    }

    // Displays round payout summary
    onRoundResolved(payload) {
        const { standings } = payload;
        this.latestStandings = standings || [];
        const myResult = this.latestStandings.find(s => s.id === this.player?.id);

        if (myResult) {
            this.player.money = myResult.money;
            const cashDisplay = document.getElementById("playerCashDisplay");
            if (cashDisplay) cashDisplay.innerText = `$${myResult.money}`;

            if (myResult.delta >= 0) {
                if (window.SFX) window.SFX.playCashRegister();
            } else {
                if (window.SFX) window.SFX.playBuzzerPenalty();
            }

            this.hideStatusOverlay();

            if (this.payoutModalTitle) {
                this.payoutModalTitle.innerText = window.I18n ? window.I18n.t("client.payoutModal.title") : "💰 SUMMARY & PAYOUTS";
            }
            if (this.personalPayoutSection) {
                this.personalPayoutSection.style.display = "block";
            }

            if (this.payoutModalDelta) {
                const deltaPrefix = myResult.delta >= 0 ? "+" : "";
                this.payoutModalDelta.innerText = `${deltaPrefix}$${myResult.delta}`;
                this.payoutModalDelta.style.color = myResult.delta >= 0 ? "#4ade80" : "#f87171";
            }

            if (this.payoutModalBalance) {
                this.payoutModalBalance.innerText = window.I18n
                    ? window.I18n.t("client.balance", { amount: myResult.money })
                    : `Balance: $${myResult.money}`;
            }

            if (this.payoutBreakdownContainer) {
                if (myResult.breakdown && myResult.breakdown.length > 0) {
                    this.payoutBreakdownContainer.innerHTML = myResult.breakdown.map(b => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dashed rgba(255,255,255,0.15);">
                            <span style="color: #f7eed8;">${b.label}</span>
                            <span style="font-weight: 900; color: ${b.won ? '#4ade80' : '#f87171'};">
                                ${b.won ? '+' : ''}$${b.amount}
                            </span>
                        </div>
                    `).join("");
                } else {
                    const noBetsMsg = window.I18n ? window.I18n.t("client.noBetsPlaced") : "No bets placed this round";
                    this.payoutBreakdownContainer.innerHTML = `
                        <div style="color: #94a3b8; text-align: center; padding: 8px;">${noBetsMsg}</div>
                    `;
                }
            }

            this.renderLeaderboardHtml(this.latestStandings);

            if (this.roundPayoutModal) {
                this.roundPayoutModal.classList.remove("hidden");
            }
        }
    }

    // Renders leaderboard list HTML
    renderLeaderboardHtml(standings = []) {
        if (!this.payoutLeaderboardContainer) return;
        if (!standings || standings.length === 0) {
            const noDataMsg = window.I18n ? window.I18n.t("client.noPlayerData") : "No player data available";
            this.payoutLeaderboardContainer.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 6px;">${noDataMsg}</div>`;
            return;
        }

        const youTag = window.I18n ? window.I18n.t("client.youTag") : "(You)";

        this.payoutLeaderboardContainer.innerHTML = standings.map((st, idx) => {
            let rankColor = "var(--accent-gold)";
            if (idx === 0) rankColor = "var(--accent-bright)";
            else if (idx === 1) rankColor = "#cbd5e1";
            else if (idx === 2) rankColor = "#cd7f32";

            const isMe = this.player && st.id === this.player.id;

            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-bottom: 6px; border-radius: 4px; background: ${isMe ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0,0,0,0.2)'}; border: ${isMe ? '1px solid var(--accent-bright)' : '1px solid var(--border-main)'};">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-weight: 900; color: ${rankColor}; min-width: 24px; font-size: 1.05rem;">#${idx + 1}</span>
                        <span class="color-dot" style="background-color: ${st.color}; width: 14px; height: 14px; border-radius: 50%;"></span>
                        <span style="font-weight: 800; color: ${isMe ? 'var(--accent-bright)' : '#ffffff'}; font-size: 0.95rem;">${st.name} ${isMe ? youTag : ''}</span>
                    </div>
                    <span style="font-weight: 900; color: var(--accent-bright); font-size: 1.1rem;">$${st.money}</span>
                </div>
            `;
        }).join("");
    }

    // Opens standings-only view
    renderLeaderboardOnlyModal() {
        if (!this.roundPayoutModal) return;

        if (this.personalPayoutSection) {
            this.personalPayoutSection.style.display = "none";
        }
        if (this.payoutModalTitle) {
            this.payoutModalTitle.innerText = window.I18n ? window.I18n.t("client.standingsTitle") : "🏆 STANDINGS";
        }

        this.renderLeaderboardHtml(this.latestStandings);
        this.roundPayoutModal.classList.remove("hidden");
    }

    // Displays status message overlay
    showStatusOverlay(title, subtitle) {
        if (!this.statusOverlay) return;
        if (this.overlayTitle) this.overlayTitle.innerText = title;
        if (this.overlaySubtitle) this.overlaySubtitle.innerText = subtitle;
        this.statusOverlay.classList.remove("hidden");
    }

    // Hides status message overlay
    hideStatusOverlay() {
        if (!this.statusOverlay) return;
        this.statusOverlay.classList.add("hidden");
    }
}

window.addEventListener("DOMContentLoaded", () => {
    window.ClientApp = new ClientController();
    window.ClientApp.init();
});
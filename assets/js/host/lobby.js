// Manages the host lobby interface, room configuration, and connected players

class HostLobby {
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
        this.lobbyModal = document.getElementById("lobbyModal");
        this.activePlayersModal = document.getElementById("activePlayersModal");
        this.roomCodeDisplay = document.getElementById("roomCodeDisplay");
        this.configHostingMode = document.getElementById("configHostingMode");
        this.groupHostIp = document.getElementById("groupHostIp");
        this.configHostIp = document.getElementById("configHostIp");
        this.configMaxPlayers = document.getElementById("configMaxPlayers");
        this.configInitialMoney = document.getElementById("configInitialMoney");
        this.configDebtMode = document.getElementById("configDebtMode");
        this.configTheme = document.getElementById("configTheme");
        this.configLang = document.getElementById("configLang");
        this.qrcodeContainer = document.getElementById("qrcode");
        this.btnCopyLobbyLink = document.getElementById("btnCopyLobbyLink");
        this.playerCountLabel = document.getElementById("playerCountLabel");
        this.playersListContainer = document.getElementById("playersListContainer");
        this.activeGamePlayersList = document.getElementById("activeGamePlayersList");
        this.headerRoomCode = document.getElementById("headerRoomCode");

        this.initEventListeners();
    }

    // Binds input changes
    initEventListeners() {
        const btnStartLobby = document.getElementById("btnStartLobby");
        const btnPlayersList = document.getElementById("btnPlayersList");
        const btnClosePlayersModal = document.getElementById("btnClosePlayersModal");

        if (this.configHostingMode) {
            this.configHostingMode.addEventListener("change", () => {
                const isLocal = this.configHostingMode.value === "local";
                if (this.groupHostIp) {
                    this.groupHostIp.style.display = isLocal ? "grid" : "none";
                }
                this.refreshQrCode();
            });
        }

        if (this.configHostIp) {
            this.configHostIp.addEventListener("input", () => this.refreshQrCode());
        }

        if (this.btnCopyLobbyLink) {
            this.btnCopyLobbyLink.addEventListener("click", () => this.copyInvitationLink(this.btnCopyLobbyLink));
        }

        if (this.configMaxPlayers) {
            this.configMaxPlayers.addEventListener("change", (e) => {
                if (this.callbacks.onMaxPlayersChange) {
                    this.callbacks.onMaxPlayersChange(parseInt(e.target.value, 10));
                }
            });
        }

        if (this.configLang) {
            this.configLang.addEventListener("change", async (e) => {
                if (this.callbacks.onLanguageChange) {
                    await this.callbacks.onLanguageChange(e.target.value);
                }
            });
        }

        if (btnPlayersList) {
            btnPlayersList.addEventListener("click", () => {
                if (this.activePlayersModal) this.activePlayersModal.classList.remove("hidden");
                if (this.callbacks.onOpenPlayersModal) this.callbacks.onOpenPlayersModal();
            });
        }

        if (btnClosePlayersModal) {
            btnClosePlayersModal.addEventListener("click", () => {
                if (this.activePlayersModal) this.activePlayersModal.classList.add("hidden");
            });
        }

        if (btnStartLobby) {
            btnStartLobby.addEventListener("click", () => {
                const config = {
                    initialMoney: parseInt(this.configInitialMoney?.value, 10) || 0,
                    allowDebt: this.configDebtMode?.value === "true",
                    theme: this.configTheme?.value || "western",
                    lang: this.configLang?.value || "en"
                };
                if (this.callbacks.onStartGame) this.callbacks.onStartGame(config);
            });
        }
    }

    // Create the client invitation
    getInvitationUrl() {
        const mode = this.configHostingMode ? this.configHostingMode.value : "online";
        const currentPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);

        if (mode === "online") {
            const origin = window.location.origin;
            return `${origin}${currentPath}client.html?room=${this.roomCode}`;
        }

        const savedIp = localStorage.getItem("turf_host_ip");
        const targetHost = (this.configHostIp && this.configHostIp.value.trim()) || savedIp || window.location.host || "192.168.1.58:8080";
        localStorage.setItem("turf_host_ip", targetHost);

        const protocol = window.location.protocol.startsWith("http") ? window.location.protocol : "http:";
        return `${protocol}//${targetHost}${currentPath}client.html?room=${this.roomCode}`;
    }

    // Copies the room invitation link
    async copyInvitationLink(targetBtn) {
        if (!this.roomCode) return;
        const url = this.getInvitationUrl();
        const copyTxt = window.I18n ? window.I18n.t("common.copyLink") : "📋 Copy Link";
        const copiedTxt = window.I18n ? window.I18n.t("common.linkCopied") : "✓ Copied!";
        const promptLabel = window.I18n ? window.I18n.t("common.invitationLinkPrompt") : "Invitation Link:";

        try {
            await navigator.clipboard.writeText(url);
            if (targetBtn) {
                targetBtn.innerText = copiedTxt;
                targetBtn.style.borderColor = "#86efac";
                targetBtn.style.color = "#86efac";
                setTimeout(() => {
                    targetBtn.innerText = copyTxt;
                    targetBtn.style.borderColor = "#855327";
                    targetBtn.style.color = "#ffd54f";
                }, 2000);
            }
        } catch (e) {
            prompt(promptLabel, url);
        }
    }

    // Updates active room code
    setRoomCode(code) {
        this.roomCode = code;
        if (this.roomCodeDisplay) this.roomCodeDisplay.value = code;
        this.refreshQrCode();
    }

    // Sets the room code
    setHeaderRoomCode(code) {
        if (!this.headerRoomCode) return;
        this.headerRoomCode.innerText = code;
    }

    // Generates a visual QR code
    refreshQrCode() {
        if (!this.roomCode || !this.qrcodeContainer) return;
        const generatedUrl = this.getInvitationUrl();

        this.qrcodeContainer.innerHTML = "";
        if (typeof QRCode !== "undefined") {
            new QRCode(this.qrcodeContainer, {
                text: generatedUrl,
                width: 170,
                height: 170,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    }

    // Renders connected players
    renderPlayerList(container, players) {
        if (!container) return;
        container.innerHTML = "";
        const kickLabel = window.I18n ? window.I18n.t("common.kick") : "KICK";

        players.forEach(p => {
            const li = document.createElement("li");
            li.className = "player-chip";
            li.innerHTML = `
                <div style="display:flex; align-items:center;">
                    <span class="color-dot" style="background-color: ${p.color};"></span>
                    <span>${p.name} ($${p.money})</span>
                </div>
                <button class="btn-kick">${kickLabel}</button>
            `;
            const kickBtn = li.querySelector(".btn-kick");
            kickBtn.onclick = () => {
                if (this.callbacks.onKickPlayer) this.callbacks.onKickPlayer(p.id);
            };
            container.appendChild(li);
        });
    }

    // Refreshes player count counters
    updatePlayersUI(players, maxPlayers) {
        if (this.playerCountLabel) {
            this.playerCountLabel.innerText = `${players.length} / ${maxPlayers}`;
        }
        this.renderPlayerList(this.playersListContainer, players);
        this.renderPlayerList(this.activeGamePlayersList, players);
    }
}

window.HostLobby = HostLobby;
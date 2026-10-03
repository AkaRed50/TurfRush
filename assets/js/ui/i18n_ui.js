// Binds localized strings to UI elements across views

class UiI18nBinder {
    // Sets element inner text
    static setText(id, key, params = {}) {
        const el = document.getElementById(id);
        if (el && window.I18n) {
            el.innerText = window.I18n.t(key, params);
        }
    }

    // Sets input placeholder attribute
    static setPlaceholder(id, key, params = {}) {
        const el = document.getElementById(id);
        if (el && window.I18n) {
            el.placeholder = window.I18n.t(key, params);
        }
    }

    // Sets element title attribute
    static setTitle(id, key, params = {}) {
        const el = document.getElementById(id);
        if (el && window.I18n) {
            el.title = window.I18n.t(key, params);
        }
    }

    // Applies translations to portal screen
    static applyPortalTexts() {
        if (!window.I18n) return;
        UiI18nBinder.setText("portalTitle", "portal.title");
        UiI18nBinder.setText("portalSub", "portal.subtitle");
        UiI18nBinder.setText("btnHost", "portal.hostBtn");
        UiI18nBinder.setText("portalDivider", "portal.divider");
        UiI18nBinder.setText("lblRoomInput", "portal.roomCodeLabel");
        UiI18nBinder.setPlaceholder("roomInput", "portal.roomCodePlaceholder");
        UiI18nBinder.setText("lblNameInput", "portal.playerNameLabel");
        UiI18nBinder.setPlaceholder("nameInput", "portal.playerNamePlaceholder");
        UiI18nBinder.setText("btnJoinSubmit", "portal.joinBtn");
    }

    // Applies translations to host view
    static applyHostTexts() {
        if (!window.I18n) return;

        UiI18nBinder.setText("lobbyTitleTxt", "host.lobby.title");
        UiI18nBinder.setText("lobbySubtitleTxt", "host.lobby.subtitle");
        UiI18nBinder.setText("lblRoomCode", "host.lobby.roomCode");
        UiI18nBinder.setText("lblHostIp", "host.lobby.hostIp");
        UiI18nBinder.setText("lblMaxPlayers", "host.lobby.maxPlayers");
        UiI18nBinder.setText("optPlayers2", "host.lobby.playersOption", { count: 2 });
        UiI18nBinder.setText("optPlayers4", "host.lobby.playersOption", { count: 4 });
        UiI18nBinder.setText("optPlayers6", "host.lobby.playersOption", { count: 6 });
        UiI18nBinder.setText("optPlayers8", "host.lobby.playersOptionOfficial", { count: 8 });
        UiI18nBinder.setText("lblInitialMoney", "host.lobby.initialMoney");
        UiI18nBinder.setText("lblAllowDebt", "host.lobby.allowDebt");
        UiI18nBinder.setText("optDebtNo", "host.lobby.debtNo");
        UiI18nBinder.setText("optDebtYes", "host.lobby.debtYes");
        UiI18nBinder.setText("lblGameMode", "host.lobby.gameMode");
        UiI18nBinder.setText("optThemeWestern", "host.lobby.modeWestern");
        UiI18nBinder.setText("optThemeUma", "host.lobby.modeUma");
        UiI18nBinder.setText("lblLanguage", "host.lobby.language");
        UiI18nBinder.setText("scanQrLabel", "host.lobby.scanQr");
        UiI18nBinder.setText("btnCopyLobbyLink", "common.copyLink");
        UiI18nBinder.setText("lblConnectedPlayers", "host.lobby.connectedPlayers");
        UiI18nBinder.setText("btnStartLobby", "host.lobby.openRoomBtn");

        UiI18nBinder.setText("umaSetupTitle", "host.umaSetup.title");
        UiI18nBinder.setText("umaSetupSubtitle", "host.umaSetup.subtitle");
        UiI18nBinder.setText("btnUmaRandomizeAll", "host.umaSetup.rollAll");
        UiI18nBinder.setTitle("btnUmaRandomizeAll", "host.umaSetup.rollAllTitle");
        UiI18nBinder.setText("btnUmaCancelSetup", "host.umaSetup.backLobby");
        UiI18nBinder.setText("btnUmaConfirmSetup", "host.umaSetup.confirmStart");

        UiI18nBinder.setText("btnCopyInGameLink", "common.copyLink");

        UiI18nBinder.setTitle("optSpeedSlow", "host.speed.slow");
        UiI18nBinder.setTitle("optSpeedNormal", "host.speed.normal");
        UiI18nBinder.setTitle("optSpeedFast", "host.speed.fast");
        UiI18nBinder.setTitle("optSpeedFrenetic", "host.speed.frenetic");

        UiI18nBinder.setText("btnPlayersList", "host.players");

        UiI18nBinder.setTitle("btnStart", "host.startRace");
        UiI18nBinder.setTitle("btnPause", "host.pause");
        UiI18nBinder.setTitle("btnStep", "host.rollDice");
        UiI18nBinder.setTitle("btnReset", "host.reset");

        UiI18nBinder.setText("lblLastRoll", "host.lastRoll");
        UiI18nBinder.setText("lblTurfChronicle", "host.turfChronicle");
        UiI18nBinder.setText("modalManagePlayersTitle", "host.managePlayersTitle");
        UiI18nBinder.setText("btnClosePlayersModal", "common.close");
        UiI18nBinder.setText("btnResumeResults", "host.viewResults");
    }

    // Applies translations to client view
    static applyClientTexts() {
        if (!window.I18n) return;

        UiI18nBinder.setText("modalTitleTxt", "client.modalTitle");
        UiI18nBinder.setText("modalSubtitleTxt", "client.modalSubtitle");
        UiI18nBinder.setPlaceholder("clientRoomCode", "client.codePlaceholder");
        UiI18nBinder.setPlaceholder("clientPlayerName", "client.namePlaceholder");
        UiI18nBinder.setText("btnConnect", "client.connectBtn");

        UiI18nBinder.setText("overlayTitle", "client.waitingStartTitle");
        UiI18nBinder.setText("overlaySubtitle", "client.betsOpenFirstMove");

        UiI18nBinder.setText("payoutModalTitle", "client.payoutModal.title");
        UiI18nBinder.setText("lblPayoutBreakdown", "client.payoutModal.breakdown");
        UiI18nBinder.setText("lblPayoutLeaderboard", "client.payoutModal.leaderboard");
        UiI18nBinder.setText("btnPayoutModalClose", "client.payoutModal.closeBtn");
        UiI18nBinder.setText("btnOpenStandingsModal", "client.topBtn");

        UiI18nBinder.setText("interactiveModalTitle", "client.cardsModal.exoticTitle");
        UiI18nBinder.setText("interactiveModalSub", "client.cardsModal.exoticDesc");
        UiI18nBinder.setText("cardsModalTitle", "client.cardsModal.vipTitle");
        UiI18nBinder.setText("cardsModalDesc", "client.cardsModal.vipDesc");
        UiI18nBinder.setText("btnCardsModalClose", "common.close");

        UiI18nBinder.setText("lblPropBetsHeader", "client.propBetsHeader");
        UiI18nBinder.setText("sideTitleBlue", "client.sideBets.blueWins");
        UiI18nBinder.setText("sideTitleOrange", "client.sideBets.orangeWins");
        UiI18nBinder.setText("sideTitleRed", "client.sideBets.redWins");
        UiI18nBinder.setText("sideTitleBlack", "client.sideBets.sevenFails");

        UiI18nBinder.setText("hdrColShow", "client.headers.show");
        UiI18nBinder.setText("hdrColPlace", "client.headers.place");
        UiI18nBinder.setText("hdrColWin", "client.headers.win");
        UiI18nBinder.setText("hdrColHorse", "client.headers.horse");

        UiI18nBinder.setText("btnOpenExotic", "client.bottomCards.exotic");
        UiI18nBinder.setText("cardRound1", "client.bottomCards.race1");
        UiI18nBinder.setText("cardRound2", "client.bottomCards.race2");
        UiI18nBinder.setText("cardRound3", "client.bottomCards.race3");
        UiI18nBinder.setText("cardRound4", "client.bottomCards.race4");
        UiI18nBinder.setText("cardRound5", "client.bottomCards.race5");
        UiI18nBinder.setText("cardVIP", "client.bottomCards.vip");
    }
}

window.UiI18nBinder = UiI18nBinder;
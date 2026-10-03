// WebRTC peer-to-peer connection and messaging manager

class P2PManager {
    constructor(isHost = false, options = {}) {
        this.isHost = isHost;
        this.options = options;
        this.peer = null;
        this.connections = new Map();
        this.hostConn = null;
        this.playerColors = [
            "#3b82f6", "#ea580c", "#ef4444", "#10b981", 
            "#a855f7", "#eab308", "#f1f5f9", "#64748b"
        ];

        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onDataReceived = null;
        this.onConnectedToHost = null;
        this.onDisconnectedFromHost = null;
        this.onRoomFull = null;
        this.onError = null;
    }

    // Returns STUN server options
    getPeerConfig() {
        return {
            debug: 1,
            config: {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun1.l.google.com:19302" }
                ]
            }
        };
    }

    // Starts host PeerJS listener
    initHost(roomCode) {
        const cleanCode = roomCode.replace(/[^A-Z0-9]/g, "");
        const peerId = `TRUSH_${cleanCode}`;

        if (this.peer) this.peer.destroy();

        this.peer = new Peer(peerId, this.getPeerConfig());

        this.peer.on("open", (id) => {
            if (this.options.onOpen) this.options.onOpen(id);
        });

        this.peer.on("connection", (conn) => {
            const setupHostConn = () => {
                conn.on("data", (data) => this.handleHostIncomingData(conn, data));
            };

            if (conn.open) setupHostConn();
            else conn.on("open", setupHostConn);

            conn.on("close", () => {
                const player = this.connections.get(conn.peer);
                if (player) {
                    this.connections.delete(conn.peer);
                    if (this.onPlayerLeft) this.onPlayerLeft(player.info);
                    this.broadcast(NetEvents.PLAYER_LEFT, { playerId: conn.peer });
                }
            });

            conn.on("error", (err) => {
                if (this.onError) this.onError(err);
            });
        });

        this.peer.on("error", (err) => {
            if (this.onError) this.onError(err);
        });
    }

    // Disconnects player by ID
    kickPlayer(playerId) {
        if (!this.isHost) return;
        const pConn = this.connections.get(playerId);
        if (pConn && pConn.conn && pConn.conn.open) {
            pConn.conn.send({ type: NetEvents.KICKED });
            setTimeout(() => {
                pConn.conn.close();
                this.connections.delete(playerId);
                if (this.onPlayerLeft) this.onPlayerLeft(pConn.info);
                this.broadcast(NetEvents.PLAYER_LEFT, { playerId: playerId });
            }, 500);
        }
    }

    // Processes host inbound packets
    handleHostIncomingData(conn, data) {
        if (!data || typeof data !== "object") return;

        if (data.type === NetEvents.JOIN_REQUEST) {
            if (this.connections.size >= (this.options.maxPlayers || 8)) {
                conn.send({ type: NetEvents.ROOM_FULL });
                return;
            }

            let playerInfo;
            if (this.connections.has(conn.peer)) {
                playerInfo = this.connections.get(conn.peer).info;
            } else {
                const defaultName = window.I18n ? window.I18n.t("common.defaultPlayerName") : "Gambler";
                const assignedColor = this.playerColors[this.connections.size % this.playerColors.length];
                playerInfo = {
                    id: conn.peer,
                    name: data.name || defaultName,
                    color: assignedColor,
                    money: this.options.initialMoney || 0
                };
                this.connections.set(conn.peer, { conn, info: playerInfo });
                if (this.onPlayerJoined) this.onPlayerJoined(playerInfo);
            }

            const gameAlreadyStarted = this.options.isGameStarted ? this.options.isGameStarted() : false;
            const betsAreOpen = this.options.getBetState ? this.options.getBetState() : false;

            conn.send({
                type: NetEvents.JOIN_ACCEPTED,
                player: playerInfo,
                config: this.options.roomConfig,
                gameStarted: gameAlreadyStarted,
                betsOpen: betsAreOpen
            });

            this.broadcast(NetEvents.PLAYER_LIST_UPDATE, this.getPlayersList());
            return;
        }

        if (this.onDataReceived) this.onDataReceived(conn.peer, data);
    }

    // Connects client to host
    initClient(roomCode, playerName) {
        const cleanCode = roomCode.replace(/[^A-Z0-9]/g, "");
        const targetHostId = `TRUSH_${cleanCode}`;

        if (this.peer) this.peer.destroy();

        this.peer = new Peer(this.getPeerConfig());

        this.peer.on("open", () => {
            let joined = false;
            let joinTimer = null;

            const setupChannel = (channel) => {
                channel.on("data", (data) => {
                    if (!data) return;
                    if (data.type === NetEvents.JOIN_ACCEPTED) {
                        joined = true;
                        if (joinTimer) clearInterval(joinTimer);
                        if (this.onConnectedToHost) this.onConnectedToHost(data.player, data.config, data.gameStarted, data.betsOpen);
                    } else if (data.type === NetEvents.ROOM_FULL) {
                        joined = true;
                        if (joinTimer) clearInterval(joinTimer);
                        const fullMsg = window.I18n ? window.I18n.t("common.alertRoomFull") : "The room is full.";
                        alert(fullMsg);
                        if (this.onRoomFull) this.onRoomFull();
                    } else if (this.onDataReceived) {
                        this.onDataReceived(data);
                    }
                });

                channel.on("close", () => {
                    if (joinTimer) clearInterval(joinTimer);
                    if (this.onDisconnectedFromHost) this.onDisconnectedFromHost();
                });

                channel.on("error", (err) => {
                    if (joinTimer) clearInterval(joinTimer);
                    if (this.onError) this.onError(err);
                });
            };

            this.hostConn = this.peer.connect(targetHostId, { reliable: true });
            setupChannel(this.hostConn);

            this.peer.on("connection", (inboundConn) => {
                this.hostConn = inboundConn;
                setupChannel(inboundConn);
            });

            const sendJoin = () => {
                if (this.hostConn && this.hostConn.open && !joined) {
                    this.hostConn.send({ type: NetEvents.JOIN_REQUEST, name: playerName });
                }
            };

            if (this.hostConn.open) sendJoin();
            else this.hostConn.on("open", sendJoin);

            joinTimer = setInterval(() => {
                if (!joined) {
                    if (this.hostConn && this.hostConn.open) {
                        sendJoin();
                    } else {
                        this.hostConn = this.peer.connect(targetHostId, { reliable: true });
                        setupChannel(this.hostConn);
                    }
                } else clearInterval(joinTimer);
            }, 1000);
        });

        this.peer.on("error", (err) => {
            if (this.onError) this.onError(err);
        });
    }

    // Sends packet to clients
    broadcast(type, payload) {
        if (!this.isHost) return;
        const message = { type, payload };
        this.connections.forEach(({ conn }) => {
            if (conn && conn.open) {
                try { conn.send(message); } catch (e) {}
            }
        });
    }

    // Sends packet to host
    sendToHost(type, payload) {
        if (this.hostConn && this.hostConn.open) {
            try { this.hostConn.send({ type, payload }); } catch (e) {}
        }
    }

    // Returns connected player objects
    getPlayersList() {
        const list = [];
        this.connections.forEach(({ info }) => list.push(info));
        return list;
    }
}

window.P2PManager = P2PManager;
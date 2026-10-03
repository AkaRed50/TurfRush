// Synthesizes procedural Web Audio sound effects

class SoundFXManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.volume = 0.5;
        this.customAudioBuffers = new Map();
    }

    // Initializes or resumes context
    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    // Toggles audio muting
    setMuted(muted) {
        this.isMuted = muted;
    }

    // Updates master volume level
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // Plays dice roll rattle
    playDiceRoll() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "square";
            osc.frequency.setValueAtTime(140 + Math.random() * 80, now + i * 0.05);

            gain.gain.setValueAtTime(this.volume * 0.18, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.04);
        }
    }

    // Plays starting gate fanfare
    playStartGateFanfare() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { f: 523.25, t: 0.00, d: 0.12 },
            { f: 659.25, t: 0.12, d: 0.12 },
            { f: 783.99, t: 0.24, d: 0.12 },
            { f: 1046.50, t: 0.36, d: 0.30 }
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(note.f, now + note.t);

            gain.gain.setValueAtTime(this.volume * 0.32, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });
    }

    // Plays red line bell
    playRedLineBell() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [880, 1760];

        freqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(this.volume * 0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 1.2);
        });
    }

    // Plays chip placement drop
    playChipBet() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

        gain.gain.setValueAtTime(this.volume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    // Plays winning register chime
    playCashRegister() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(this.volume * 0.25, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.18);
        });
    }

    // Plays penalty buzzer sound
    playBuzzerPenalty() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.25);

        gain.gain.setValueAtTime(this.volume * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    // Plays race victory fanfare
    playFinishFanfare() {
        if (this.isMuted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [
            { f: 440.00, t: 0.0, d: 0.15 },
            { f: 554.37, t: 0.15, d: 0.15 },
            { f: 659.25, t: 0.30, d: 0.15 },
            { f: 880.00, t: 0.45, d: 0.45 }
        ];

        notes.forEach(note => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(note.f, now + note.t);

            gain.gain.setValueAtTime(this.volume * 0.35, now + note.t);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + note.d);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + note.t);
            osc.stop(now + note.t + note.d);
        });
    }
}

window.SFX = new SoundFXManager();
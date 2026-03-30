// AudioEngine.js - Yazeed
// Responsible for: core audio playback, state management, analysis signals, beat scheduling
// Exposes playback state to be read and controlled by platform
//
// HOW TO USE (for AudioController.js):
//
//   const engine = new AudioEngine();
//
//   engine.setAudioSource(file, metadata);   // load an audio file (HTML5 File object)
//   engine.play();                            // start playback + beat scheduler
//   engine.pause();                           // pause playback + beat scheduler
//   engine.seek(time);                        // seek to time in seconds
//   engine.getPlaybackState();               // returns { playing, currentTime, duration }
//   engine.setPlaybackState({...});          // force-set playback state (for sync)
//   engine.syncToTimeline(time);             // sync engine to an external timeline time
//   engine.getAnalysisData();               // returns { frequencyData, timeDomainData, bufferLength }
//   engine.getBassAndMid();                 // returns { bass, mid } normalized 0–1 (matches MAGE shader inputs)
//   engine.getMetadata();                   // returns attached metadata object
//   engine.attachMetadata(meta);            // attach/update metadata; applies offset + restarts beat scheduler
//   engine.onBeat(callback);               // subscribe to beat events fired at the BPM rate
//   engine.getMediaElement();               // returns the raw HTMLAudioElement (for WaveSurfer)
//   engine.getAudioContext();              // returns the Web Audio API AudioContext
//   engine.getSourceNode();               // returns the MediaElementSourceNode

class AudioEngine {
    constructor() {
        this._audio = new Audio();
        this._metadata = null;

        // Web Audio API setup for analysis signals
        this._audioCtx = null;
        this._analyser = null;
        this._source = null;
        this._analysisConnected = false;

        // Beat scheduler — fires callbacks at the BPM rate while playing
        this._beatCallbacks = [];
        this._beatInterval  = null;
    }

    // ── Internal ────────────────────────────────────────────────────────────

    // Lazily create and connect the Web Audio API analyser.
    // Must be called after a user gesture (browser autoplay policy).
    _connectAnalyser() {
        if (this._analysisConnected) return;
        const w = /** @type {any} */ (window);
        const AudioCtx = w.AudioContext || w.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this._audioCtx) {
            this._audioCtx = new AudioCtx();
        }
        if (this._audioCtx.state === 'suspended') {
            this._audioCtx.resume();
        }
        this._source = this._audioCtx.createMediaElementSource(this._audio);
        this._analyser = this._audioCtx.createAnalyser();
        // fftSize 256 → 128 usable frequency bins, enough for a smooth spectrum.
        // Bass (bin 2) and mid (bin 4) match MAGE's shader convention.
        this._analyser.fftSize = 256;
        this._source.connect(this._analyser);
        this._analyser.connect(this._audioCtx.destination);
        this._analysisConnected = true;
    }

    // Start the beat interval based on current metadata BPM.
    // Each tick fires all registered beat callbacks.
    _startBeatScheduler() {
        this._stopBeatScheduler();
        const bpm = this._metadata && this._metadata.bpm;
        if (!bpm || bpm <= 0) return;
        const intervalMs = (60 / bpm) * 1000;
        this._beatInterval = setInterval(() => {
            if (this._audio.paused) return;
            const payload = { bpm, currentTime: this._audio.currentTime };
            this._beatCallbacks.forEach(cb => cb(payload));
        }, intervalMs);
    }

    _stopBeatScheduler() {
        if (this._beatInterval) {
            clearInterval(this._beatInterval);
            this._beatInterval = null;
        }
    }

    // ── Source ──────────────────────────────────────────────────────────────

    // Load an audio file into the engine.
    // Pass null to clear the current file.
    // metadata is optional: { title, artist, bpm, key, genre, offset }
    setAudioSource(file, metadata = null) {
        this._stopBeatScheduler();
        if (this._audio.src) {
            URL.revokeObjectURL(this._audio.src);
            this._audio.src = '';
        }
        this._metadata = metadata || null;
        if (!file) return;
        this._audio.src = URL.createObjectURL(file);
        this._audio.load();
    }

    // ── Playback ────────────────────────────────────────────────────────────

    // Start playing audio and the beat scheduler.
    play() {
        this._connectAnalyser();
        const result = this._audio.play();
        this._startBeatScheduler();
        return result;
    }

    // Pause audio and stop the beat scheduler.
    pause() {
        this._audio.pause();
        this._stopBeatScheduler();
    }

    // Seek to a specific time in seconds.
    seek(time) {
        if (typeof time !== 'number') return;
        const duration = this._audio.duration;
        if (!duration || isNaN(duration)) return;
        this._audio.currentTime = Math.max(0, Math.min(time, duration));
    }

    // Returns the current playback state.
    // { playing: bool, currentTime: number, duration: number }
    getPlaybackState() {
        const state = {
            playing: !this._audio.paused,
            currentTime: this._audio.currentTime,
        };
        if (this._audio.duration && !isNaN(this._audio.duration)) {
            state.duration = this._audio.duration;
        }
        return state;
    }

    // Force the engine into a specific playback state (for sync).
    // Pass: { playing: boolean, currentTime: number }
    setPlaybackState({ playing, currentTime }) {
        if (typeof currentTime === 'number') {
            this._audio.currentTime = currentTime;
        }
        if (playing && this._audio.paused) {
            this._audio.play();
        } else if (!playing && !this._audio.paused) {
            this._audio.pause();
        }
    }

    // Sync to an external performance timeline (master clock).
    // Tolerance of 0.3s avoids micro-seeks during normal drift.
    syncToTimeline(externalTime) {
        if (typeof externalTime !== 'number') return;
        const diff = Math.abs(this._audio.currentTime - externalTime);
        if (diff > 0.3) {
            this.seek(externalTime);
        }
    }

    // ── Analysis ────────────────────────────────────────────────────────────

    // Returns real-time frequency + waveform data.
    // Returns null if the analyser is not yet connected (call play() first).
    getAnalysisData() {
        if (!this._analyser) return null;
        const bufferLength = this._analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        const timeDomainData = new Uint8Array(bufferLength);
        this._analyser.getByteFrequencyData(frequencyData);
        this._analyser.getByteTimeDomainData(timeDomainData);
        return { frequencyData, timeDomainData, bufferLength };
    }

    // Returns { bass, mid } normalized 0–1.
    // Bin indices match MAGE's shader system (bin 2 = bass, bin 4 = mid).
    getBassAndMid() {
        if (!this._analyser) return null;
        const data = new Uint8Array(this._analyser.frequencyBinCount);
        this._analyser.getByteFrequencyData(data);
        return {
            bass: data[2] / 255,
            mid:  data[4] / 255,
        };
    }

    // ── Metadata ────────────────────────────────────────────────────────────

    // Attach or update metadata. Merges with existing metadata.
    // Automatically:
    //   - Restarts the beat scheduler if BPM changed
    //   - Seeks to offset if offset is provided
    // Example: engine.attachMetadata({ bpm: 128, key: 'Am', offset: 30 })
    attachMetadata(meta) {
        this._metadata = Object.assign({}, this._metadata || {}, meta);

        // BPM changed — restart beat scheduler to match new tempo
        if ('bpm' in meta) {
            if (!this._audio.paused) {
                this._startBeatScheduler();
            }
        }

        // Offset provided — seek playback to that position
        if ('offset' in meta && typeof meta.offset === 'number') {
            this.seek(meta.offset);
        }
    }

    // Returns the full metadata object.
    // { title, artist, bpm, key, genre, offset, preset: { minimizing_factor, ... } }
    getMetadata() {
        return this._metadata;
    }

    // ── Beat subscription ───────────────────────────────────────────────────

    // Subscribe to beat events fired at the BPM rate.
    // callback receives: { bpm, currentTime }
    // Returns an unsubscribe function.
    // Example:
    //   const stop = engine.onBeat(({ bpm, currentTime }) => console.log('beat', bpm));
    //   stop(); // unsubscribe
    onBeat(callback) {
        this._beatCallbacks.push(callback);
        return () => {
            this._beatCallbacks = this._beatCallbacks.filter(cb => cb !== callback);
        };
    }

    // ── Accessors ───────────────────────────────────────────────────────────

    // Returns the underlying HTMLAudioElement (for WaveSurfer).
    getMediaElement() {
        return this._audio;
    }

    // Returns the Web Audio API AudioContext (share with external visualizers).
    getAudioContext() {
        return this._audioCtx;
    }

    // Returns the MediaElementSourceNode (share with external visualizers).
    getSourceNode() {
        return this._source;
    }

    // Load audio from a URL (e.g. Supabase storage link).
    setAudioUrl(url) {
        this._audio.src = url;
        this._audio.load();
    }
}

export default AudioEngine;

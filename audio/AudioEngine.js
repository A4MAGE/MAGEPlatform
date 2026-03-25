// AudioEngine.js - Yazeed
// Responsible for: core audio playback, state management, analysis signals
// Exposes playback state to be read and controlled by platform
//
// HOW TO USE (for AudioController.js):
//
//   const engine = new AudioEngine();
//
//   engine.setAudioSource(file, metadata);   // load an audio file (HTML5 File object)
//   engine.play();                            // start playback
//   engine.pause();                           // pause playback
//   engine.seek(time);                        // seek to time in seconds
//   engine.getPlaybackState();               // returns { playing, currentTime, duration }
//   engine.setPlaybackState({...});          // force-set playback state (for sync)
//   engine.syncToTimeline(time);             // sync engine to an external timeline time
//   engine.getAnalysisData();               // returns { frequencyData, timeDomainData, bufferLength }
//   engine.getBassAndMid();                 // returns { bass, mid } normalized 0–1 (matches MAGE shader inputs)
//   engine.getMetadata();                   // returns attached metadata object
//   engine.attachMetadata(meta);            // attach/update metadata without reloading file
//   engine.getMediaElement();               // returns the raw HTMLAudioElement (for WaveSurfer)

class AudioEngine {
    constructor() {
        this._audio = new Audio();
        this._metadata = null;

        // Web Audio API setup for analysis signals
        this._audioCtx = null;
        this._analyser = null;
        this._source = null;
        this._analysisConnected = false;
    }

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
        // fftSize 64 → 32 usable frequency bins.
        // Matches MAGE's shader system: bass at bin 2, mid at bin 4.
        this._analyser.fftSize = 64;
        this._source.connect(this._analyser);
        this._analyser.connect(this._audioCtx.destination);
        this._analysisConnected = true;
    }

    // Load an audio file into the engine.
    // Pass null to clear the current file.
    // metadata is optional: { title, artist, bpm, key, genre, offset }
    setAudioSource(file, metadata = null) {
        // Clean up the previous file's memory before loading a new one
        if (this._audio.src) {
            URL.revokeObjectURL(this._audio.src);
            this._audio.src = '';
        }
        this._metadata = metadata || null;
        if (!file) return;
        this._audio.src = URL.createObjectURL(file);
        this._audio.load();
    }

    // Start playing audio
    play() {
        this._connectAnalyser();
        return this._audio.play();
    }

    // Pause audio
    pause() {
        this._audio.pause();
    }

    // Seek to a specific time in seconds.
    // Example: engine.seek(30) jumps to 0:30
    seek(time) {
        if (typeof time !== 'number') return;
        const duration = this._audio.duration;
        if (!duration || isNaN(duration)) return;
        this._audio.currentTime = Math.max(0, Math.min(time, duration));
    }

    // Returns the current playback state.
    // Example return value: { playing: true, currentTime: 12.4, duration: 240.0 }
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

    // Force the engine into a specific playback state.
    // Useful for syncing the UI with the engine.
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

    // Sync engine playback position to an external performance timeline.
    // Any master clock (video, DAW transport, etc.) can push time here.
    // Tolerance of 0.3s avoids micro-seeks during normal drift.
    syncToTimeline(externalTime) {
        if (typeof externalTime !== 'number') return;
        const diff = Math.abs(this._audio.currentTime - externalTime);
        if (diff > 0.3) {
            this.seek(externalTime);
        }
    }

    // Returns real-time audio analysis data from the Web Audio API AnalyserNode.
    // Returns null if the analyser is not yet connected (call play() first).
    // frequencyData: amplitude per frequency bin (Uint8Array, 0–255), 32 bins at fftSize 64
    // timeDomainData: raw waveform samples (Uint8Array, 0–255, 128 = silence)
    getAnalysisData() {
        if (!this._analyser) return null;
        const bufferLength = this._analyser.frequencyBinCount;
        const frequencyData = new Uint8Array(bufferLength);
        const timeDomainData = new Uint8Array(bufferLength);
        this._analyser.getByteFrequencyData(frequencyData);
        this._analyser.getByteTimeDomainData(timeDomainData);
        return { frequencyData, timeDomainData, bufferLength };
    }

    // Returns bass and mid frequency values normalized to 0–1.
    // Matches the exact bin indices used by MAGE's shader system:
    //   bass → bin 2 (low frequencies)
    //   mid  → bin 4 (mid frequencies)
    // Returns null if the analyser is not yet connected (call play() first).
    getBassAndMid() {
        if (!this._analyser) return null;
        const data = new Uint8Array(this._analyser.frequencyBinCount);
        this._analyser.getByteFrequencyData(data);
        return {
            bass: data[2] / 255,
            mid:  data[4] / 255,
        };
    }

    // Attach or update metadata without reloading the audio file.
    // Merges with existing metadata.
    // Example: engine.attachMetadata({ bpm: 128, key: 'Am' })
    attachMetadata(meta) {
        this._metadata = Object.assign({}, this._metadata || {}, meta);
    }

    // Returns the metadata passed into setAudioSource or attachMetadata.
    // Example: { title: "song.mp3", artist: "...", bpm: 120, key: "Am", genre: "...", offset: 0 }
    getMetadata() {
        return this._metadata;
    }

    // Returns the underlying HTMLAudioElement.
    // Used by external renderers (e.g. WaveSurfer) to share the same audio source.
    getMediaElement() {
        return this._audio;
    }
}

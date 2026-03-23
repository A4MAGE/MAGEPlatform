// AudioEngine.js - Yazeed
// Responsible for: core audio playback, state management
// Exposes playback state to be read and controlled by platform
//
// HOW TO USE (for AudioController.js):
//
//   const engine = new AudioEngine();
//
//   engine.setAudioSource(file);         // load an audio file (HTML5 File object)
//   engine.play();                        // start playback
//   engine.pause();                       // pause playback
//   engine.getPlaybackState();            // returns { playing, currentTime, duration }
//   engine.setPlaybackState({...});       // force-set playback state (for sync)

class AudioEngine {
    constructor() {
        this._audio = new Audio();
        this._metadata = null;
    }

    // Load an audio file into the engine.
    // Pass null to clear the current file.
    // metadata is optional: { title, bpm, offset }
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
        return this._audio.play();
    }

    // Pause audio
    pause() {
        this._audio.pause();
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

    // Returns the metadata passed into setAudioSource, if any.
    // Example: { title: "song.mp3", bpm: 120, offset: 0 }
    getMetadata() {
        return this._metadata;
    }
}

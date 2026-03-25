// AudioController.js - Gladys
// Responsible for: platform-side commands (load, play, pause, seek, metadata, analysis)
// Sends commands to AudioEngine, reads back playback state

class AudioController {
    constructor(engine) {
        // engine is the AudioEngine instance passed in from the platform
        this.engine = engine;
        this._analysisCallback = null;
        this._analysisFrameId = null;
    }

    loadAudio(file) {
        if (!file) throw new Error("file loading error");
        return this.engine.setAudioSource(file);
    }

    play() {
        // plays audio unless already playing
        const state = this.getState();
        if (state.playing) {
            return;
        }
        return this.engine.play();
    }

    pause() {
        // pauses audio when playing
        const state = this.getState();
        if (state.playing) {
            this.engine.pause();
        } else {
            return;
        }
    }

    // Seek to a specific time in seconds.
    seek(time) {
        this.engine.seek(time);
    }

    // Sync to an external timeline (master clock).
    // Call this repeatedly from your timeline's tick/update loop.
    syncToTimeline(externalTime) {
        this.engine.syncToTimeline(externalTime);
    }

    // Attach metadata to the currently loaded audio.
    // Example: controller.attachMetadata({ bpm: 128, key: 'Am', artist: 'Name' })
    attachMetadata(meta) {
        this.engine.attachMetadata(meta);
    }

    getMetadata() {
        return this.engine.getMetadata();
    }

    getState() {
        return this.engine.getPlaybackState();
        // returns: { playing: true/false, currentTime: 12.4, duration: 240.0 }
    }

    // Returns a single snapshot of analysis data.
    // { frequencyData: Uint8Array, timeDomainData: Uint8Array, bufferLength: number }
    getAnalysis() {
        return this.engine.getAnalysisData();
    }

    // Returns { bass, mid } normalized 0–1.
    // These are the exact values MAGE's shader system consumes to drive visuals.
    getBassAndMid() {
        return this.engine.getBassAndMid();
    }

    // Subscribe to continuous analysis data on every animation frame.
    // callback receives: { frequencyData, timeDomainData, bufferLength }
    // Returns a stop function — call it to unsubscribe.
    // Example:
    //   const stop = controller.onAnalysis(data => console.log(data.frequencyData));
    //   stop(); // when done
    onAnalysis(callback) {
        this._analysisCallback = callback;
        const tick = () => {
            const data = this.engine.getAnalysisData();
            if (data && this._analysisCallback) {
                this._analysisCallback(data);
            }
            this._analysisFrameId = requestAnimationFrame(tick);
        };
        this._analysisFrameId = requestAnimationFrame(tick);

        return () => {
            this._analysisCallback = null;
            if (this._analysisFrameId) {
                cancelAnimationFrame(this._analysisFrameId);
                this._analysisFrameId = null;
            }
        };
    }
}

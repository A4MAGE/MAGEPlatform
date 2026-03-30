// AudioController.js - Gladys
// Responsible for: platform-side commands (load, play, pause, seek, metadata, analysis, beat)
// Sends commands to AudioEngine, reads back playback state

class AudioController {
    constructor(engine) {
        this.engine = engine;
        this._analysisCallback = null;
        this._analysisFrameId  = null;
    }

    // ── Source ──────────────────────────────────────────────────────────────

    loadAudio(file) {
        if (!file) throw new Error('loadAudio: file is required');
        return this.engine.setAudioSource(file);
    }

    // ── Playback ────────────────────────────────────────────────────────────

    play() {
        const state = this.getState();
        if (state.playing) return;
        return this.engine.play();
    }

    pause() {
        const state = this.getState();
        if (state.playing) this.engine.pause();
    }

    seek(time) {
        this.engine.seek(time);
    }

    // Sync to an external timeline (master clock).
    syncToTimeline(externalTime) {
        this.engine.syncToTimeline(externalTime);
    }

    getState() {
        return this.engine.getPlaybackState();
        // returns: { playing: bool, currentTime: number, duration: number }
    }

    // ── Metadata ────────────────────────────────────────────────────────────

    // Attach or update metadata on the current track.
    // Automatically applies offset (seeks) and restarts beat scheduler if BPM changed.
    // Example: controller.attachMetadata({ title: 'Song', bpm: 128, offset: 10 })
    attachMetadata(meta) {
        this.engine.attachMetadata(meta);
    }

    getMetadata() {
        return this.engine.getMetadata();
    }

    // Load a preset JSON and extract its audio-processing parameters.
    // Does NOT load an audio file — call loadAudio(file) separately.
    // Returns { minimizing_factor, power_factor, base_speed, easing_speed, volume_multiplier }
    loadPreset(preset) {
        if (!preset || typeof preset !== 'object') {
            throw new Error('loadPreset: preset must be a JSON object');
        }
        if (!preset.intent) {
            throw new Error('loadPreset: preset is missing required "intent" block');
        }

        const intent = preset.intent;
        const state  = preset.state || {};

        const audioParams = {
            minimizing_factor: intent.minimizing_factor,
            power_factor:      intent.power_factor,
            base_speed:        intent.base_speed,
            easing_speed:      intent.easing_speed,
            time_multiplier:   intent.time_multiplier  ?? 1,
            volume_multiplier: state.volume_multiplier ?? 0,
        };

        this.engine.attachMetadata({ preset: audioParams });
        return audioParams;
    }

    // ── Analysis ────────────────────────────────────────────────────────────

    // Single snapshot: { frequencyData, timeDomainData, bufferLength }
    getAnalysis() {
        return this.engine.getAnalysisData();
    }

    // { bass, mid } normalized 0–1 — direct inputs for MAGE shaders.
    getBassAndMid() {
        return this.engine.getBassAndMid();
    }

    // Subscribe to continuous analysis on every animation frame.
    // callback receives: { frequencyData, timeDomainData, bufferLength }
    // Returns a stop function.
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

    // ── Beat ────────────────────────────────────────────────────────────────

    // Subscribe to beat events fired at the BPM rate set in metadata.
    // callback receives: { bpm, currentTime }
    // Returns an unsubscribe function.
    // Example:
    //   const stop = controller.onBeat(({ bpm }) => console.log('beat at', bpm, 'BPM'));
    //   stop();
    onBeat(callback) {
        return this.engine.onBeat(callback);
    }

    // Load audio from a URL (e.g. Supabase storage link).
    loadFromUrl(url) {
        this.engine.setAudioUrl(url);
    }
}

export default AudioController;

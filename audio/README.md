# Engine Audio Control Interface

Implemented by Yazeed & Gladys for Issue #5 — Audio Playback Controls.

## What's Done vs. What's Left

| File | Owner | Status | Notes |
|------|-------|--------|-------|
| `AudioEngine.js` | Yazeed | Done | Core audio engine — fully implemented |
| `AudioControls.html` | Yazeed & Gladys | Done | Play/pause UI — fully implemented |
| `AudioController.js` | Gladys | **To do** | See instructions below |

---

## AudioController.js — Gladys

### What is this file and why does it exist?

Think of it like a remote control.

- `AudioEngine.js` is the actual audio player — it knows how to load a song, play it, pause it, and track how far along it is.
- The React app (the website) needs a way to talk to that player.
- `AudioController.js` is what sits in the middle — it receives instructions from the website and passes them to the audio player.

You are not building the audio player. That's already done. You are just building the remote control that connects the website to it.

---

### What you need to write

Create a class in `AudioController.js` with these four actions:

| Method | What it should do |
|--------|-------------------|
| `loadAudio(file)` | Tell the engine which audio file to use |
| `play()` | Tell the engine to start playing |
| `pause()` | Tell the engine to pause |
| `getState()` | Ask the engine what it's currently doing and return that |

---

### How to do it — copy this and fill it in

```js
// AudioController.js - Gladys
// Responsible for: platform-side commands (load, play, pause)
// Sends commands to AudioEngine, reads back playback state

class AudioController {
    constructor(engine) {
        // engine is the AudioEngine instance passed in from the platform
        this.engine = engine;
    }

    loadAudio(file) {
        this.engine.setAudioSource(file);
    }

    play() {
        this.engine.play();
    }

    pause() {
        this.engine.pause();
    }

    getState() {
        return this.engine.getPlaybackState();
        // returns: { playing: true/false, currentTime: 12.4, duration: 240.0 }
    }
}
```

That's the whole file. Each method is one line that calls the engine.

---

### How the website will use your controller

Once you're done, the website will use it like this:

```js
const engine = new AudioEngine();
const controller = new AudioController(engine);

controller.loadAudio(file);   // load a song
controller.play();             // play it
controller.pause();            // pause it
controller.getState();         // check what's happening
```

---

## Folder Structure

```
audio/
├── README.md               ← this file
├── AudioEngine.js          ← core audio engine (done)
├── AudioController.js      ← platform-side controller (Gladys)
└── ui/
    └── AudioControls.html  ← play/pause UI (done)
```

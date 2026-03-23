# Engine Audio Control Interface

Implemented by Yazeed & Gladys for Issue #5 — Audio Playback Controls.

## What's Done vs. What's Left

| File | Owner | Status | Notes |
|------|-------|--------|-------|
| `AudioEngine.js` | Yazeed | Done | Core audio engine — fully implemented |
| `AudioControls.html` | Yazeed & Gladys | Done | Play/pause UI — fully implemented |
| `AudioController.js` | Gladys | **To do** | See instructions below |

---

## Gladys — What You Need to Do

You only need to fill in `AudioController.js`. The engine is already built and ready for you to use.

### How to use the engine

```js
const engine = new AudioEngine();

// 1. Load an audio file (you get this from a file input or from the platform)
engine.setAudioSource(file);

// 2. Play and pause
engine.play();
engine.pause();

// 3. Read back the current state (useful for updating the UI)
const state = engine.getPlaybackState();
// state = { playing: true/false, currentTime: 12.4, duration: 240.0 }

// 4. Force-set the state (useful for syncing with the platform)
engine.setPlaybackState({ playing: false, currentTime: 0 });
```

### What AudioController.js should do

Your controller sits between the platform and the engine. It should:

1. Accept a file from the platform and pass it to `engine.setAudioSource(file)`
2. Expose a `play()` method the platform can call → calls `engine.play()`
3. Expose a `pause()` method the platform can call → calls `engine.pause()`
4. Expose a `getState()` method the platform can call → returns `engine.getPlaybackState()`

That's it. Keep it simple — just pass commands through to the engine.

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

## Feature Overview

- Platform tells the engine what audio file to use
- Platform can play / pause
- Engine exposes playback state to be read and controlled by platform

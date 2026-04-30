# Brandon Meeting Summary

---

## 1. Big Picture

Brandon is refactoring the shader engine to give the **frontend full control** over UI and parameters, replacing his current hacky DOM-manipulation approach (which literally grabs DOM elements and re-appends them elsewhere).

---

## 2. Engine Architecture Changes

### 2.1 Controls Object
- All parameters will be extracted into a **separate `Controls` object**, decoupled from the engine.
- Frontend can plug in its own UI and feed values directly into the engine.

### 2.2 Engine Modes

| Mode            | Behavior                                              | Use Case        |
| --------------- | ----------------------------------------------------- | --------------- |
| `controls: on`  | Editable parameters + mouse rotation enabled          | Editor view     |
| `controls: off` | Locked — no parameter changes, no camera movement     | Live broadcast  |

---

## 3. Home Page Previews

| State          | Behavior                                           |
| -------------- | -------------------------------------------------- |
| Default        | Show static thumbnail                              |
| On hover       | Spin up temporary engine → live 3-second preview   |

Goal: visual preview without tanking performance.

---

## 4. Shareable Links — Fork Model

- **One preset = one owner.**
- Recipients of a shared link can **view** but not directly edit.
- A **"Copy"** button forks the preset into the recipient's account, then opens it in the editor.

---

## 5. Current Status & Known Issues

| Item                                   | Status                                        |
| -------------------------------------- | --------------------------------------------- |
| New npm package                        | Implemented on the site                       |
| Tube shader + copy shader (edit view)  | Disabled — hacky workaround                   |
| Randomize button                       | Disabled — risk of picking tube shader        |
| Unload error with `controls: on`       | Known bug → fix coming in next controls update|

---

## 6. Next Steps (Brandon)

1. Extract all parameters into a standalone `Controls` object, separate from the engine.
2. Build the hover-preview mechanism for home page thumbnails.
3. Ship the controls update that resolves the unload error.

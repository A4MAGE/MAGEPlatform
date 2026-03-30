# MAGE Platform
This is the repository for team A4 MAGE in CS410 Section 1 for the Spring 2026 Semester at UMass Boston!

At this stage, this repository will be updated with each team members work, and by the end of the semester a full working application will be present here.

---

## Contributors

### Yazeed — `./audio/`
Audio engine and player UI. Contains the core audio processing logic, controller, and browser-based player interface.

### Jason — `./platform/`
Authentication system and MAGE engine integration. Full React app with user sign-in, sign-up, and the visual engine component.

### Roni — `./homepage/`
Main homepage and landing page. React app with navigation, header, and the entry point for the platform.

### Amanda — `./search/` and `./database/`
- `./search/` — Search bar feature with mock data and test page
- `./database/` — SQL schema and database structure for the platform

---

## Structure

```
MAGEPlatform/
├── audio/        ← Yazeed  — audio engine & player UI
├── platform/     ← Jason   — authentication & MAGE engine (React app)
├── homepage/     ← Roni    — main homepage (React app)
├── search/       ← Amanda  — search bar feature
└── database/     ← Amanda  — SQL schema
```

---

## Notes
- For audio feature details, see [`audio/README.md`](audio/README.md)
- Each folder is self-contained — work within your own folder and open a PR when ready

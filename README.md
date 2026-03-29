# DepthCrunch

DepthCrunch is a browser-based spatial packaging demo that turns a flat cereal box into a head-tracked 3D portal. The current prototype mixes MediaPipe-style facial landmark tracking (loaded via TensorFlow.js) and an off-axis Three.js camera to fake holographic depth on any phone or tablet. Runtime code now lives under `src/` (config, scene, tracking, UI, utils) and is bootstrapped from `index.html` via native ES modules, keeping all logic on-device while nginx serves the bundle.

## Current Experience Highlights
- **Kitchen-grade set dressing** — The Three.js scene now renders a warm morning kitchen with tiled backsplash, under-cabinet glow, counter props, and fruit bowl shadows to ground the cereal box in a believable space.
- **Multi-brand showcase** — Alongside DepthCrunch, prototype boxes for Kellogg Studio and General Grains sit on the counter to illustrate how the spec kit can be re-skinned for partner brands.
- **Responsive head movement** — Off-axis math now applies non-linear gain, reduced smoothing, and depth-aware scaling so small head motions translate into noticeable parallax without jitter.
- **Glassy UI shell** — Permission overlays, status pills, and the preview feed adopt a glossy, professional HUD treatment suitable for executive demos and Spec Kit documentation.

## Purpose & Intent
- **Experiment in spatial packaging:** Show how consumer goods can borrow retail visualization tricks (e.g., [icurtis1/off-axis-sneaker](https://github.com/icurtis1/off-axis-sneaker)) to create novel breakfast-table interactions.
- **Self-contained PWA reference:** Prove the stack works entirely on-device with no backend so it can be embedded on QR-enabled packaging.
- **Launchpad for Spec Kit builds:** Supply a minimal scene that Spec Kit developers can extend into calibrated, brand-ready experiences.

## What Needs Rework
1. **Calibration + UX** — Borrow the screen-measurement wizard from off-axis-sneaker so the stored `localStorage` values reflect the viewer’s actual setup.
2. **Tracking pipeline** — MediaPipe still runs inside `requestAnimationFrame`; isolate it to a Web Worker so inference spikes never stall render.
3. **Asset pipeline** — Establish an `/assets` directory and lightweight bundler (Vite/Rollup) before introducing large textures, shaders, or audio.
4. **Content modularity** — Variant metadata should move into JSON/Spec Kit data so brand swaps don’t touch rendering code.
5. **Automated coverage** — Expand Vitest beyond config helpers (math utilities, pose transforms) and integrate CI hooks for lint/test.

## Spec Kit Development Checklist
Follow this spec when rebuilding the experience as part of a Spec Kit deliverable:
- **Module layout:** `src/scene/`, `src/tracking/`, `src/ui/`, `public/` (PWA manifest + static assets). Use Vite or a comparable bundler for hot reloads.
- **Type safety:** Author code in TypeScript with strict mode enabled; emit ES modules that the Docker stage bundles via esbuild.
- **Design tokens:** Parameterize colors, typography, and easing curves so brand teams can reskin the overlay without touching logic.
- **Calibration flow:** Prompt for screen width/height, viewing distance, and store the result. Re-run only when users reset settings.
- **Instrumentation:** Log meaningful metrics (permission granted, tracking locked, session duration) behind a privacy-safe toggle for future studies.
- **Docs:** Update `AGENTS.md` + Spec Kit README to reflect new commands, dependencies, and manual test cases.

## Local Development
```bash
# install JS toolchain (once)
npm install

# lint / tests
npm run lint
npm run test:run

# quick preview without Docker (relies on CDN fallback for Three.js)
python3 -m http.server 8080

# production-faithful run
docker build -t depthcrunch .
docker run --rm -p 8080:8080 depthcrunch
```
Then open `http://localhost:8080`, allow camera access, and move your head to validate parallax, props, and overlays.

## Similar Work & Inspiration
- [icurtis1/off-axis-sneaker](https://github.com/icurtis1/off-axis-sneaker) — reference implementation of the same head-coupled perspective technique with calibration and modular loops.
- Google MediaPipe FaceMesh samples — baseline for the facial landmark tracker the project intends to integrate.
- Johnny Lee's Wii head tracking demo — foundational concept for off-axis projection used here.

DepthCrunch aims to merge those ideas into a Spec Kit-ready template for spatial packaging teams.

## Credits
Developed by Eduardo Arana.

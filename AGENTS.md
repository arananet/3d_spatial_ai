# Repository Guidelines

## Project Structure & Module Organization
Runtime bootstraps from `index.html`, but core logic now lives under `src/` (`config`, `scene`, `tracking`, `ui`, `utils`). `manifest.json`/`icon.svg` define the PWA shell, while `PRODUCT_CONCEPT.md` documents the physical–digital story. Deployment plumbing lives in `Dockerfile` (bundles `three.min.js`, copies `src/`, templates nginx) and `railway.json` (Dockerfile builder + health checks). Add future media or shader files under `assets/` (and reference them relatively) so nginx serves them statically.

## Build, Test, and Development Commands
- `npm install` — install ESLint, Vitest, and any future Spec Kit dependencies.
- `npm run lint` / `npm run test:run` — run the lightweight checks before committing.
- `python3 -m http.server 8080` — static preview at `http://localhost:8080`; CDN fallbacks provide Three.js.
- `docker build -t depthcrunch .` then `docker run --rm -p 8080:8080 depthcrunch` — production-faithful container.
- `railway up` — deploy through Railway using the checked-in `railway.json` config.

## Coding Style & Naming Conventions
JavaScript runs as native ES modules under `src/`; keep files focused (config math vs. scene building vs. UI). Prefer `const`/`let`, camelCase identifiers (`loadThreeJs`, `extractPose`), and terse helpers so render/update loops stay legible. CSS selectors remain lowercase with hyphenated ids/classes, inline styles stay compact, and comments should only clarify math or projection constants.

## Testing Guidelines
Automated coverage is minimal (Vitest config helpers), so still lean on exploratory passes. After each change confirm the permission overlay appears and dismisses cleanly, the status pill walks through Loading → Seek → On, tracking re-centers after roughly two seconds off-frame, the hint banner hides once tracking is stable, and nginx still emits the `Permissions-Policy` header. Use dev tools network throttling to ensure the CDN fallbacks for Three.js engage without errors.

## Commit & Pull Request Guidelines
History favors short imperative summaries that mention the subsystem (`Fix Dockerfile: bundle Three.js`, `Serve Three.js from Railway`). Keep subjects under ~70 characters and add body details only when necessary. Pull requests should describe the user-facing impact, outline technical changes, and list manual test notes (browser + device). Link Railway deploy logs or related issues, and attach screenshots or recordings for UI or motion tweaks.

## Security & Configuration Tips
Camera access requires HTTPS plus the nginx `Permissions-Policy` header—never strip it. Treat inference as on-device; document any new network calls in `PRODUCT_CONCEPT.md` and guard them behind explicit user consent. Keep secrets in Railway variables, set safe defaults in Docker ENV/CMD, and avoid logging raw camera frames or face landmark data to the console.

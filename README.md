# SteelStruct India (Phase 1 MVP)

Mobile-first, offline-capable PWA for **preliminary** steel quantity and cost estimating of sheds and light steel structures (India). Plain HTML/JS — no build step, no backend, no secrets.

> **Disclaimer:** Phase 1 produces estimates only. It does **not** perform IS 800 member checks, IS 875 load calculations, truss analysis or stability checks, and must not be used as a design or approval. Review by a qualified engineer is required.

## Feature status
| Feature | Status |
|---|---|
| Responsive PWA, offline after first load | Implemented |
| Project info, geometry, 3 m / 6 m eaves presets (input only) | Implemented |
| Section library: search, custom, CSV import + validation | Implemented |
| ISMB/ISMC masses | Partial — **unverified**, check IS 808 / catalogue or import your own CSV |
| Angles/SHS/RHS/CHS/flat/bar | Geometric estimate (ignores radii/fillets for angle/SHS/RHS) |
| Member + plate schedules, roof/wall area, BOQ, cost (user rates), CSV export | Implemented |
| ISWB/ISHB/T/built-up/purlins/bolts/weld consumables, drawing register, erection checklist | Planned |
| IS 875 loads, truss solver, IS 800 checks, shed stability | Planned (Phases 2–3) |
| Auth, cloud storage, FastAPI/PostgreSQL | Planned (Phase 5) |

Rates, paint area per MT, fastener density, cut allowance and scrap % are **user inputs**; blanks are reported as "missing", never silently assumed.

## Run locally
```
npm test          # 19 engine unit tests (Node 22, no dependencies)
npm start         # serves the folder (or open index.html via any static server)
```
Service workers need `http://localhost` or HTTPS. On a phone: open the hosted URL → "Add to Home screen".

## Deploy (GitHub Pages)
Repo → Settings → Pages → Deploy from branch → `main` / root.

## Layout
`engine.js` (calculations, no UI) · `sections.js` (seed data) · `index.html` (UI) · `sw.js`, `manifest.webmanifest` · `tests/` · `examples/` · `.github/workflows/ci.yml`

## Known limitations
Data lives in browser local storage (export JSON to back up). Code editions in the register are not yet verified against BIS. No LICENSE chosen yet — add one before sharing.

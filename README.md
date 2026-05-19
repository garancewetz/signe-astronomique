# True Cosmic Sign

> A web cockpit that computes your **true astronomical sign** — the constellation the Sun was actually in when you were born, using IAU 1930 boundaries, equinox precession, and Ophiuchus as the 13th sign.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?logo=typescript&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white) ![CesiumJS](https://img.shields.io/badge/CesiumJS-1.140-4caf50) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss&logoColor=white) ![License: MIT](https://img.shields.io/badge/license-MIT-green)

![Signe astronomique — cockpit](public/og-image.png)

**Live demo:** <https://signe-astronomique.netlify.app/>

---

## What it does

The app renders a Cesium 3D scene centered on Earth, surrounded by a geocentric celestial sphere: the Sun, the Moon, the planets, the full Hipparcos star catalog with clickable constellations, a handful of historic relic satellites (ISS, Hubble, Sputnik, …) and — optionally — the entire active orbital population, propagated in real time via SGP4.

Every body is pickable. Selecting one opens a HUD panel and unlocks two complementary visualizations:

- **Side view** — camera perpendicular to the Earth → constellation axis, with a graduated distance ruler in light-years.
- **Depth view** — the constellation "exploded" so each star sits at its real distance, making the depth disparity legible at a glance.

A natal report is rendered alongside the 3D view: ascendant constellation, planetary positions, and the 360° ecliptic radar with IAU angular sizes.

## Why it matters

Mainstream astrology uses the **tropical zodiac**, a fiction frozen ~2000 years ago. Because of equinox precession, your tropical "sign" no longer matches the constellation the Sun was in when you were born. This project does the actual sidereal computation — RA/Dec in J2000, then epoch correction — and projects the Sun's position onto the IAU 1930 constellation boundaries. Most people end up with a different sign than their horoscope, and many fall into Ophiuchus.

## Tech stack

- **[Vite 8](https://vite.dev)** + **[React 19](https://react.dev)** + **TypeScript 6**
- **[CesiumJS 1.140](https://cesium.com/platform/cesiumjs/)** (via `vite-plugin-cesium`) for the 3D scene
- **[satellite.js](https://github.com/shashwatak/satellite.js)** for SGP4 propagation (ECI → ECEF)
- **[Framer Motion](https://www.framer.com/motion/)** for the HUD
- **[lucide-react](https://lucide.dev)** for rail icons
- **[html2canvas-pro](https://github.com/yorickshan/html2canvas-pro)** for the PDF report capture
- **[Tailwind v4](https://tailwindcss.com)** (`@tailwindcss/vite`)
- **[tz-lookup](https://github.com/darkskyapp/tz-lookup)** for timezone resolution from coordinates

No Cesium Ion token is required: imagery is served from NASA GIBS (Blue Marble + VIIRS Black Marble), and `Ion.defaultAccessToken = ''` prevents the default Bing fetch.

## Run locally

```bash
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # type-check + production bundle
npm run preview  # serve the local production bundle
npm run lint
```

**Browser support:** modern Chrome / Firefox / Safari with WebGL2. The PNG export uses `preserveDrawingBuffer: true` on the Cesium viewer.

**Bundle size:** the production bundle is large (~860 kB / ~266 kB gzipped) — Cesium dominates. This is a deliberate trade-off: the app's value is the 3D scene, and Cesium is loaded eagerly so the cockpit hydrates fully on first paint.

## Architecture

```
src/
├── App.tsx                       minimal entry point
├── main.tsx                      bootstrap + dev-tools signature banner
├── components/
│   ├── Cockpit.tsx               main container (form state, orchestration, sidebar layout)
│   ├── HudFrame.tsx              cockpit frame (decorative overlays)
│   ├── AnalysisModal.tsx         tabbed modal hosting the four report views
│   ├── BodyInfoHud.tsx           HUD shown when a body is selected
│   ├── LegendPanel.tsx           orbital population legend (categories, counts, retry)
│   ├── RadarWheel.tsx            360° ecliptic radar (IAU angular sizes)
│   ├── MissionLog.tsx            report cards (BirthHeader, AscendantCard, PlanetTable, …)
│   ├── CityAutocomplete.tsx      Nominatim autocomplete
│   ├── CoordinatesForm.tsx       date / time / location form
│   ├── RightPanel.tsx            report panel bodies (Resume / Carte / Lecture / Donnees)
│   ├── ExploreSpacePopover.tsx   sky-reading panel (legacy / mobile)
│   ├── Tooltip.tsx               portal tooltip (anti-clipping)
│   ├── sidebar/                  unified left rail + dockable console
│   │   ├── Sidebar.tsx                    main aside, layer chips, analysis CTA
│   │   ├── SidebarHeader.tsx              brand + collapse toggle
│   │   ├── SidebarItem.tsx                chip / button row primitive
│   │   ├── SidebarSection.tsx             section header + dividers
│   │   ├── SystemDock.tsx                 pinned bottom dock (fullscreen, exports)
│   │   └── types.ts                       SidebarPanelKey / ReportPanelKey
│   ├── mobile/                   mobile cockpit (bottom sheet, drawers, tab bar)
│   │   ├── MobileCockpit.tsx              mobile-first container
│   │   ├── MobileTabBar.tsx               bottom tab bar (analysis / coords / system)
│   │   ├── MobileAnalysisStack.tsx        stacked report sections on small screens
│   │   ├── MobileCoordinatesModal.tsx     date / time / location modal
│   │   ├── MobileSystemDrawer.tsx         system controls drawer
│   │   ├── MobileSheetContent.tsx         body-info sheet content
│   │   └── BottomSheet.tsx                gesture-driven sheet primitive
│   ├── space/
│   │   ├── SpaceView.tsx                  Cesium Viewer + camera + lifecycle + body picker
│   │   └── cesium/
│   │       ├── mountStarsLayer.ts         every star in the Hipparcos catalog, pickable
│   │       ├── mountPlanetsLayer.ts
│   │       ├── mountMoonLayer.ts
│   │       ├── mountSunLayer.ts           Cesium disk + pick entity
│   │       ├── mountSatellitesLayer.ts    relics (ISS, Hubble, Sputnik, …)
│   │       ├── mountOrbitalLayer.ts       full active orbital population
│   │       ├── mountReferenceLines.ts     ecliptic, equator, meridian
│   │       ├── mountObserverMarker.ts     "you are here" marker on the globe
│   │       ├── mountSelectedConstellation.ts  highlighted pattern of the chosen constellation
│   │       ├── mountExplodedConstellation.ts  stars at their real distance (depth view)
│   │       ├── mountDistanceRuler.ts      light-year graduated ruler (side view)
│   │       ├── bodies/                    IAU radii + proportional visual ellipsoid
│   │       ├── sideView.ts                side ↔ Earth camera toggle
│   │       ├── skyVector.ts               RA/Dec → celestial-sphere Cartesian
│   │       ├── useBodyPicker.ts           click → entity hook with type guards on payloads
│   │       └── cameraDirector.ts          flyTo helpers
│   └── ui/                       shared primitives
│       ├── Button.tsx / IconButton.tsx
│       ├── Input.tsx / Field.tsx
│       ├── PanelShell.tsx / DockedPanel.tsx / PanelPlaceholder.tsx
│       ├── HudCard.tsx / Surface.tsx / MenuRow.tsx
│       ├── surfaceClasses.ts              shared HUD surface tokens
│       └── cn.ts                          tailwind-merge wrapper
├── hooks/
│   ├── useGeolocation.ts
│   ├── useMobileLayout.ts
│   ├── usePortalTarget.ts
│   ├── useSatelliteTracker.ts    relics → Cesium entities
│   └── useOrbitalPopulation.ts   Celestrak fetch (15 typed groups + Starlink supplemental)
├── utils/
│   ├── astroEngine.ts            IAU boundaries, RA/Dec → constellation projection
│   ├── planetEngine.ts           planetary ephemerides
│   ├── skyCoordinates.ts         ICRS ↔ ECEF conversions, celestial sphere
│   ├── constellationLore.ts      French / Latin names, mythology, education copy
│   ├── timezone.ts               tz-lookup → birth time → UTC
│   └── exportReport.ts           canvas capture + PDF
├── data/
│   ├── constellations.json       Hipparcos catalog (stars + pattern lines)
│   ├── constellationCatalog.ts   typed JSON loader
│   ├── orbitalCategories.ts      Celestrak group palette + labels
│   └── satellitesDB.ts           relic TLEs (Sputnik, Telstar, ISS, Hubble, …)
└── types/                        ambient .d.ts
```

**Module boundaries**

- `src/utils/` is framework-agnostic: no React imports, no DOM access. All the astronomical machinery (`astroEngine`, `planetEngine`, `skyCoordinates`) lives here.
- The Cesium dependency is walled off: no `import 'cesium'` outside `src/components/space/`. Sibling components that need to act on the scene go through the imperative `SpaceViewHandle` exposed via `ref`.
- Each `mountX(viewer, …)` factory returns its own teardown function. `SpaceView`'s effects chain those cleanups, so every entity, interval and primitive created is destroyed on unmount — no WebGL context leaks.

## Cesium layers

- **Stars / Planets / Moon / Sun / ReferenceLines / ObserverMarker** — entities placed on a celestial sphere at ~100 AU (star radius scaled by magnitude), or on the globe for the observer marker.
- **SelectedConstellation / ExplodedConstellation / DistanceRuler** — overlays that highlight the chosen constellation. The exploded variant places each star on a logarithmic shell so the real distance disparities become visible (educational view).
- **Satellites Layer (relics)** — ISS, Hubble, Starlink-0, propagated each frame via `CallbackProperty`.
- **Orbital Layer** — `PointPrimitiveCollection` batch, up to 4 000 active satellites, propagated once per second via `setInterval` (decoupled from the render loop). Color, size and label come from [`src/data/orbitalCategories.ts`](src/data/orbitalCategories.ts) — a single source of truth shared with the HUD legend.

## Sidebar and panels

The main UI sits on a unified [`Sidebar`](src/components/sidebar/Sidebar.tsx) — a single left aside that hosts the coordinates form, an analysis CTA that opens the [`AnalysisModal`](src/components/AnalysisModal.tsx), a flat grid of display-layer chips, and a pinned [`SystemDock`](src/components/sidebar/SystemDock.tsx). The Cesium canvas inset shifts with the sidebar's collapsed / expanded width — no camera math, just a viewport change that triggers automatic recentering.

Selecting a body via click opens [`BodyInfoHud`](src/components/BodyInfoHud.tsx) as a floating panel. When the selection is a star, the sidebar's **side-view** chip activates — toggling it flips the Cesium camera into the perpendicular side view (and, paired with the radar, exposes the **depth view**).

## Body picker

[`useBodyPicker`](src/components/space/cesium/useBodyPicker.ts) listens for `LEFT_CLICK` on the viewer and reads the `PropertyBag` attached by each mount layer to its pickable entities. Payloads (`StarPayload`, `SunPayload`, `PlanetPayload`, `MoonPayload`) are validated by type guards before being lifted into `SelectedBody` in `SpaceView` — no casts, no `any`.

## Live orbital toggle

Activated through the `[ORBITAL]` button in the display panel. **Off by default** to keep the astrological reading legible.

- **Modern Clutter** (default) — every active satellite today.
- **Historical View** (`[NAISSANCE]`, visible when a natal reading is active) — only satellites launched on or before the birth year. Filtered from the TLE international designator.

[`useOrbitalPopulation`](src/hooks/useOrbitalPopulation.ts) fetches 15 Celestrak groups in parallel (`stations`, `weather`, `gps-ops`, `galileo`, `glo-ops`, `beidou`, `geo`, `intelsat`, `ses`, `iridium-NEXT`, `oneweb`, `science`, …) plus the supplemental Starlink feed. It deliberately avoids `GROUP=active` (~5 MB, IP-blacklisted within a few hits). `Promise.allSettled` isolates failures: a rate-limited group doesn't break the rest. The result is exposed via `useSyncExternalStore` from a module-level cache — one fetch per session, instant retoggle, no setState-in-effect round-trip.

On a network error the button flips to `[RETRY]`; one click re-runs the fetch via the hook's `retry()`.

## Astronomy notes

- **IAU 1930 boundaries** for the Sun → constellation projection.
- **Sidereal**, not tropical — RA/Dec in J2000 with epoch precession correction. Signs typically differ by one slot from mainstream horoscopes.
- **Ophiuchus** included as the 13th constellation crossed by the ecliptic.
- **Astronomical ascendant** — the constellation rising on the eastern horizon at the birth instant and place, computed from local sidereal time + latitude.

## Export

The camera button captures the WebGL canvas to PNG (hence `preserveDrawingBuffer: true` on the Viewer). The report button generates a PDF summary via [`exportReport.ts`](src/utils/exportReport.ts).

## Conventions

- **English** identifiers, types, exports, comments. Only the UI strings (panel titles, button labels, screen errors) are in French.
- **Exact pinned versions** in `package.json` (no `^` / `~`); `.npmrc` enforces `save-exact=true`.
- No `as` casts, no `eslint-disable`, no stray `console.log` (the dev-tools banner in [`main.tsx`](src/main.tsx) is intentional and labelled as such). `console.warn` / `console.error` reserved for real error paths.
- `mountX.ts` factories always return a cleanup — never mount one without capturing its return.
- Form state that must survive panel close/reopen lives in `Cockpit`, not in the panel.

## Credits

- **IAU 1930 constellation boundaries** — Eugène Delporte, *Délimitation scientifique des constellations*.
- **Hipparcos star catalog** — ESA, public domain.
- **Celestrak** — Dr. T.S. Kelso, [celestrak.org](https://celestrak.org/) — TLEs for the live orbital population.
- **NASA GIBS** — Earth imagery (Blue Marble + VIIRS Black Marble Night Lights).
- **OpenStreetMap / Nominatim** — city geocoding.

## License

[MIT](LICENSE) — © 2026 Garance Wetzel.

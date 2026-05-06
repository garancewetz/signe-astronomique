# Signe astronomique

Cockpit web qui calcule **le vrai signe astronomique** d'une personne — la constellation où le Soleil se trouvait *réellement* à sa naissance, selon les frontières IAU, en intégrant la précession des équinoxes et le 13ᵉ signe (Ophiuchus).

L'app rend une scène 3D Cesium centrée sur la Terre + sphère céleste géocentrique : Soleil, Lune, planètes du système solaire, constellations, satellites reliques (ISS, Hubble, premier Starlink) et — en option — la population orbitale active complète propagée en temps réel via SGP4.

## Stack

- **Vite 8** + **React 19** + **TypeScript**
- **Cesium 1.140** (via `vite-plugin-cesium`) pour la scène 3D
- **satellite.js** pour la propagation SGP4 (ECI → ECEF)
- **Framer Motion** pour le HUD
- **Tailwind v4** (`@tailwindcss/vite`)

## Lancer en local

```bash
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # type-check + bundle prod
npm run preview  # serve le bundle prod local
npm run lint
```

Aucun token Cesium Ion n'est requis : l'imagerie passe par NASA GIBS (Blue Marble + VIIRS Black Marble) et `baseLayer: false` empêche le fetch par défaut de Bing.

## Architecture

```
src/
├── App.tsx               point d'entrée minimal
├── components/
│   ├── Cockpit.tsx       container principal (état du formulaire, orchestration)
│   ├── ControlConsole.tsx HUD bas (toggles, exports, légende)
│   ├── HudFrame.tsx      cadre cockpit (overlays décoratifs)
│   ├── ExploreSpacePopover.tsx  panneau lecture du ciel
│   ├── space/
│   │   ├── SpaceView.tsx       Viewer Cesium + caméra + cycle de vie
│   │   └── cesium/
│   │       ├── mountStarsLayer.ts
│   │       ├── mountPlanetsLayer.ts
│   │       ├── mountMoonLayer.ts
│   │       ├── mountSatellitesLayer.ts   relics (ISS, Hubble, Starlink-0)
│   │       ├── mountOrbitalLayer.ts      population active complète
│   │       ├── mountReferenceLines.ts
│   │       └── cameraDirector.ts         flyTo helpers
│   └── ui/               primitives partagées (Button, Field, cn, …)
├── hooks/
│   ├── useCockpitAudio.ts
│   ├── useGeolocation.ts
│   ├── useSatelliteTracker.ts    relics → entités Cesium
│   └── useOrbitalPopulation.ts   fetch Celestrak (15 groupes typés + Starlink supplemental)
├── utils/                fonctions pures (astro, géo, export, timezone)
├── data/                 catalogues statiques (constellations, satellites, palette orbitale)
└── types/                .d.ts ambiants
```

Frontières du module Cesium : aucun `import 'cesium'` hors de `src/components/space/`. Les composants frères qui ont besoin d'agir sur la scène passent par le `SpaceViewHandle` impératif exposé en `ref`.

Frontière des utils : `src/utils/` reste framework-agnostique — pas d'import React, pas d'accès DOM. C'est aussi là que vit toute la machinerie astronomique (`astroEngine.ts`, `planetEngine.ts`, `skyCoordinates.ts`).

## Couches Cesium

Chaque couche est une factory `mountX(viewer, …): () => void` qui retourne sa fonction de teardown. Les `useEffect` du `SpaceView` les appellent en cascade et chaînent les cleanups, ce qui garantit que **chaque entité, intervalle ou primitive créés sont détruits au démontage** — pas de fuite de contexte WebGL.

- **Stars / Planets / Moon / ReferenceLines** : entités sur sphère céleste à 100 AU.
- **Satellites Layer (relics)** : ISS, Hubble, Starlink-0, propagation SGP4 chaque trame via `CallbackProperty`.
- **Orbital Layer** : `PointPrimitiveCollection` batch, jusqu'à 4 000 sats actifs, propagés une fois par seconde via `setInterval` (découplé du render loop). Couleur, taille et label viennent de [`src/data/orbitalCategories.ts`](src/data/orbitalCategories.ts) — une seule source de vérité partagée avec la légende du HUD.

## Toggle ORBITAL

Activable via le bouton `[ORBITAL]` dans l'AFFICHAGE. OFF par défaut pour garder la lecture astrologique lisible.

- **Modern Clutter** (par défaut) : tous les satellites actifs aujourd'hui.
- **Historical View** (`[NAISSANCE]`, visible quand un thème natal est actif) : seulement les satellites lancés ≤ année de naissance. Filtrage à partir de l'international designator du TLE.

Le `useOrbitalPopulation` fetch en parallèle 15 groupes Celestrak (`stations`, `weather`, `gps-ops`, `galileo`, `glo-ops`, `beidou`, `geo`, `intelsat`, `ses`, `iridium-NEXT`, `oneweb`, `science`, …) + le supplemental Starlink. Pas d'appel à `GROUP=active` (~5 Mo, blacklist IP en quelques hits). `Promise.allSettled` interne : un groupe rate-limité ne casse pas le reste. Cache module-level — un seul fetch par session, retoggle instantané.

En cas d'erreur réseau, le bouton bascule en `[RETRY]` et un seul clic relance le fetch via `retry()` exposé par le hook.

## Conventions

- **Code en anglais** — identifiants, types, exports, commentaires. Seuls les libellés UI sont en français (titres de panneau, labels de boutons, messages d'erreur écran).
- **Versions exactes** dans `package.json` (pas de `^` / `~`). Le `.npmrc` enforce.
- **Pas d'`as` cast**, pas d'`eslint-disable`, pas de `console.log` ; `console.warn`/`console.error` réservés aux chemins d'erreur réels.
- Les fichiers `mountX.ts` retournent toujours leur cleanup — ne jamais en monter un sans capturer son return.
- État de formulaire qui doit survivre à la fermeture/réouverture d'un panneau → vit dans `Cockpit`, pas dans le panneau.

## Astronomie

- **Frontières IAU 1930** pour la projection Soleil → constellation.
- **Précession des équinoxes** : le calcul est sidéral (RA/Dec dans J2000 puis correction d'époque), pas tropical, donc les signes diffèrent généralement d'un cran de l'horoscope grand public.
- **Ophiuchus inclus** comme 13ᵉ constellation traversée par l'écliptique.
- **Ascendant astronomique** : constellation qui se levait à l'horizon est à l'instant et au lieu de naissance, calculée via temps sidéral local + latitude.

## Export

Le bouton appareil photo capture le canvas WebGL en PNG (d'où `preserveDrawingBuffer: true` sur le Viewer). Le bouton rapport génère un PDF récapitulatif via `exportReport.ts`.

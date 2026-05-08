import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
import {
  Cartesian3,
  ClockRange,
  Color,
  Credit,
  ImageryLayer,
  Ion,
  JulianDate,
  PerspectiveFrustum,
  SceneMode,
  ScreenSpaceEventType,
  UrlTemplateImageryProvider,
  Viewer,
  WebMercatorTilingScheme,
} from 'cesium';
import { AU_KM } from '../../utils/skyCoordinates';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import {
  computeReading,
  type CelestialReading,
  type IauConstellation,
} from '../../utils/astroEngine';
import type { PlanetId } from '../../utils/planetEngine';
import { gmstRadians } from '../../utils/skyCoordinates';

import { mountStarsLayer } from './cesium/mountStarsLayer';
import { mountSunLayer } from './cesium/mountSunLayer';
import { mountMoonLayer } from './cesium/mountMoonLayer';
import { mountPlanetsLayer } from './cesium/mountPlanetsLayer';
import { mountReferenceLines } from './cesium/mountReferenceLines';
import { mountSatellitesLayer } from './cesium/mountSatellitesLayer';
import { mountOrbitalLayer } from './cesium/mountOrbitalLayer';
import { mountDistanceRuler } from './cesium/mountDistanceRuler';
import { mountExplodedConstellation } from './cesium/mountExplodedConstellation';
import { mountSelectedConstellation } from './cesium/mountSelectedConstellation';
import { mountObserverMarker } from './cesium/mountObserverMarker';
import {
  captureCameraSnapshot,
  flyToCameraSnapshot,
  flyToSideView,
  type CameraSnapshot,
} from './cesium/sideView';
import { useBodyHover, useBodyPicker, type HoveredBody } from './cesium/useBodyPicker';
import {
  flyToOrbital,
  flyToCelestialDirection,
} from './cesium/cameraDirector';
import { useSatelliteTracker } from '../../hooks/useSatelliteTracker';
import type { OrbitalSat } from '../../hooks/useOrbitalPopulation';

export interface SpaceViewHandle {
  /**
   * Force un render synchrone et retourne le canvas WebGL Cesium courant.
   * Utilisé par l'export PNG (cf. exportTargetedPng). Renvoie null si la
   * vue n'est pas encore montée.
   */
  captureCanvas: () => HTMLCanvasElement | null;
  /** Recadre la caméra sur le Soleil (reading actif). */
  flyToSun: () => void;
  /** Recadre la caméra sur la Lune (reading actif). */
  flyToMoon: () => void;
  /** Replace la caméra en orbite équatoriale par défaut (Terre centrée). */
  flyToEarth: () => void;
}

/**
 * Discriminated union of every clickable body in the scene. Stars carry
 * only a reference into the static catalog; sun/moon/planets carry a
 * snapshot of their dynamic state (constellation, distance, phase…) taken
 * at click time.
 */
export type SelectedBody =
  | SelectedStar
  | SelectedSun
  | SelectedMoon
  | SelectedPlanet;

export interface SelectedStar {
  kind: 'star';
  /** IAU 3-letter constellation abbreviation (e.g. 'Ori'). */
  constellationAbbr: string;
  /** Index of the star inside the catalog's `stars` array. */
  starIndex: number;
}

export interface SelectedSun {
  kind: 'sun';
  name: string;
  constellation: IauConstellation;
  raHours: number;
  decDeg: number;
}

export interface SelectedMoon {
  kind: 'moon';
  name: string;
  constellation: IauConstellation;
  raHours: number;
  decDeg: number;
  distanceKm: number;
  illumination: number;
  phaseName: string;
}

export interface SelectedPlanet {
  kind: 'planet';
  id: PlanetId;
  name: string;
  glyph: string;
  color: string;
  constellation: IauConstellation;
  raHours: number;
  decDeg: number;
  distanceAU: number;
}

interface Props {
  reading: CelestialReading | null;
  /** Affiche axe terrestre, équateur céleste et écliptique. */
  showGuides: boolean;
  /** Étiquettes Soleil / Lune / planètes dans la scène. */
  showBodyLabels: boolean;
  /** Enables the orbital relics layer (historical satellites). */
  showSatellites: boolean;
  /**
   * Full orbital population from useOrbitalPopulation. Empty = overlay off or
   * still loading. The layer handles its own birthYear filtering at mount time.
   */
  orbitalSatellites: OrbitalSat[];
  /**
   * 'modern'     → show all active satellites (Modern Clutter).
   * 'historical' → show only satellites launched ≤ birth year (Historical View).
   * Ignored when reading is null (no natal date to derive birth year from).
   */
  constellationMode: 'modern' | 'historical';
  /**
   * Observer latitude, used for the "live" pre-JUMP sky. Has no impact on
   * body rendering (which is geocentric), but matters for the ascendant
   * and for semantic consistency of `liveReading.input`.
   */
  liveLatitude: number;
  /** Observer longitude (see liveLatitude). */
  liveLongitude: number;
  /**
   * "You are here" marker on the globe. Birth location when a natal reading
   * is set, otherwise the live observer position (form city → navigator
   * geolocation → fallback). Null hides the marker.
   */
  markerLatitude: number | null;
  markerLongitude: number | null;
  markerLabel?: string;
  /** Currently selected body (null = none). */
  selectedBody: SelectedBody | null;
  /** Fires when the user clicks a body or empty space (deselects). */
  onBodySelect: (body: SelectedBody | null) => void;
  /**
   * Side View: flies the camera 90° around the constellation, swaps in
   * the exploded shell + distance ruler, and dims the rest of the sky.
   * No-op unless a star is selected.
   */
  sideViewActive: boolean;
  /** Référence impérative pour le capture-canvas. */
  ref?: Ref<SpaceViewHandle>;
}

// No Ion token: imagery comes from NASA GIBS, terrain from the default
// ellipsoid, and `baseLayer: false` on the Viewer prevents the default
// World Imagery fetch that would otherwise 401.
Ion.defaultAccessToken = '';

// Rafraîchissement de la position des corps "live" avant JUMP.
// La Lune se déplace ~0.5°/h, donc 60 s donne <0.01° d'erreur — invisible.
const LIVE_REFRESH_MS = 60_000;

// Strict temporal gating for the modern Celestrak swarm. Beyond this window
// from "now", current TLEs are no longer accurate (and most of those sats
// didn't exist on a 1990 birth date anyway), so we hide the layer entirely.
export const LIVE_TLE_VALIDITY_MS = 14 * 24 * 60 * 60 * 1000;
// Cinematic transition timings for the JUMP into the past.
const SWARM_FADE_OUT_MS = 800;
const RELICS_FADE_IN_MS = 600;

/**
 * Vue 3D scientifique. Cesium gère :
 *  - le globe Terre (rotation ECEF réelle, texture VIIRS Black Marble)
 *  - une sphère céleste géocentrique en ECEF (rayon 200 000 km)
 *  - les corps mobiles (Soleil, Lune, planètes) à leurs vraies distances
 *
 * Avant JUMP : on affiche un "ciel courant" (Soleil/Lune/planètes à
 * leur position géocentrique du moment, recalculée chaque minute).
 * Au JUMP : on bascule sur le reading natal et on anime la caméra.
 */
export function SpaceView({
  reading,
  showGuides,
  showBodyLabels,
  showSatellites,
  orbitalSatellites,
  constellationMode,
  liveLatitude,
  liveLongitude,
  markerLatitude,
  markerLongitude,
  markerLabel,
  selectedBody,
  onBodySelect,
  sideViewActive,
  ref,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const cleanupsRef = useRef<Array<() => void>>([]);
  const previousReadingRef = useRef<CelestialReading | null>(null);
  // Le reading actuellement rendu (natal ou live), exposé pour les
  // commandes caméra impératives (boutons ☀ ☾ ⊕ de la console).
  const activeReadingRef = useRef<CelestialReading | null>(null);
  const activeGmstRef = useRef<number>(0);
  // Mirror of the `sideViewActive` prop for read-access from the keyboard
  // tick (which is set up once on mount and so cannot close over the prop).
  const sideViewActiveRef = useRef(false);
  useEffect(() => {
    sideViewActiveRef.current = sideViewActive;
  }, [sideViewActive]);

  useImperativeHandle(
    ref,
    () => ({
      captureCanvas: () => {
        const viewer = viewerRef.current;
        if (!viewer) return null;
        // Cesium met le canvas à jour de manière asynchrone ; on force un
        // render pour garantir que le buffer correspond à la frame courante.
        viewer.render();
        return viewer.scene.canvas as HTMLCanvasElement;
      },
      flyToSun: () => {
        const viewer = viewerRef.current;
        const active = activeReadingRef.current;
        if (!viewer || !active) return;
        flyToCelestialDirection(viewer, {
          raHours: active.sunRA,
          decDeg: active.sunDec,
          gmstRad: activeGmstRef.current,
        });
      },
      flyToMoon: () => {
        const viewer = viewerRef.current;
        const active = activeReadingRef.current;
        if (!viewer || !active) return;
        flyToCelestialDirection(viewer, {
          raHours: active.moon.ra,
          decDeg: active.moon.dec,
          gmstRad: activeGmstRef.current,
        });
      },
      flyToEarth: () => {
        const viewer = viewerRef.current;
        if (!viewer) return;
        flyToOrbital(viewer);
      },
    }),
    [],
  );

  // "Live" reading: we keep the current `Date` in state and the reading
  // derives from it + the observer coordinates. Bodies are geocentric so
  // lat/lon only changes the ascendant — we pass them anyway for the
  // semantic consistency of `liveReading.input`.
  const [liveNow, setLiveNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (reading) return; // no need to tick while a natal reading is set
    const id = window.setInterval(
      () => setLiveNow(new Date()),
      LIVE_REFRESH_MS,
    );
    return () => window.clearInterval(id);
  }, [reading]);

  const liveReading = useMemo<CelestialReading>(
    () =>
      computeReading({
        date: liveNow,
        latitude: liveLatitude,
        longitude: liveLongitude,
      }),
    [liveNow, liveLatitude, liveLongitude],
  );

  // Orbital relics: the *date* drives only the launch-date filter (and the
  // silent-era check). The hook returns parsed satrecs; actual SGP4
  // propagation happens inside the layer so live mode can update positions
  // every frame via a CallbackProperty.
  const activeForRelics = reading ?? liveReading;
  const { satellites: trackedSatellites } = useSatelliteTracker({
    selectedDate: activeForRelics.input.date,
    enabled: showSatellites,
  });

  // Strict temporal gating — the modern Celestrak swarm only exists when:
  //  1. We're in live mode (no natal reading set), or
  //  2. The natal date is within ~2 weeks of "now" (TLE validity window).
  // For a 1990 birth date, these satellites either didn't exist yet or our
  // current TLEs would propagate to garbage. Hide them entirely; the user
  // sees only the few historical relics that actually watched their birth.
  // `liveNow` (state) is used instead of Date.now() so the derivation stays
  // pure across renders; it freezes at JUMP time, which is exactly when this
  // comparison matters most.
  const liveSwarmAllowed =
    reading == null ||
    Math.abs(reading.input.date.getTime() - liveNow.getTime()) <
      LIVE_TLE_VALIDITY_MS;
  // True only when the user has just JUMPed into a date too far from now —
  // signals to the relics layer that it should reveal itself with a delay
  // (after the swarm has finished de-materializing).
  const relicsHistoricalReveal = reading != null && !liveSwarmAllowed;

  // 1. Création unique du Viewer
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      sceneMode: SceneMode.SCENE3D,
      // Skip the default Ion World Imagery / Terrain fetch (no token configured;
      // would 401). NASA Blue Marble + VIIRS layers are added explicitly below.
      baseLayer: false,
      // Indispensable pour pouvoir relire le canvas WebGL côté export PNG.
      contextOptions: {
        webgl: { preserveDrawingBuffer: true },
      },
    });

    if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false;
    // Éclairage solaire dynamique : Cesium calcule la direction du Soleil
    // d'après viewer.clock.currentTime (mis à active.input.date plus bas),
    // donc le terminator jour/nuit est correct pour la date de naissance.
    viewer.scene.globe.enableLighting = true;
    // Shadow maps: Earth-on-satellite occlusion. Does not paint lunar craters
    // (those would need a normal map); the moon's terminator comes from its
    // own Lambert shader in mountMoonLayer.
    viewer.shadows = true;
    viewer.scene.globe.shadows = 1; // ShadowMode.ENABLED
    const cockpitBg =
      typeof document !== 'undefined'
        ? getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim() ||
          '#060210'
        : '#060210';
    viewer.scene.backgroundColor = Color.fromCssColorString(cockpitBg);

    // Far frustum: the side-view feature places stars on an expanded
    // shell up to ~800 AU (vs 100 AU in normal mode), and the off-axis
    // camera positions add ~100 AU more. We set the far plane to 1500 AU
    // unconditionally so the universe stays continuous when toggling
    // perspectives — Cesium's logarithmic depth buffer (WebGL2 default)
    // keeps near-globe precision intact across this range.
    if (viewer.camera.frustum instanceof PerspectiveFrustum) {
      viewer.camera.frustum.far = 1500 * AU_KM * 1000;
    }
    viewer.cesiumWidget.creditContainer.setAttribute(
      'style',
      'display:none',
    );

    // Globe jour/nuit : couche jour BlueMarble (couleurs naturelles) +
    // couche nuit VIIRS Black Marble. Cesium module l'alpha selon la
    // direction du Soleil via dayAlpha/nightAlpha quand enableLighting=true,
    // ce qui produit un terminator naturel.
    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.add(
      new ImageryLayer(
        new UrlTemplateImageryProvider({
          url:
            'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/' +
            'BlueMarble_NextGeneration/default/2004-08-01/' +
            'GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
          tilingScheme: new WebMercatorTilingScheme(),
          maximumLevel: 8,
          credit: new Credit('NASA · Blue Marble Next Generation'),
        }),
        { dayAlpha: 1, nightAlpha: 0 },
      ),
    );
    viewer.imageryLayers.add(
      new ImageryLayer(
        new UrlTemplateImageryProvider({
          url:
            'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/' +
            'VIIRS_CityLights_2012/default/2012-02-21/' +
            'GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg',
          tilingScheme: new WebMercatorTilingScheme(),
          maximumLevel: 8,
          credit: new Credit('NASA · VIIRS Black Marble 2012'),
        }),
        { dayAlpha: 0, nightAlpha: 1 },
      ),
    );

    viewer.clock.clockRange = ClockRange.LOOP_STOP;
    viewer.clock.shouldAnimate = false;

    viewerRef.current = viewer;

    // Pas de double-clic « vol vers » (comportement globe Cesium) : la vue
    // sert à lire le ciel natal, pas à se promener sur les corps.
    viewer.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    // Navigation clavier — façon carte de jeu vidéo (AZERTY).
    //   ←/→ : orbite est/ouest    ↑/↓ : orbite nord/sud
    //   A/E : tourne la caméra (heading) en place
    //   Z/S (ou +/-) : zoom / dézoom
    // On applique les déplacements à chaque frame Cesium en fonction de
    // l'ensemble des touches enfoncées, pour un mouvement continu fluide.
    const pressedKeys = new Set<string>();
    const NAV_KEYS = new Set([
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'a', 'A', 'e', 'E', 'z', 'Z', 's', 'S',
      '+', '=', '-', '_',
      'PageUp', 'PageDown',
    ]);
    const isTypingTarget = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (!NAV_KEYS.has(e.key)) return;
      pressedKeys.add(e.key);
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => { pressedKeys.delete(e.key); };
    const onBlur = () => { pressedKeys.clear(); };

    const MIN_DIST = 200_000;            // 200 km, rasance Terre
    const MAX_DIST = 150_000_000;        // 150 000 km, dans la sphère céleste
    const tickCamera = () => {
      if (pressedKeys.size === 0) return;
      const camera = viewer.camera;
      const dist = Cartesian3.magnitude(camera.position);

      // Side View has the camera parked far from Earth, looking sideways
      // along a constellation timeline. Earth-centric orbit/zoom (below)
      // would swing the camera in a huge arc and lurch on zoom — useless
      // for inspecting a diagram. Switch to camera-local pan + view-axis
      // zoom, both scaled to current distance so steps stay perceptible.
      if (sideViewActiveRef.current) {
        const panStep = dist * 0.015;
        const zoomStep = dist * 0.02;
        if (pressedKeys.has('ArrowLeft'))  camera.moveLeft(panStep);
        if (pressedKeys.has('ArrowRight')) camera.moveRight(panStep);
        if (pressedKeys.has('ArrowUp'))    camera.moveUp(panStep);
        if (pressedKeys.has('ArrowDown'))  camera.moveDown(panStep);
        // A/E heading rotation is intentionally skipped here: spinning
        // the camera around its own up vector would tilt the timeline
        // off horizontal and break the diagram framing.
        if (pressedKeys.has('+') || pressedKeys.has('=') ||
            pressedKeys.has('z') || pressedKeys.has('Z') ||
            pressedKeys.has('PageUp')) {
          camera.zoomIn(zoomStep);
        }
        if (pressedKeys.has('-') || pressedKeys.has('_') ||
            pressedKeys.has('s') || pressedKeys.has('S') ||
            pressedKeys.has('PageDown')) {
          camera.zoomOut(zoomStep);
        }
        return;
      }

      // Vitesses calibrées pour un mouvement perceptible sans être brutal,
      // proportionnelles au pas (~16 ms à 60 fps mais on s'en moque, Cesium
      // tourne à fréquence variable — les valeurs sont par frame).
      const orbitStep = 0.012;           // rad/frame  ≈ 0.7°
      const lookStep = 0.015;            // rad/frame  ≈ 0.85°
      const zoomFactor = 0.97;           // 3% par frame
      // Orbite autour de la Terre (rotateLeft/Right/Up/Down tournent
      // autour du « target » du frustum, par défaut le centre Terre).
      if (pressedKeys.has('ArrowLeft'))  camera.rotateRight(orbitStep);
      if (pressedKeys.has('ArrowRight')) camera.rotateLeft(orbitStep);
      if (pressedKeys.has('ArrowUp'))    camera.rotateDown(orbitStep);
      if (pressedKeys.has('ArrowDown'))  camera.rotateUp(orbitStep);
      // Heading en place (rotation de la caméra sans changer sa position).
      if (pressedKeys.has('a') || pressedKeys.has('A')) camera.lookLeft(lookStep);
      if (pressedKeys.has('e') || pressedKeys.has('E')) camera.lookRight(lookStep);
      // Zoom : on rapproche/éloigne en bornant la distance au centre Terre.
      if (pressedKeys.has('+') || pressedKeys.has('=') ||
          pressedKeys.has('z') || pressedKeys.has('Z') ||
          pressedKeys.has('PageUp')) {
        const target = Math.max(MIN_DIST, dist * zoomFactor);
        if (target < dist) camera.zoomIn(dist - target);
      }
      if (pressedKeys.has('-') || pressedKeys.has('_') ||
          pressedKeys.has('s') || pressedKeys.has('S') ||
          pressedKeys.has('PageDown')) {
        const target = Math.min(MAX_DIST, dist / zoomFactor);
        if (target > dist) camera.zoomOut(target - dist);
      }
    };
    const removePreRender =
      viewer.scene.preRender.addEventListener(tickCamera);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Vue par défaut avant tout JUMP : orbitale, regard Terre.
    flyToOrbital(viewer, 0);

    return () => {
      removePreRender();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      cleanupsRef.current.forEach((c) => c());
      cleanupsRef.current = [];
      viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  // 2. Remontage des layers + animation caméra
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Le reading actif est celui du JUMP natal s'il existe, sinon le live.
    const active = reading ?? liveReading;
    const previous = previousReadingRef.current;
    const isFirstJump = reading != null && previous == null;
    const isReadingChange =
      reading != null &&
      previous != null &&
      reading.input.date.getTime() !== previous.input.date.getTime();

    // On nettoie systématiquement les anciens layers : RA/Dec et GMST
    // changent à chaque tick.
    cleanupsRef.current.forEach((c) => c());
    cleanupsRef.current = [];

    viewer.clock.currentTime = JulianDate.fromDate(active.input.date);
    const gmstRad = gmstRadians(active.input.date);
    activeReadingRef.current = active;
    activeGmstRef.current = gmstRad;

    cleanupsRef.current.push(
      mountStarsLayer(viewer, {
        gmstRad,
        highlight: reading?.trueConstellation ?? null,
        showConstellationArt: showBodyLabels,
        // Side View fades the rest of the sky to ~5 % so the timeline
        // reads as a clean diagram rather than a starfield. The
        // constellation pattern lines (drawn by the exploded layer with
        // a glow material) still pop above this floor.
        dimFactor: sideViewActive ? 0.05 : 1.0,
      }),
    );
    cleanupsRef.current.push(
      mountSunLayer(viewer, {
        raHours: active.sunRA,
        decDeg: active.sunDec,
        gmstRad,
        constellation: active.trueConstellation,
        showLabels: showBodyLabels,
      }),
    );
    cleanupsRef.current.push(
      mountMoonLayer(viewer, {
        raHours: active.moon.ra,
        decDeg: active.moon.dec,
        distanceKm: active.moon.distanceKm,
        illumination: active.moon.illumination,
        phaseName: active.moon.phaseName,
        constellation: active.moon.constellation,
        sunRaHours: active.sunRA,
        sunDecDeg: active.sunDec,
        gmstRad,
        showLabels: showBodyLabels,
      }),
    );
    cleanupsRef.current.push(
      mountPlanetsLayer(viewer, {
        bodies: active.bodies,
        gmstRad,
        showLabels: showBodyLabels,
      }),
    );

    if (showGuides) {
      cleanupsRef.current.push(
        mountReferenceLines(viewer, {
          gmstRad,
          obliquityDeg: active.obliquity,
        }),
      );
    }

    // Animation caméra : seulement à l'arrivée d'un reading natal ou quand
    // sa date change. Les ticks "live" minute par minute ne touchent pas la
    // caméra, sinon elle saute toutes les minutes.
    if (isFirstJump || isReadingChange) {
      flyToCelestialDirection(viewer, {
        raHours: active.sunRA,
        decDeg: active.sunDec,
        gmstRad,
      });
    }

    previousReadingRef.current = reading;
  }, [
    reading,
    liveReading,
    showGuides,
    showBodyLabels,
    sideViewActive,
  ]);

  // Relics layer: kept on its own effect so it doesn't re-mount on every
  // live tick (which would reset the pulse phase and the layer-internal
  // last-known-position cache every minute).
  // Only re-mounts when the set of relics changes, or when natal ↔ live
  // mode flips (i.e. `reading` becomes non-null or null).
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !showSatellites || trackedSatellites.length === 0) {
      return;
    }
    const cleanup = mountSatellitesLayer(viewer, {
      satellites: trackedSatellites,
      // Natal: frozen date. Live: now, re-evaluated each frame by the
      // layer's internal CallbackProperty.
      getTime: () => reading?.input.date ?? new Date(),
      live: !reading,
      // Symmetric reveal: when entering historical mode we wait for the
      // modern swarm to vanish before bringing the relics in.
      fadeInMs: RELICS_FADE_IN_MS,
      fadeInDelayMs: relicsHistoricalReveal ? SWARM_FADE_OUT_MS : 0,
    });
    return cleanup;
  }, [showSatellites, trackedSatellites, reading, relicsHistoricalReveal]);

  // Orbital population overlay: live propagation (new Date()), gated by date.
  // birthYear is kept as a defense-in-depth filter inside mountOrbitalLayer,
  // but the primary gate is `liveSwarmAllowed` — past dates skip the mount
  // entirely and rely on the previous cleanup's fade-out for the transition.
  const birthYear =
    constellationMode === 'historical'
      ? (reading?.input.date.getFullYear() ?? null)
      : null;

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || orbitalSatellites.length === 0 || !liveSwarmAllowed) {
      return;
    }
    const handle = mountOrbitalLayer(viewer, orbitalSatellites, birthYear);
    // Cleanup is async on purpose: ramp alpha 1 → 0, then dispose. React
    // doesn't await cleanup, which is what we want — the next mount (if any)
    // can begin while the old layer is still finishing its fade.
    return () => handle.fadeOutAndDispose(SWARM_FADE_OUT_MS);
  }, [orbitalSatellites, birthYear, liveSwarmAllowed]);

  // Toggling relics no longer moves the camera — the layer just renders
  // at the current framing. If the user wants to inspect LEO orbits up
  // close, they pan or use the camera controls explicitly.

  // Observer marker: pinned to the globe surface at the natal birth
  // location (or live observer position). Independent effect so changing
  // the marker doesn't re-mount the sky.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (
      !viewer ||
      markerLatitude == null ||
      markerLongitude == null
    ) {
      return;
    }
    return mountObserverMarker(viewer, {
      latitude: markerLatitude,
      longitude: markerLongitude,
      label: markerLabel,
    });
  }, [markerLatitude, markerLongitude, markerLabel]);

  // Click-pick installed once; emits a SelectedBody (or null) on click.
  useBodyPicker(viewerRef, onBodySelect);

  // Hover affordance: cursor swap + floating name tooltip so it's obvious
  // that bodies are clickable. We keep state for name (drives tooltip
  // visibility + text) and a ref for the tooltip DOM node so cursor moves
  // over the same body don't re-render the whole tree.
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoveredNameRef = useRef<string | null>(null);
  const handleHover = useCallback((hover: HoveredBody | null) => {
    if (!hover) {
      if (hoveredNameRef.current !== null) {
        hoveredNameRef.current = null;
        setHoveredName(null);
      }
      return;
    }
    const tip = tooltipRef.current;
    if (tip) {
      // Offset slightly so the tooltip never sits under the cursor and
      // never traps mouse events.
      tip.style.transform = `translate(${hover.x + 14}px, ${hover.y + 14}px)`;
    }
    if (hoveredNameRef.current !== hover.name) {
      hoveredNameRef.current = hover.name;
      setHoveredName(hover.name);
    }
  }, []);
  useBodyHover(viewerRef, handleHover);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.scene.canvas.style.cursor = hoveredName ? 'pointer' : '';
    return () => {
      const v = viewerRef.current;
      if (v) v.scene.canvas.style.cursor = '';
    };
  }, [hoveredName]);

  // Constellation overlays only make sense when a star is selected —
  // every other body kind leaves them off. Pulled out here so the
  // effects below stay readable.
  const selectedStar = selectedBody?.kind === 'star' ? selectedBody : null;

  // Bright pattern overlay for the user-selected constellation. Decoupled
  // from the main remount effect so changing selection does not re-mount
  // stars/sun/moon/planets. Skipped in Side View: the exploded layer
  // already draws the pattern at the timeline-aligned expanded-shell
  // scale, and re-drawing it here on the compressed shell would render a
  // second, miniature Taurus clinging to Earth.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedStar || sideViewActive) return;
    const active = reading ?? liveReading;
    const gmstRad = gmstRadians(active.input.date);
    const cleanup = mountSelectedConstellation(viewer, {
      constellationAbbr: selectedStar.constellationAbbr,
      gmstRad,
    });
    return cleanup;
  }, [selectedStar, sideViewActive, reading, liveReading]);

  // Exploded constellation: re-renders the selected stars on the [50, 800]
  // AU shell with depth tint and glow lines. Mounted only in Side View.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedStar || !sideViewActive) return;
    const active = reading ?? liveReading;
    const gmstRad = gmstRadians(active.input.date);
    const cleanup = mountExplodedConstellation(viewer, {
      constellationAbbr: selectedStar.constellationAbbr,
      gmstRad,
    });
    return cleanup;
  }, [selectedStar, sideViewActive, reading, liveReading]);

  // Distance ruler along the Earth→constellation axis with calibrated
  // 100 ly ticks. Mounted only in Side View.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !selectedStar || !sideViewActive) return;
    const active = reading ?? liveReading;
    const gmstRad = gmstRadians(active.input.date);
    const cleanup = mountDistanceRuler(viewer, {
      constellationAbbr: selectedStar.constellationAbbr,
      gmstRad,
    });
    return cleanup;
  }, [selectedStar, sideViewActive, reading, liveReading]);

  // Camera transition. We snapshot the current camera frame on the
  // false→true edge, fly to the side perspective, and fly back to the
  // snapshot on the true→false edge. The ref-tracked previous-state
  // pattern is used so the effect can detect edges without re-running on
  // unrelated re-renders (date ticks, selection changes, etc.).
  const wasSideViewActiveRef = useRef(false);
  const earthCameraSnapshotRef = useRef<CameraSnapshot | null>(null);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const previous = wasSideViewActiveRef.current;
    wasSideViewActiveRef.current = sideViewActive;

    if (!previous && sideViewActive && selectedStar) {
      earthCameraSnapshotRef.current = captureCameraSnapshot(viewer);
      const active = reading ?? liveReading;
      flyToSideView(
        viewer,
        selectedStar.constellationAbbr,
        gmstRadians(active.input.date),
      );
    } else if (previous && !sideViewActive && earthCameraSnapshotRef.current) {
      flyToCameraSnapshot(viewer, earthCameraSnapshotRef.current);
      earthCameraSnapshotRef.current = null;
    }
  }, [sideViewActive, selectedStar, reading, liveReading]);

  return (
    <div className="absolute inset-0" aria-label="Vue 3D du ciel natal">
      <div ref={containerRef} className="absolute inset-0" />
      <div
        ref={tooltipRef}
        role="tooltip"
        aria-hidden={!hoveredName}
        className="pointer-events-none absolute top-0 left-0 z-20
                   px-2 py-1 rounded
                   bg-slate-950/85 border border-violet-400/35
                   text-cockpit-sm tracking-tight text-slate-100
                   shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-sm
                   transition-opacity duration-100 will-change-transform"
        style={{ opacity: hoveredName ? 1 : 0 }}
      >
        {hoveredName ?? ''}
      </div>
    </div>
  );
}

import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react';
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
} from '../../utils/astroEngine';
import { gmstRadians } from '../../utils/skyCoordinates';

import { mountStarsLayer } from './cesium/mountStarsLayer';
import { mountSunLayer } from './cesium/mountSunLayer';
import { mountMoonLayer } from './cesium/mountMoonLayer';
import { mountPlanetsLayer } from './cesium/mountPlanetsLayer';
import { mountReferenceLines } from './cesium/mountReferenceLines';
import { mountSatellitesLayer } from './cesium/mountSatellitesLayer';
import {
  flyToOrbital,
  flyToCelestialDirection,
  flyToRelicsView,
} from './cesium/cameraDirector';
import { useSatelliteTracker } from '../../hooks/useSatelliteTracker';

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

interface Props {
  reading: CelestialReading | null;
  /** Affiche axe terrestre, équateur céleste et écliptique. */
  showGuides: boolean;
  /** Étiquettes Soleil / Lune / planètes dans la scène. */
  showBodyLabels: boolean;
  /** Enables the orbital relics layer (historical satellites). */
  showSatellites: boolean;
  /**
   * Observer latitude, used for the "live" pre-JUMP sky. Has no impact on
   * body rendering (which is geocentric), but matters for the ascendant
   * and for semantic consistency of `liveReading.input`.
   */
  liveLatitude: number;
  /** Observer longitude (see liveLatitude). */
  liveLongitude: number;
  /** Référence impérative pour le capture-canvas. */
  ref?: Ref<SpaceViewHandle>;
}

// Cesium fonctionne sans token Ion tant qu'on ne demande pas d'assets premium.
Ion.defaultAccessToken = '';

// Rafraîchissement de la position des corps "live" avant JUMP.
// La Lune se déplace ~0.5°/h, donc 60 s donne <0.01° d'erreur — invisible.
const LIVE_REFRESH_MS = 60_000;

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
  liveLatitude,
  liveLongitude,
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
    viewer.scene.backgroundColor = Color.fromCssColorString('#060210');

    // Frustum far : la sphère céleste est à 100 AU (~1.5e13 m), les
    // planètes externes peuvent y être ~50 AU. On pousse le far à 200 AU
    // (3e13 m) pour garder une marge. Le logarithmicDepthBuffer (activé
    // par défaut en WebGL2) garantit la précision de profondeur sur cette
    // dynamique (~1 m près du globe, comparable près du far).
    if (viewer.camera.frustum instanceof PerspectiveFrustum) {
      viewer.camera.frustum.far = 200 * AU_KM * 1000;
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
      const dist = Cartesian3.magnitude(camera.position);
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
      }),
    );
    cleanupsRef.current.push(
      mountSunLayer(viewer, {
        raHours: active.sunRA,
        decDeg: active.sunDec,
        gmstRad,
        showLabels: showBodyLabels,
      }),
    );
    cleanupsRef.current.push(
      mountMoonLayer(viewer, {
        raHours: active.moon.ra,
        decDeg: active.moon.dec,
        distanceKm: active.moon.distanceKm,
        illumination: active.moon.illumination,
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
    });
    return cleanup;
  }, [showSatellites, trackedSatellites, reading]);

  // When the user turns relics on (live mode only), fly closer to Earth
  // so LEO satellites are visible *and* their motion is perceptible. From
  // the default 100 000 km orbital camera, ISS would be sub-pixel.
  // In natal mode we leave the camera alone — the user just JUMPed and
  // the camera is already framing the natal sky direction.
  const wasShowingSatellitesRef = useRef(false);
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const turnedOn = showSatellites && !wasShowingSatellitesRef.current;
    wasShowingSatellitesRef.current = showSatellites;
    if (turnedOn && !reading) {
      flyToRelicsView(viewer);
    }
  }, [showSatellites, reading]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      aria-label="Vue 3D du ciel natal"
    />
  );
}

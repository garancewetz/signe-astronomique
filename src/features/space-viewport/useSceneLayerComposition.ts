import { useEffect, type MutableRefObject } from 'react';
import { JulianDate, type Viewer } from 'cesium';
import type { CelestialReading } from '@/features/astronomy';
import type { PlanetId } from '@/features/astronomy';
import { gmstRadians } from '@/features/astronomy';
import { mountStarsLayer } from './cesium/mountStarsLayer';
import { mountSunLayer } from './cesium/mountSunLayer';
import { mountMoonLayer } from './cesium/mountMoonLayer';
import { mountPlanetsLayer } from './cesium/mountPlanetsLayer';
import { mountReferenceLines } from './cesium/mountReferenceLines';
import { flyToCelestialDirection } from './cesium/cameraDirector';

interface UseSceneLayerCompositionArgs {
  viewerRef: MutableRefObject<Viewer | null>;
  /**
   * Cleanup bag shared with the parent component's viewer-init effect.
   * The composition hook drains and refills this on every re-run; the
   * parent drains it once more on unmount, before destroying the viewer.
   */
  cleanupsRef: MutableRefObject<Array<() => void>>;
  previousReadingRef: MutableRefObject<CelestialReading | null>;
  activeReadingRef: MutableRefObject<CelestialReading | null>;
  activeGmstRef: MutableRefObject<number>;

  reading: CelestialReading | null;
  /** "Live" reading derived from the current Date — used pre-JUMP. */
  liveReading: CelestialReading;
  showGuides: boolean;
  showBodyLabels: boolean;
  /** Dims the stars and skips the reference-line layer to keep the diagram clean. */
  sideViewActive: boolean;
  /** Locale-aware body labels surfaced to the Cesium layers. */
  bodyNames: {
    sun: string;
    moon: string;
    planet: (id: PlanetId) => string;
  };
}

/**
 * Mounts the stars / sun / moon / planets / reference-lines layers, and
 * flies the camera to the sun on the first JUMP or whenever the natal date
 * changes. Extracted from SpaceView to keep the viewer-init effect focused
 * on lifecycle; the lifecycle ownership (viewer creation + final cleanup)
 * stays in the parent.
 */
export function useSceneLayerComposition({
  viewerRef,
  cleanupsRef,
  previousReadingRef,
  activeReadingRef,
  activeGmstRef,
  reading,
  liveReading,
  showGuides,
  showBodyLabels,
  sideViewActive,
  bodyNames,
}: UseSceneLayerCompositionArgs): void {
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // The active reading is the natal JUMP if there is one, otherwise live.
    const active = reading ?? liveReading;
    const previous = previousReadingRef.current;
    const isFirstJump = reading != null && previous == null;
    const isReadingChange =
      reading != null &&
      previous != null &&
      reading.input.date.getTime() !== previous.input.date.getTime();

    // Always tear down the previous layers: RA/Dec and GMST change on
    // every tick, so layers cannot be reused as-is.
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
        displayName: bodyNames.sun,
        showLabels: showBodyLabels,
      }),
    );
    cleanupsRef.current.push(
      mountMoonLayer(viewer, {
        raHours: active.moon.ra,
        decDeg: active.moon.dec,
        distanceKm: active.moon.distanceKm,
        illumination: active.moon.illumination,
        phaseKey: active.moon.phaseKey,
        constellation: active.moon.constellation,
        displayName: bodyNames.moon,
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
        nameOf: bodyNames.planet,
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

    // Camera animation: only when a natal reading arrives or its date
    // changes. Minute-by-minute "live" ticks must not touch the camera,
    // otherwise it would jump every minute.
    if (isFirstJump || isReadingChange) {
      flyToCelestialDirection(viewer, {
        raHours: active.sunRA,
        decDeg: active.sunDec,
        gmstRad,
      });
    }

    previousReadingRef.current = reading;
  }, [
    viewerRef,
    cleanupsRef,
    previousReadingRef,
    activeReadingRef,
    activeGmstRef,
    reading,
    liveReading,
    showGuides,
    showBodyLabels,
    sideViewActive,
    bodyNames,
  ]);
}

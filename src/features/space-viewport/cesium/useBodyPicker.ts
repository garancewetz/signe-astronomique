import { useEffect } from 'react';
import {
  Cartesian2,
  Entity,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium';
import type { IauConstellation } from '@/features/astronomy';
import type { PlanetId } from '@/features/astronomy';
import type { SelectedBody } from '../SpaceView';

/** Body identification under the cursor — used to drive hover affordance. */
export interface HoveredBody {
  name: string;
  /** Canvas-relative coordinates, ready to position a tooltip. */
  x: number;
  y: number;
}

/**
 * Property bags attached by the mount layers to every clickable entity.
 * The runtime payload comes back as `unknown` from PropertyBag.getValue;
 * the type guards below verify each shape before we trust the fields.
 */
interface StarPayload {
  kind: 'star';
  /** Bayer designation + proper name resolved at mount time. */
  name?: string;
  bayer?: string;
  constellationAbbr: string;
  starIndex: number;
}

interface SunPayload {
  kind: 'sun';
  name: string;
  constellation: IauConstellation;
  raHours: number;
  decDeg: number;
}

interface MoonPayload {
  kind: 'moon';
  name: string;
  constellation: IauConstellation;
  raHours: number;
  decDeg: number;
  distanceKm: number;
  illumination: number;
  phaseKey: string;
}

interface PlanetPayload {
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

interface SatellitePayload {
  kind: 'satellite';
  relicId: string;
  name: string;
  launchDate: string;
  blurb: string;
  glowColor: string;
}

type BodyPayload =
  | StarPayload
  | SunPayload
  | MoonPayload
  | PlanetPayload
  | SatellitePayload;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function isBodyPayload(value: unknown): value is BodyPayload {
  const v = asRecord(value);
  if (!v) return false;
  switch (v.kind) {
    case 'star':
      return (
        typeof v.constellationAbbr === 'string' &&
        typeof v.starIndex === 'number'
      );
    case 'sun':
      return (
        typeof v.name === 'string' &&
        typeof v.constellation === 'string' &&
        typeof v.raHours === 'number' &&
        typeof v.decDeg === 'number'
      );
    case 'moon':
      return (
        typeof v.name === 'string' &&
        typeof v.constellation === 'string' &&
        typeof v.raHours === 'number' &&
        typeof v.decDeg === 'number' &&
        typeof v.distanceKm === 'number' &&
        typeof v.illumination === 'number' &&
        typeof v.phaseKey === 'string'
      );
    case 'planet':
      return (
        typeof v.id === 'string' &&
        typeof v.name === 'string' &&
        typeof v.glyph === 'string' &&
        typeof v.color === 'string' &&
        typeof v.constellation === 'string' &&
        typeof v.raHours === 'number' &&
        typeof v.decDeg === 'number' &&
        typeof v.distanceAU === 'number'
      );
    case 'satellite':
      return (
        typeof v.relicId === 'string' &&
        typeof v.name === 'string' &&
        typeof v.launchDate === 'string' &&
        typeof v.blurb === 'string' &&
        typeof v.glowColor === 'string'
      );
    default:
      return false;
  }
}

function payloadToSelection(p: BodyPayload): SelectedBody {
  switch (p.kind) {
    case 'star':
      return {
        kind: 'star',
        constellationAbbr: p.constellationAbbr,
        starIndex: p.starIndex,
      };
    case 'sun':
      return {
        kind: 'sun',
        name: p.name,
        constellation: p.constellation,
        raHours: p.raHours,
        decDeg: p.decDeg,
      };
    case 'moon':
      return {
        kind: 'moon',
        name: p.name,
        constellation: p.constellation,
        raHours: p.raHours,
        decDeg: p.decDeg,
        distanceKm: p.distanceKm,
        illumination: p.illumination,
        phaseKey: p.phaseKey,
      };
    case 'planet':
      return {
        kind: 'planet',
        id: p.id,
        name: p.name,
        glyph: p.glyph,
        color: p.color,
        constellation: p.constellation,
        raHours: p.raHours,
        decDeg: p.decDeg,
        distanceAU: p.distanceAU,
      };
    case 'satellite':
      return {
        kind: 'satellite',
        relicId: p.relicId,
        name: p.name,
        launchDate: p.launchDate,
        blurb: p.blurb,
        glowColor: p.glowColor,
      };
  }
}

function payloadDisplayName(p: BodyPayload): string {
  switch (p.kind) {
    case 'star':
      return [p.bayer, p.name].filter(Boolean).join(' ').trim() || 'Étoile';
    case 'sun':
    case 'moon':
    case 'planet':
    case 'satellite':
      return p.name;
  }
}

function pickBodyPayloadAt(
  viewer: Viewer,
  position: Cartesian2,
): BodyPayload | null {
  const picked = viewer.scene.pick(position);
  if (!picked) return null;
  const entity = picked.id;
  if (!(entity instanceof Entity) || !entity.properties) return null;
  const value = entity.properties.getValue(viewer.clock.currentTime);
  return isBodyPayload(value) ? value : null;
}

/**
 * Installs a LEFT_CLICK handler on the Cesium viewer that dispatches on the
 * `kind` property attached by the mount layers:
 *  - star / sun / moon / planet / satellite → emit a typed SelectedBody snapshot;
 *  - empty space → emit null (deselect);
 *  - any other entity (depth lines, modern-swarm point primitives, etc.)
 *    → no-op so the current selection is preserved.
 *
 * The handler is destroyed in cleanup.
 */
export function useBodyPicker(
  viewerRef: React.RefObject<Viewer | null>,
  onSelect: (body: SelectedBody | null) => void,
): void {
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const payload = pickBodyPayloadAt(viewer, event.position);
      if (!payload) {
        // Distinguish "empty sky" (deselect) from "non-body entity, e.g.
        // depth line" (preserve selection) by looking at the raw pick.
        const picked = viewer.scene.pick(event.position);
        if (!picked) onSelect(null);
        return;
      }
      onSelect(payloadToSelection(payload));
    }, ScreenSpaceEventType.LEFT_CLICK);
    return () => handler.destroy();
  }, [viewerRef, onSelect]);
}

/**
 * Installs a MOUSE_MOVE handler that emits the body under the cursor (or
 * null when nothing pickable is hovered). Used by SpaceView to swap the
 * cursor and render a floating tooltip — the affordance that signals
 * "this is clickable" without any extra UI chrome.
 *
 * Picking on every mouse move is cheap in Cesium for this entity count,
 * but we still bail out early when the position is outside the canvas.
 */
export function useBodyHover(
  viewerRef: React.RefObject<Viewer | null>,
  onHover: (hover: HoveredBody | null) => void,
): void {
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event: ScreenSpaceEventHandler.MotionEvent) => {
      const payload = pickBodyPayloadAt(viewer, event.endPosition);
      if (!payload) {
        onHover(null);
        return;
      }
      onHover({
        name: payloadDisplayName(payload),
        x: event.endPosition.x,
        y: event.endPosition.y,
      });
    }, ScreenSpaceEventType.MOUSE_MOVE);
    return () => {
      handler.destroy();
      onHover(null);
    };
  }, [viewerRef, onHover]);
}

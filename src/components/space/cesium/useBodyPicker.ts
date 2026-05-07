import { useEffect } from 'react';
import {
  Entity,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type Viewer,
} from 'cesium';
import type { IauConstellation } from '../../../utils/astroEngine';
import type { PlanetId } from '../../../utils/planetEngine';
import type { SelectedBody } from '../SpaceView';

/**
 * Property bags attached by the mount layers to every clickable entity.
 * The runtime payload comes back as `unknown` from PropertyBag.getValue;
 * the type guards below verify each shape before we trust the fields.
 */
interface StarPayload {
  kind: 'star';
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
  phaseName: string;
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

type BodyPayload = StarPayload | SunPayload | MoonPayload | PlanetPayload;

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
        typeof v.phaseName === 'string'
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
        phaseName: p.phaseName,
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
  }
}

/**
 * Installs a LEFT_CLICK handler on the Cesium viewer that dispatches on the
 * `kind` property attached by the mount layers:
 *  - star / sun / moon / planet → emit a typed SelectedBody snapshot;
 *  - empty space → emit null (deselect);
 *  - any other entity (depth lines, satellites, etc.) → no-op so the
 *    current selection is preserved.
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
      const picked = viewer.scene.pick(event.position);
      if (!picked) {
        onSelect(null);
        return;
      }
      const entity = picked.id;
      if (!(entity instanceof Entity) || !entity.properties) return;
      const value = entity.properties.getValue(viewer.clock.currentTime);
      if (!isBodyPayload(value)) return;
      onSelect(payloadToSelection(value));
    }, ScreenSpaceEventType.LEFT_CLICK);
    return () => handler.destroy();
  }, [viewerRef, onSelect]);
}

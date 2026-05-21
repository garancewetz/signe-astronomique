import {
  buildModuleUrl,
  Cartesian2,
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  EllipsoidGeometry,
  Entity,
  GeometryInstance,
  HorizontalOrigin,
  LabelStyle,
  Material,
  MaterialAppearance,
  Matrix4,
  Primitive,
  VertexFormat,
  VerticalOrigin,
  type Viewer,
} from 'cesium';
import {
  AU_KM,
  raHoursToDegrees,
} from '@/features/astronomy';
import { raDecToEcef } from './skyVector';
import { visualEllipsoidRadiusMeters } from './bodies';
import type { IauConstellation, MoonPhaseKey } from '@/features/astronomy';

const MOON_TEXTURE_URI = buildModuleUrl('Assets/Textures/moonSmall.jpg');

// Beyond this Earth-camera distance the moon shrinks to sub-pixel and turns
// into noise in stellar-scale framings (Side View runs to 1500 AU).
const MOON_HIDE_BEYOND_M = 2 * AU_KM * 1000;

// Phase-aware lunar shader.
//   sunDirWorld : unit vector Moon→Sun, ECEF (constant per mount)
//   earthshine  : ambient floor on the dark side; keeps the disk readable
//                 at New Moon without flattening the terminator
//   gamma       : <1 deepens shadows / boosts highlights for HUD contrast
//   brightness  : overall scalar applied after shading
const MOON_FABRIC_SOURCE = `
  czm_material czm_getMaterial(czm_materialInput materialInput) {
    czm_material material = czm_getDefaultMaterial(materialInput);
    vec3 sunEC = normalize((czm_view * vec4(sunDirWorld, 0.0)).xyz);
    vec3 nEC = normalize(materialInput.normalEC);
    float ndotl = max(dot(nEC, sunEC), 0.0);
    vec4 tex = texture(image, materialInput.st);
    float lit = mix(earthshine, 1.0, ndotl);
    lit = pow(clamp(lit, 0.0, 1.0), gamma);
    material.diffuse = tex.rgb * lit * brightness;
    material.alpha = tex.a;
    return material;
  }
`;

interface MountOptions {
  /** Moon right-ascension in hours. */
  raHours: number;
  /** Moon declination in degrees. */
  decDeg: number;
  /** Real Earth-Moon distance, km (Meeus). */
  distanceKm: number;
  /** Illuminated fraction [0..1] — used only for the label tint. */
  illumination: number;
  /** Stable phase identifier — localized by display layers. */
  phaseKey: MoonPhaseKey;
  /** Localized display name (e.g. "Lune"/"Moon") for the in-scene label. */
  displayName: string;
  /** IAU constellation the Moon is currently in. */
  constellation: IauConstellation;
  /** Sun right-ascension in hours (drives the terminator). */
  sunRaHours: number;
  /** Sun declination in degrees. */
  sunDecDeg: number;
  /** GMST in radians. */
  gmstRad: number;
  /** Render a text label at the Moon's geocentric position. */
  showLabels?: boolean;
}

/**
 * Moon at its true geocentric distance, lit by a per-fragment Lambertian term
 * computed from the actual Sun→Moon direction. Click-pick is preserved by
 * tagging the Primitive's GeometryInstance with an Entity-shaped id.
 */
export function mountMoonLayer(viewer: Viewer, opts: MountOptions): () => void {
  const {
    raHours,
    decDeg,
    distanceKm,
    illumination,
    phaseKey,
    constellation,
    displayName,
    sunRaHours,
    sunDecDeg,
    gmstRad,
    showLabels = false,
  } = opts;

  const moonPos = raDecToEcef(
    raHoursToDegrees(raHours),
    decDeg,
    gmstRad,
    distanceKm * 1000,
  );
  const sunPos = raDecToEcef(
    raHoursToDegrees(sunRaHours),
    sunDecDeg,
    gmstRad,
    AU_KM * 1000,
  );

  const sunDirWorld = Cartesian3.normalize(
    Cartesian3.subtract(sunPos, moonPos, new Cartesian3()),
    new Cartesian3(),
  );

  const distM = Cartesian3.magnitude(moonPos);
  const r = visualEllipsoidRadiusMeters('moon', distM);

  // Cesium's built-in moon billboard uses `onlySunLighting` for its own
  // shading; setting it here keeps it consistent if it's ever toggled on.
  viewer.scene.globe.enableLighting = true;
  if (viewer.scene.moon) viewer.scene.moon.onlySunLighting = true;

  const material = new Material({
    fabric: {
      type: 'MoonPhase',
      uniforms: {
        image: MOON_TEXTURE_URI,
        sunDirWorld,
        // Higher earthshine keeps the disk readable even near new moon, where
        // the Earth-facing side would otherwise drop to a few % brightness and
        // disappear against the black background. Terminator stays marked.
        earthshine: 0.22,
        gamma: 0.85,
        brightness: 1.1,
      },
      source: MOON_FABRIC_SOURCE,
    },
    translucent: false,
  });

  // Entity carrying the picker payload. Not added to viewer.entities — the
  // primitive references it as `id`, so scene.pick returns it intact.
  const proxyEntity = new Entity({
    properties: {
      kind: 'moon',
      name: displayName,
      constellation,
      raHours,
      decDeg,
      distanceKm,
      illumination,
      phaseKey,
    },
  });

  const primitive = new Primitive({
    geometryInstances: new GeometryInstance({
      geometry: new EllipsoidGeometry({
        radii: new Cartesian3(r, r, r),
        vertexFormat: VertexFormat.POSITION_NORMAL_AND_ST,
      }),
      modelMatrix: Matrix4.fromTranslation(moonPos),
      id: proxyEntity,
    }),
    appearance: new MaterialAppearance({
      material,
      materialSupport: MaterialAppearance.MaterialSupport.TEXTURED,
      translucent: false,
    }),
    asynchronous: false,
  });
  viewer.scene.primitives.add(primitive);

  const lit = 0.25 + 0.75 * illumination;
  const moonColor = new Color(
    0.88 * lit + 0.12,
    0.90 * lit + 0.10,
    0.94 * lit + 0.08,
    1,
  );
  const labelEntity = showLabels
    ? viewer.entities.add({
        position: moonPos,
        label: {
          text: `☾ ${displayName}`,
          font: "10px 'JetBrains Mono', monospace",
          fillColor: moonColor.withAlpha(0.95),
          style: LabelStyle.FILL,
          verticalOrigin: VerticalOrigin.CENTER,
          horizontalOrigin: HorizontalOrigin.LEFT,
          pixelOffset: new Cartesian2(10, 0),
          distanceDisplayCondition: new DistanceDisplayCondition(
            0,
            MOON_HIDE_BEYOND_M,
          ),
        },
      })
    : null;

  // Primitive has no built-in distance gate; toggle `show` per frame so the
  // moon vanishes when the camera pulls back to stellar scales.
  const removeListener = viewer.scene.preRender.addEventListener(() => {
    const camDist = Cartesian3.distance(viewer.camera.positionWC, moonPos);
    primitive.show = camDist <= MOON_HIDE_BEYOND_M;
  });

  return () => {
    removeListener();
    viewer.scene.primitives.remove(primitive);
    if (labelEntity) viewer.entities.remove(labelEntity);
  };
}

import { useMemo } from 'react';
import {
  getIauBoundaries,
  type CelestialReading,
  type IauConstellation,
} from '../utils/astroEngine';
import { CONSTELLATION_LORE } from '../utils/constellationLore';

interface Props {
  reading: CelestialReading | null;
}

const VIEWBOX = 360;
const CX = VIEWBOX / 2;
const CY = VIEWBOX / 2;

const R_OUTER     = 175;
const R_OUTER_IN  = 145;
const R_TICKS_OUT = 142;
const R_TICKS_IN  = 134;
const R_BODIES    = 100;
const R_LABEL     = 160;

/**
 * Roue radar : représente l'écliptique sur 360° avec les TAILLES ANGULAIRES
 * RÉELLES des 13 constellations IAU (pas 30° chacune).
 *
 * Convention : longitude écliptique 0° (point vernal) à droite, 90° en haut,
 * progression mathématique anti-horaire.
 */
export function RadarWheel({ reading }: Props) {
  const segments = useMemo(() => buildSegments(), []);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className="block mx-auto w-full h-auto max-w-[min(100%,60vh)]"
    >
      {/* — Disque de fond — */}
      <circle cx={CX} cy={CY} r={R_OUTER} fill="rgba(2,6,23,0.6)" />
      <circle cx={CX} cy={CY} r={R_OUTER}   fill="none" stroke="rgba(56,189,248,0.4)" strokeWidth={0.6} />
      <circle cx={CX} cy={CY} r={R_OUTER_IN} fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth={0.4} />
      <circle cx={CX} cy={CY} r={R_BODIES + 16} fill="none" stroke="rgba(148,163,184,0.10)" strokeWidth={0.3} />
      <circle cx={CX} cy={CY} r={20} fill="none" stroke="rgba(56,189,248,0.3)" strokeWidth={0.4} />

      {/* — Segments de constellations — */}
      {segments.map(seg => {
        const isHighlight = reading?.trueConstellation === seg.name;
        return (
          <g key={seg.name}>
            <path
              d={annulusPath(seg.startDeg, seg.endDeg, R_OUTER_IN, R_OUTER)}
              fill={
                isHighlight
                  ? 'rgba(56,189,248,0.20)'
                  : seg.name === 'Ophiuchus'
                    ? 'rgba(168,85,247,0.05)'
                    : 'rgba(15,23,42,0.4)'
              }
              stroke="rgba(56,189,248,0.25)"
              strokeWidth={0.4}
            />
            <text
              {...labelPosition(seg.midDeg, R_LABEL)}
              fill={isHighlight ? '#67e8f9' : 'rgba(203,213,225,0.7)'}
              fontSize={9}
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.15em"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ textTransform: 'uppercase' }}
              transform={tangentRotate(seg.midDeg, R_LABEL)}
            >
              {CONSTELLATION_LORE[seg.name].fr}
            </text>
            {/* Indicateur de taille angulaire (en degrés) */}
            <text
              {...labelPosition(seg.midDeg, R_LABEL - 14)}
              fill="rgba(56,189,248,0.4)"
              fontSize={6}
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={tangentRotate(seg.midDeg, R_LABEL - 14)}
            >
              {seg.spanDeg.toFixed(1)}°
            </text>
          </g>
        );
      })}

      {/* — Tiques tous les 10° — */}
      {Array.from({ length: 36 }, (_, i) => i * 10).map(deg => {
        const major = deg % 30 === 0;
        const a = (deg * Math.PI) / 180;
        const x1 = CX + (major ? R_TICKS_IN - 4 : R_TICKS_IN) * Math.cos(a);
        const y1 = CY - (major ? R_TICKS_IN - 4 : R_TICKS_IN) * Math.sin(a);
        const x2 = CX + R_TICKS_OUT * Math.cos(a);
        const y2 = CY - R_TICKS_OUT * Math.sin(a);
        return (
          <line
            key={deg}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={major ? 'rgba(56,189,248,0.5)' : 'rgba(56,189,248,0.2)'}
            strokeWidth={major ? 0.7 : 0.4}
          />
        );
      })}

      {/* — Cardinaux N/E/S/O (en degrés écliptiques) — */}
      {[
        { deg: 0,   label: '0°' },
        { deg: 90,  label: '90°' },
        { deg: 180, label: '180°' },
        { deg: 270, label: '270°' },
      ].map(c => (
        <text
          key={c.deg}
          {...labelPosition(c.deg, R_TICKS_IN - 14)}
          fill="rgba(56,189,248,0.7)"
          fontSize={7}
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.2em"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {c.label}
        </text>
      ))}

      {/* — Corps célestes — */}
      {reading?.bodies.map(body => {
        const { x, y } = polarToCartesian(body.eclipticLongitude, R_BODIES);
        return (
          <g key={body.id}>
            {/* Rayon depuis le centre */}
            <line
              x1={CX} y1={CY} x2={x} y2={y}
              stroke={body.color}
              strokeWidth={0.4}
              opacity={0.35}
            />
            {/* Marqueur */}
            <circle cx={x} cy={y} r={4.5} fill={body.color} opacity={0.9} />
            <circle cx={x} cy={y} r={8} fill={body.color} opacity={0.18} />
            {/* Glyphe */}
            <text
              x={x} y={y - 11}
              fill={body.color}
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
              textAnchor="middle"
            >
              {body.glyph}
            </text>
          </g>
        );
      })}

      {/* — Ascendant : flèche depuis l'extérieur — */}
      {reading && <Ascendant longitude={reading.ascendantLongitude} />}

      {/* — Centre : métadonnées — */}
      {reading && <CenterInfo reading={reading} />}
    </svg>
  );
}

// ─── Helpers géométriques ───────────────────────────────────────────────────

function polarToCartesian(longitudeDeg: number, radius: number) {
  const a = (longitudeDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(a),
    y: CY - radius * Math.sin(a),
  };
}

function labelPosition(longitudeDeg: number, radius: number) {
  const { x, y } = polarToCartesian(longitudeDeg, radius);
  return { x, y };
}

/** Rotation tangente à la circonférence pour les labels arqués */
function tangentRotate(longitudeDeg: number, radius: number): string {
  const { x, y } = polarToCartesian(longitudeDeg, radius);
  // Texte horizontal lisible : pas de rotation du texte sur la moitié droite,
  // mais flip à 180° sur la gauche pour rester lisible.
  const flipped = longitudeDeg > 90 && longitudeDeg < 270;
  const angle = flipped ? -longitudeDeg + 180 : -longitudeDeg;
  return `rotate(${angle} ${x} ${y})`;
}

/** Path d'un anneau partiel entre deux longitudes écliptiques. */
function annulusPath(startDeg: number, endDeg: number, rIn: number, rOut: number): string {
  // Normalisation : on s'assure que end > start (si wrap, on ajoute 360)
  let span = endDeg - startDeg;
  if (span <= 0) span += 360;
  const largeArc = span > 180 ? 1 : 0;

  const a1 = (startDeg * Math.PI) / 180;
  const a2 = ((startDeg + span) * Math.PI) / 180;

  const x1o = CX + rOut * Math.cos(a1), y1o = CY - rOut * Math.sin(a1);
  const x2o = CX + rOut * Math.cos(a2), y2o = CY - rOut * Math.sin(a2);
  const x1i = CX + rIn  * Math.cos(a1), y1i = CY - rIn  * Math.sin(a1);
  const x2i = CX + rIn  * Math.cos(a2), y2i = CY - rIn  * Math.sin(a2);

  // En SVG, sweep-flag=0 = sens horaire. Nos longitudes croissent dans le sens
  // antihoraire (cos, -sin), donc pour aller de start à end, on utilise sweep=0.
  return [
    `M ${x1o} ${y1o}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 0 ${x2o} ${y2o}`,
    `L ${x2i} ${y2i}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 1 ${x1i} ${y1i}`,
    'Z',
  ].join(' ');
}

interface Segment {
  name: IauConstellation;
  startDeg: number;
  endDeg: number;
  midDeg: number;
  spanDeg: number;
}

/** Construit les segments à partir des frontières IAU (vraies tailles). */
function buildSegments(): Segment[] {
  const boundaries = getIauBoundaries();
  return boundaries.map((b, i) => {
    const next = boundaries[(i + 1) % boundaries.length];
    let span = next.start - b.start;
    if (span <= 0) span += 360;
    const mid = (b.start + span / 2) % 360;
    return {
      name: b.constellation,
      startDeg: b.start,
      endDeg: (b.start + span) % 360,
      midDeg: mid,
      spanDeg: span,
    };
  });
}

// ─── Ascendant ──────────────────────────────────────────────────────────────

function Ascendant({ longitude }: { longitude: number }) {
  const a1 = polarToCartesian(longitude, R_OUTER + 8);
  const a2 = polarToCartesian(longitude, R_OUTER - 4);
  return (
    <g>
      <line
        x1={a1.x} y1={a1.y} x2={a2.x} y2={a2.y}
        stroke="#34d399"
        strokeWidth={1.2}
      />
      <text
        {...polarToCartesian(longitude, R_OUTER + 18)}
        fill="#34d399"
        fontSize={7}
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.2em"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        ASC
      </text>
    </g>
  );
}

// ─── Centre : métadonnées ───────────────────────────────────────────────────

function CenterInfo({ reading }: { reading: CelestialReading }) {
  const date = reading.input.date;
  const tz = reading.input.timezone ?? 'UTC';
  const dateLabel = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    timeZone: tz,
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: tz,
  }).format(date);
  const timeSuffix = reading.input.timezone ? 'LOCAL' : 'UTC';

  return (
    <g>
      <text
        x={CX} y={CY - 16}
        fill="rgba(56,189,248,0.5)"
        fontSize={6}
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.3em"
        textAnchor="middle"
      >
        TC ÉCLIPTIQUE J2000
      </text>
      <text
        x={CX} y={CY - 4}
        fill="rgba(226,232,240,0.9)"
        fontSize={9}
        fontFamily="JetBrains Mono, monospace"
        textAnchor="middle"
      >
        {dateLabel}
      </text>
      <text
        x={CX} y={CY + 8}
        fill="rgba(148,163,184,0.7)"
        fontSize={8}
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.2em"
        textAnchor="middle"
      >
        {timeLabel} {timeSuffix}
      </text>
      {reading.input.placeLabel && (
        <text
          x={CX} y={CY + 20}
          fill="rgba(148,163,184,0.5)"
          fontSize={6}
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="0.25em"
          textAnchor="middle"
        >
          {reading.input.placeLabel.toUpperCase()}
        </text>
      )}
    </g>
  );
}

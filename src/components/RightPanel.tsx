import { type ReactNode } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { RadarWheel } from './RadarWheel';
import {
  AscendantCard,
  AstroInfoCard,
  BirthHeader,
  HowToRead,
  NotesCard,
  PlanetTable,
  ResumeCard,
  ScientificFooter,
  TwoMotionsCard,
} from './MissionLog';
import { PanelShell } from './ui';
import type { CelestialReading } from '../utils/astroEngine';
import {
  SPACE_AGE_START_YEAR,
  isSilentEra,
  relicsAvailableOn,
} from '../data/satellitesDB';

export type ReportPanelKey = 'resume' | 'carte' | 'lecture' | 'donnees';

interface PanelProps {
  reading: CelestialReading | null;
  onClose: () => void;
}

interface LecturePanelProps extends PanelProps {
  /** True when the orbital relics layer is on. */
  satellitesEnabled: boolean;
}

interface ResumePanelProps extends PanelProps {
  /** Whether constellation art + body labels are currently visible. */
  labelsEnabled: boolean;
  /** Toggles constellation art + body labels on the 3D sky. */
  onToggleLabels: () => void;
  /** Reveals the user's sun constellation in the 3D sky. */
  onRevealConstellation: () => void;
}

// ─── Body MON SIGNE ──────────────────────────────────────────────────────────

interface ResumeBodyProps {
  reading: CelestialReading | null;
  labelsEnabled: boolean;
  onToggleLabels: () => void;
  onRevealConstellation: () => void;
}

export function ResumeBody({
  reading,
  labelsEnabled,
  onToggleLabels,
  onRevealConstellation,
}: ResumeBodyProps) {
  const LabelIcon = labelsEnabled ? EyeOff : Eye;
  if (!reading) return <ResumeStub />;
  return (
    <div className="space-y-4 text-cockpit-xl leading-relaxed">
      <button
        type="button"
        onClick={onToggleLabels}
        aria-pressed={labelsEnabled}
        className="cockpit-focus group w-full
                   flex items-center justify-center gap-2 rounded-panel
                   border border-border-control
                   bg-violet-600/15 hover:bg-violet-600/25
                   hover:border-accent-label
                   transition-colors px-3.5 py-2.5
                   text-white text-cockpit-sm tracking-cockpit-caps font-medium"
      >
        <LabelIcon
          aria-hidden="true"
          className="size-4 text-violet-200 group-hover:text-white"
          strokeWidth={1.4}
        />
        {labelsEnabled ? 'Masquer les constellations' : 'Voir les constellations'}
      </button>
      <BirthHeader reading={reading} />
      <ResumeCard reading={reading} onRevealConstellation={onRevealConstellation} />
      <AscendantCard reading={reading} />
    </div>
  );
}

export function ResumePanel(props: ResumePanelProps) {
  const { onClose, ...bodyProps } = props;
  return (
    <ReportPanelShell title="MON SIGNE" subtitle="TON CIEL DE NAISSANCE" onClose={onClose}>
      <ResumeBody {...bodyProps} />
    </ReportPanelShell>
  );
}

// ─── Body CARTE ──────────────────────────────────────────────────────────────

export function CarteBody({ reading }: { reading: CelestialReading | null }) {
  if (!reading) return <CarteStub />;
  return (
    <div className="space-y-3 text-cockpit-xl leading-relaxed">
      <RadarWheel reading={reading} />
      <PlanetTable reading={reading} />
    </div>
  );
}

export function CartePanel({ reading, onClose }: PanelProps) {
  return (
    <ReportPanelShell
      title="CARTE"
      subtitle="ROUE DES CONSTELLATIONS"
      onClose={onClose}
    >
      <CarteBody reading={reading} />
    </ReportPanelShell>
  );
}

// ─── Body LECTURE ────────────────────────────────────────────────────────────

interface LectureBodyProps {
  reading: CelestialReading | null;
  satellitesEnabled: boolean;
}

export function LectureBody({ reading, satellitesEnabled }: LectureBodyProps) {
  if (!reading) return <LectureStub />;
  return (
    <div className="space-y-3 text-cockpit-xl leading-relaxed">
      <HowToRead />
      <TwoMotionsCard />
      <NotesCard reading={reading} />
      {satellitesEnabled && (
        <RelicsOracleCard birthDate={reading.input.date} />
      )}
    </div>
  );
}

export function LecturePanel({
  reading,
  satellitesEnabled,
  onClose,
}: LecturePanelProps) {
  return (
    <ReportPanelShell title="LECTURE" subtitle="COMPRENDRE TA CARTE" onClose={onClose}>
      <LectureBody reading={reading} satellitesEnabled={satellitesEnabled} />
    </ReportPanelShell>
  );
}

// ─── Body DONNÉES ────────────────────────────────────────────────────────────

export function DonneesBody({ reading }: { reading: CelestialReading | null }) {
  if (!reading) return <DonneesStub />;
  return (
    <div className="space-y-3 text-cockpit-xl leading-relaxed">
      <AstroInfoCard reading={reading} />
      <ScientificFooter />
    </div>
  );
}

export function DonneesPanel({ reading, onClose }: PanelProps) {
  return (
    <ReportPanelShell title="DONNÉES" subtitle="ASTRONOMIE BRUTE" onClose={onClose}>
      <DonneesBody reading={reading} />
    </ReportPanelShell>
  );
}

/**
 * "Oracle" card for orbital relics — shown in LECTURE while the layer
 * is active. Two states:
 *   - silence: birth before 1957 (Sputnik hadn't launched yet);
 *   - list   : every relic launched on or before the natal date.
 */
function RelicsOracleCard({ birthDate }: { birthDate: Date }) {
  if (isSilentEra(birthDate)) {
    return (
      <div className="rounded-panel border border-border-hud bg-surface/70
                      p-4 space-y-2">
        <div className="text-cockpit-md tracking-cockpit-caps text-accent-label/75">
          ORACLE · RELIQUES ORBITALES
        </div>
        <p className="text-amber-100/85 italic text-cockpit-xl leading-relaxed">
          « En cette année, l’orbite de la Terre n’appartenait qu’au silence. »
        </p>
        <p className="text-slate-400 text-cockpit-md leading-relaxed">
          Aucun objet humain n’avait encore quitté l’atmosphère — le premier,
          Spoutnik 1, ne serait lancé qu’en {SPACE_AGE_START_YEAR}.
        </p>
      </div>
    );
  }

  const relics = relicsAvailableOn(birthDate);
  return (
    <div className="rounded-sm border border-cyan-400/20 bg-[#0a1424]/60
                    p-4 space-y-3">
      <div className="text-cockpit-md tracking-cockpit-caps text-cyan-300/75">
        ORACLE · RELIQUES ORBITALES
      </div>
      <p className="text-slate-300 text-cockpit-lg leading-relaxed">
        Au moment de ta naissance, ces objets humains tournaient (ou
        avaient déjà tourné) autour de la Terre :
      </p>
      <ul className="space-y-1.5 text-cockpit-md">
        {relics.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: r.glowColor }}
            />
            <div className="min-w-0">
              <div className="text-slate-100">
                {r.name}
                <span className="text-slate-500 ml-1.5">
                  · {new Date(r.launchDate).getUTCFullYear()}
                </span>
              </div>
              <div className="text-slate-400 italic text-cockpit-md leading-snug">
                {r.blurb}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Rapport complet (export PNG) ────────────────────────────────────────────

/**
 * Toutes les sections empilées. Rendu hors-écran et utilisé uniquement
 * pour l'export PNG : c'est ce qui est dessiné à droite de la vue 3D.
 */
export function FullReport({ reading }: { reading: CelestialReading }) {
  return (
    <div className="space-y-3 text-cockpit-xl leading-relaxed px-4 py-4">
      <BirthHeader reading={reading} />
      <ResumeCard reading={reading} />
      <AscendantCard reading={reading} />
      <RadarWheel reading={reading} />
      <PlanetTable reading={reading} />
      <HowToRead />
      <TwoMotionsCard />
      <NotesCard reading={reading} />
      <AstroInfoCard reading={reading} />
      <ScientificFooter />
    </div>
  );
}

// ─── Coque commune (en-tête + corps scrollable + animation) ─────────────────

function ReportPanelShell({
  title, subtitle, onClose, children,
}: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <PanelShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      closeAriaLabel={`Fermer le panneau ${title.toLowerCase()}`}
      closeContent={<X className="size-3.5 shrink-0" strokeWidth={1.4} aria-hidden />}
      closeButtonClassName="h-8 w-8 p-0"
      bodyClassName="overflow-y-auto px-4 py-4 text-slate-200"
      animationKey={title}
    >
      {children}
    </PanelShell>
  );
}

// ─── États vides (locked previews) ───────────────────────────────────────────

/**
 * Shared locked-state wrapper. Each panel provides its own preview
 * (the visual "what you'll get") and tagline; the wrapper handles the
 * common chrome — eyebrow label, headline, tagline. The natal form lives
 * permanently at the top of the sidebar, so the stub no longer needs
 * its own CTA — users are funneled straight to the always-visible form.
 */
function LockedStub({
  preview,
  headline,
  tagline,
}: {
  preview: ReactNode;
  headline: string;
  tagline: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 px-1 pt-2 pb-4 text-center">
      <div
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center
                   pt-2 pb-1 text-violet-200"
      >
        {preview}
      </div>

      <div className="space-y-2 text-slate-300">
        <div className="text-cockpit-xs tracking-cockpit-label uppercase text-violet-300/70">
          Aperçu verrouillé
        </div>
        <h2
          className="text-accent-title text-cockpit-lg tracking-cockpit-tight
                     font-medium uppercase"
        >
          {headline}
        </h2>
        <p className="text-cockpit-md leading-relaxed text-slate-300/95 px-2">
          {tagline}
        </p>
      </div>

      <p className="mt-auto pt-2 text-cockpit-xs tracking-cockpit-label
                    uppercase text-slate-500">
        Saisis tes coordonnées dans la barre latérale
      </p>
    </div>
  );
}

/* ── Previews ───────────────────────────────────────────────────────────── */

function ZodiacWheelPreview() {
  // 12 spokes + a single highlighted arc segment hint at the eventual
  // RadarWheel — without revealing which constellation is "yours".
  const spokes = Array.from({ length: 12 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-28 animate-rail-breathe"
      role="presentation"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeDasharray="2 2"
        opacity="0.5"
      />
      <circle
        cx="50"
        cy="50"
        r="34"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.3"
        opacity="0.35"
      />
      {spokes.map((i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={50 + 34 * Math.cos(a)}
            y1={50 + 34 * Math.sin(a)}
            x2={50 + 46 * Math.cos(a)}
            y2={50 + 46 * Math.sin(a)}
            stroke="currentColor"
            strokeWidth="0.4"
            opacity="0.45"
          />
        );
      })}
      {/* Highlighted arc — top-right slice */}
      <path
        d="M 50 4 A 46 46 0 0 1 89.85 27 L 79.45 33 A 34 34 0 0 0 50 16 Z"
        fill="rgb(196 181 253 / 0.18)"
        stroke="rgb(196 181 253 / 0.55)"
        strokeWidth="0.4"
      />
      <circle cx="50" cy="50" r="1.6" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function SignePreview() {
  // Sun + ecliptic horizon + a lone "?" — visual question that the
  // panel will answer once data is entered.
  return (
    <div className="relative size-28 animate-rail-breathe">
      <svg viewBox="0 0 100 100" className="size-full">
        <line
          x1="8" y1="62" x2="92" y2="62"
          stroke="rgb(196 181 253 / 0.45)"
          strokeWidth="0.5"
          strokeDasharray="3 2"
        />
        <circle
          cx="50" cy="50" r="11"
          fill="rgb(252 211 77 / 0.18)"
          stroke="rgb(252 211 77 / 0.75)"
          strokeWidth="0.6"
        />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={50 + 14 * Math.cos(a)}
              y1={50 + 14 * Math.sin(a)}
              x2={50 + 19 * Math.cos(a)}
              y2={50 + 19 * Math.sin(a)}
              stroke="rgb(252 211 77 / 0.65)"
              strokeWidth="0.6"
            />
          );
        })}
      </svg>
      <span
        aria-hidden="true"
        className="absolute -top-1 right-3 text-cockpit-xl
                   text-violet-200 font-medium"
      >
        ?
      </span>
    </div>
  );
}

function LectureSkeletonPreview() {
  // Article-style content skeleton: heading + paragraph lines.
  return (
    <div className="w-full max-w-[200px] space-y-2 opacity-65">
      <div className="h-2 w-2/3 rounded-full bg-violet-300/55" />
      <div className="space-y-1.5 pt-1">
        <div className="h-1.5 w-full rounded-full bg-violet-300/35" />
        <div className="h-1.5 w-[92%] rounded-full bg-violet-300/35" />
        <div className="h-1.5 w-[78%] rounded-full bg-violet-300/30" />
      </div>
      <div className="space-y-1.5 pt-2">
        <div className="h-1.5 w-[88%] rounded-full bg-violet-300/30" />
        <div className="h-1.5 w-[95%] rounded-full bg-violet-300/30" />
      </div>
    </div>
  );
}

function DonneesTablePreview() {
  // Looks like the eventual AstroInfoCard's leftmost column.
  const rows: Array<[string, string]> = [
    ['α☉', '——h ——m'],
    ['δ☉', '——° ——′'],
    ['GST', '——h ——m'],
    ['ε', '——° ——′'],
  ];
  return (
    <div className="w-full max-w-[200px] font-mono opacity-75">
      {rows.map(([k, v], i) => (
        <div
          key={k}
          className={`flex items-baseline justify-between
                      px-2 py-1 text-cockpit-md
                      ${i < rows.length - 1
                        ? 'border-b border-violet-300/15'
                        : ''}`}
        >
          <span className="tracking-cockpit-tight text-violet-200/80">{k}</span>
          <span className="text-slate-400">{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Stubs ──────────────────────────────────────────────────────────────── */

function ResumeStub() {
  return (
    <LockedStub
      preview={<SignePreview />}
      headline="Ton vrai signe, dans le ciel réel"
      tagline={
        <>
          Le Soleil n&apos;était presque jamais dans la constellation de ton
          horoscope. En 2 000 ans, l&apos;axe de la Terre a glissé d&apos;environ
          une constellation entière — voici ton ciel{' '}
          <strong className="text-amber-200 font-medium">
            astronomique exact
          </strong>
          , dérive comprise.
        </>
      }
    />
  );
}

function CarteStub() {
  return (
    <LockedStub
      preview={<ZodiacWheelPreview />}
      headline="La roue des vraies constellations"
      tagline={
        <>
          Soleil, Lune et planètes projetés sur les{' '}
          <strong className="text-violet-200 font-medium">
            13 constellations
          </strong>{' '}
          qu&apos;ils traversent réellement — frontières fixées par
          l&apos;Union astronomique internationale (1930), pas les
          12 cases égales du zodiaque.
        </>
      }
    />
  );
}

function LectureStub() {
  return (
    <LockedStub
      preview={<LectureSkeletonPreview />}
      headline="Comprendre ta carte"
      tagline={
        <>
          Le <span className="text-amber-200">Soleil</span> (ta vraie
          constellation), la <span className="text-slate-200">Lune</span>{' '}
          (sa phase exacte) et l&apos;
          <span className="text-emerald-200">ascendant</span> (le point
          d&apos;horizon est qui se levait à ta naissance) — leur
          définition astronomique, et comment les repérer dans le ciel.
        </>
      }
    />
  );
}

function DonneesStub() {
  return (
    <LockedStub
      preview={<DonneesTablePreview />}
      headline="Astronomie de position"
      tagline={
        <>
          Ascension droite, déclinaison, temps sidéral, obliquité de
          l&apos;écliptique : les{' '}
          <strong className="text-violet-200 font-medium">coordonnées brutes</strong>{' '}
          du ciel à ta naissance — l&apos;équivalent céleste de la
          latitude et de la longitude (Meeus 1998 · JPL · IAU&nbsp;1930).
        </>
      }
    />
  );
}

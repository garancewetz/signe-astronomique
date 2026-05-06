import { motion, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';
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
} from './MissionLog';
import { PanelPlaceholder } from './ui/PanelPlaceholder';
import type { CelestialReading } from '../utils/astroEngine';

export type ReportPanelKey = 'resume' | 'carte' | 'lecture' | 'donnees';

interface PanelProps {
  reading: CelestialReading | null;
  onClose: () => void;
}

// ─── Panneau RÉSUMÉ ──────────────────────────────────────────────────────────

export function ResumePanel({ reading, onClose }: PanelProps) {
  return (
    <PanelShell title="RÉSUMÉ" subtitle="L’ESSENTIEL DE TON CIEL" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[11.5px]">
          <BirthHeader reading={reading} />
          <ResumeCard reading={reading} />
          <AscendantCard reading={reading} />
        </div>
      ) : (
        <Empty />
      )}
    </PanelShell>
  );
}

// ─── Panneau CARTE ───────────────────────────────────────────────────────────

export function CartePanel({ reading, onClose }: PanelProps) {
  return (
    <PanelShell title="CARTE" subtitle="ROUE DES CONSTELLATIONS" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[11.5px]">
          <RadarWheel reading={reading} />
          <PlanetTable reading={reading} />
        </div>
      ) : (
        <CarteStub />
      )}
    </PanelShell>
  );
}

// ─── Panneau LECTURE ─────────────────────────────────────────────────────────

export function LecturePanel({ reading, onClose }: PanelProps) {
  return (
    <PanelShell title="LECTURE" subtitle="COMPRENDRE TA CARTE" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[11.5px]">
          <HowToRead />
          <NotesCard reading={reading} />
        </div>
      ) : (
        <LectureStub />
      )}
    </PanelShell>
  );
}

// ─── Panneau DONNÉES ─────────────────────────────────────────────────────────

export function DonneesPanel({ reading, onClose }: PanelProps) {
  return (
    <PanelShell title="DONNÉES" subtitle="ASTRONOMIE BRUTE" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[11.5px]">
          <AstroInfoCard reading={reading} />
          <ScientificFooter />
        </div>
      ) : (
        <DonneesStub />
      )}
    </PanelShell>
  );
}

// ─── Rapport complet (export PNG) ────────────────────────────────────────────

/**
 * Toutes les sections empilées. Rendu hors-écran et utilisé uniquement
 * pour l'export PNG : c'est ce qui est dessiné à droite de la vue 3D.
 */
export function FullReport({ reading }: { reading: CelestialReading }) {
  return (
    <div className="space-y-3 text-[11.5px] px-4 py-4">
      <BirthHeader reading={reading} />
      <ResumeCard reading={reading} />
      <AscendantCard reading={reading} />
      <RadarWheel reading={reading} />
      <PlanetTable reading={reading} />
      <HowToRead />
      <NotesCard reading={reading} />
      <AstroInfoCard reading={reading} />
      <ScientificFooter />
    </div>
  );
}

// ─── Coque commune (en-tête + corps scrollable + animation) ─────────────────

function PanelShell({
  title, subtitle, onClose, children,
}: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-start justify-between gap-2 px-4 py-3 border-b border-violet-400/25">
        <div className="min-w-0">
          <div className="text-[9px] tracking-[0.35em] text-violet-400 mb-0.5">
            {subtitle}
          </div>
          <h2 className="text-[11px] tracking-[0.2em] text-violet-100">
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cockpit-focus shrink-0 inline-flex items-center justify-center
                     h-8 w-8 rounded-sm border border-violet-400/30
                     hover:border-violet-300 hover:bg-violet-500/15
                     text-slate-300 hover:text-white transition"
          aria-label={`Fermer le panneau ${title.toLowerCase()}`}
        >
          <CloseIcon />
        </button>
      </header>

      <motion.div
        key={title}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.3 }}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── États vides ─────────────────────────────────────────────────────────────

function Empty() {
  return (
    <div className="text-slate-400 text-xs leading-relaxed mt-4 px-1">
      <div className="text-4xl mb-4 opacity-25 text-center">◇</div>
      <h2 className="text-violet-200 text-[11px] tracking-[0.2em] font-medium mb-3 text-center uppercase">
        Ton vrai signe, lu dans le ciel réel
      </h2>
      <p className="mb-2.5 text-slate-300">
        Ton <strong className="text-violet-200 font-medium">signe astrologique</strong>{' '}
        vient d&apos;un découpage du zodiaque figé il y a 2&nbsp;000 ans, à
        l&apos;époque de Ptolémée. Depuis, la <em>précession des équinoxes</em> —
        un lent basculement de l&apos;axe terrestre, qui décrit un cône complet
        en environ 26&nbsp;000 ans — a décalé le ciel d&apos;à peu près un
        signe entier.
      </p>
      <p className="mb-2.5 text-slate-300">
        Le jour de ta naissance, le Soleil ne se trouvait donc presque jamais
        dans la constellation annoncée par ton horoscope. Sa vraie position,
        c&apos;est ton{' '}
        <strong className="text-amber-200 font-medium">signe astronomique</strong>{' '}
        — la constellation IAU réellement traversée sur l&apos;écliptique.
      </p>
      <p className="mb-2.5 text-slate-300">
        Saisis ta date, ton heure et ton lieu de naissance : on dessine ta{' '}
        <strong className="text-violet-200 font-medium">carte du ciel</strong>{' '}
        avec le Soleil, la Lune, les planètes et ton{' '}
        <strong className="text-emerald-200 font-medium">ascendant</strong>{' '}
        astronomique, calculés en astronomie de position.
      </p>
      <p className="text-slate-500 text-[10px] italic">
        Ophiuchus — le 13ᵉ signe écarté par les douze cases du calendrier — est
        inclus : le Soleil y passe environ 18&nbsp;jours par an, c&apos;est un
        fait observable, pas une opinion.
      </p>
    </div>
  );
}

function CarteStub() {
  return (
    <PanelPlaceholder>
      <p className="text-slate-300 mb-2.5">
        Ici se dessinera ta{' '}
        <strong className="text-violet-200 font-medium">carte du ciel astronomique</strong>{' '}
        — la <em>roue des constellations IAU</em> traversées par le Soleil, la
        Lune et les planètes au moment exact de ta naissance, projetées sur
        l&apos;écliptique réelle plutôt que sur le zodiaque tropical figé.
      </p>
      <p className="text-slate-500 text-[10px]">
        Saisis tes coordonnées dans{' '}
        <span className="text-violet-200 font-medium">COORDONNÉES</span> pour
        afficher la roue, la table des planètes et l&apos;ascendant.
      </p>
    </PanelPlaceholder>
  );
}

function LectureStub() {
  return (
    <PanelPlaceholder>
      <p className="text-slate-300 mb-2.5">
        Comment lire ton{' '}
        <strong className="text-violet-200 font-medium">thème astronomique</strong>{' '}
        : signe solaire réel, position lunaire, ascendant calculé sur
        l&apos;horizon de ton lieu de naissance, et le rôle d&apos;<em>Ophiuchus</em>{' '}
        — le 13ᵉ signe écarté par l&apos;astrologie tropicale.
      </p>
      <p className="text-slate-500 text-[10px]">
        Une fois ta carte calculée, la lecture détaillée et les notes de
        constellations s&apos;afficheront ici.
      </p>
    </PanelPlaceholder>
  );
}

function DonneesStub() {
  return (
    <PanelPlaceholder>
      <p className="text-slate-300 mb-2.5">
        <strong className="text-violet-200 font-medium">Éphémérides</strong>{' '}
        et données brutes : longitudes écliptiques, déclinaisons, ascension
        droite, temps sidéral local — calculés selon les algorithmes de{' '}
        <em>Meeus 1998</em> avec les éphémérides JPL et les frontières IAU
        1930.
      </p>
      <p className="text-slate-500 text-[10px]">
        Saisis date, heure et lieu pour générer les positions exactes au
        moment de ta naissance.
      </p>
    </PanelPlaceholder>
  );
}

// ─── Icône ───────────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden>
      <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
    </svg>
  );
}

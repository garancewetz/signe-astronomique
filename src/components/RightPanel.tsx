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
import { PanelPlaceholder, PanelShell } from './ui';
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

// ─── Panneau RÉSUMÉ ──────────────────────────────────────────────────────────

export function ResumePanel({ reading, onClose }: PanelProps) {
  return (
    <ReportPanelShell title="RÉSUMÉ" subtitle="L’ESSENTIEL DE TON CIEL" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[13px] leading-relaxed">
          <BirthHeader reading={reading} />
          <ResumeCard reading={reading} />
          <AscendantCard reading={reading} />
        </div>
      ) : (
        <Empty />
      )}
    </ReportPanelShell>
  );
}

// ─── Panneau CARTE ───────────────────────────────────────────────────────────

export function CartePanel({ reading, onClose }: PanelProps) {
  return (
    <ReportPanelShell title="CARTE" subtitle="ROUE DES CONSTELLATIONS" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[13px] leading-relaxed">
          <RadarWheel reading={reading} />
          <PlanetTable reading={reading} />
        </div>
      ) : (
        <CarteStub />
      )}
    </ReportPanelShell>
  );
}

// ─── Panneau LECTURE ─────────────────────────────────────────────────────────

export function LecturePanel({ reading, satellitesEnabled, onClose }: LecturePanelProps) {
  return (
    <ReportPanelShell title="LECTURE" subtitle="COMPRENDRE TA CARTE" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[13px] leading-relaxed">
          <HowToRead />
          <NotesCard reading={reading} />
          {satellitesEnabled && (
            <RelicsOracleCard birthDate={reading.input.date} />
          )}
        </div>
      ) : (
        <LectureStub />
      )}
    </ReportPanelShell>
  );
}

/**
 * "Oracle" card for orbital relics — shown in LECTURE while the layer is
 * active. Two states:
 *   - silence: birth before 1957 (Sputnik hadn't launched yet);
 *   - list   : every relic launched on or before the natal date.
 */
function RelicsOracleCard({ birthDate }: { birthDate: Date }) {
  if (isSilentEra(birthDate)) {
    return (
      <div className="rounded-sm border border-violet-400/25 bg-[#0d0820]/70
                      p-4 space-y-2">
        <div className="text-[8.5px] tracking-[0.3em] text-violet-300/75">
          ORACLE · RELIQUES ORBITALES
        </div>
        <p className="text-amber-100/85 italic text-[13px] leading-relaxed">
          « En cette année, l’orbite de la Terre n’appartenait qu’au silence. »
        </p>
        <p className="text-slate-400 text-[10.5px] leading-relaxed">
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
      <div className="text-[8.5px] tracking-[0.3em] text-cyan-300/75">
        ORACLE · RELIQUES ORBITALES
      </div>
      <p className="text-slate-300 text-[12px] leading-relaxed">
        Au moment de ta naissance, ces objets humains tournaient (ou
        avaient déjà tourné) autour de la Terre :
      </p>
      <ul className="space-y-1.5 text-[11.5px]">
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
              <div className="text-slate-400 italic text-[10.5px] leading-snug">
                {r.blurb}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Panneau DONNÉES ─────────────────────────────────────────────────────────

export function DonneesPanel({ reading, onClose }: PanelProps) {
  return (
    <ReportPanelShell title="DONNÉES" subtitle="ASTRONOMIE BRUTE" onClose={onClose}>
      {reading ? (
        <div className="space-y-3 text-[13px] leading-relaxed">
          <AstroInfoCard reading={reading} />
          <ScientificFooter />
        </div>
      ) : (
        <DonneesStub />
      )}
    </ReportPanelShell>
  );
}

// ─── Rapport complet (export PNG) ────────────────────────────────────────────

/**
 * Toutes les sections empilées. Rendu hors-écran et utilisé uniquement
 * pour l'export PNG : c'est ce qui est dessiné à droite de la vue 3D.
 */
export function FullReport({ reading }: { reading: CelestialReading }) {
  return (
    <div className="space-y-3 text-[13px] leading-relaxed px-4 py-4">
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

function ReportPanelShell({
  title, subtitle, onClose, children,
}: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <PanelShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      closeAriaLabel={`Fermer le panneau ${title.toLowerCase()}`}
      closeContent={<CloseIcon />}
      closeButtonClassName="h-8 w-8 p-0"
      bodyClassName="overflow-y-auto px-4 py-4 text-slate-200"
      animationKey={title}
    >
      {children}
    </PanelShell>
  );
}

// ─── États vides ─────────────────────────────────────────────────────────────

function Empty() {
  return (
    <div className="text-slate-300 text-[13px] leading-relaxed mt-4 px-1">
      <div className="text-4xl mb-4 opacity-25 text-center">◇</div>
      <h2 className="text-violet-100 text-[12.5px] tracking-[0.14em] font-medium mb-3 text-center uppercase">
        Ton vrai signe, lu dans le ciel réel
      </h2>
      <p className="mb-2.5 text-slate-200">
        Ton <strong className="text-violet-200 font-medium">signe astrologique</strong>{' '}
        vient d&apos;un découpage du zodiaque figé il y a 2&nbsp;000 ans, à
        l&apos;époque de Ptolémée. Depuis, la <em>précession des équinoxes</em> —
        un lent basculement de l&apos;axe terrestre, qui décrit un cône complet
        en environ 26&nbsp;000 ans — a décalé le ciel d&apos;à peu près un
        signe entier.
      </p>
      <p className="mb-2.5 text-slate-200">
        Le jour de ta naissance, le Soleil ne se trouvait donc presque jamais
        dans la constellation annoncée par ton horoscope. Sa vraie position,
        c&apos;est ton{' '}
        <strong className="text-amber-200 font-medium">signe astronomique</strong>{' '}
        — la constellation IAU réellement traversée sur l&apos;écliptique.
      </p>
      <p className="mb-2.5 text-slate-200">
        Saisis ta date, ton heure et ton lieu de naissance : on dessine ta{' '}
        <strong className="text-violet-200 font-medium">carte du ciel</strong>{' '}
        avec le Soleil, la Lune, les planètes et ton{' '}
        <strong className="text-emerald-200 font-medium">ascendant</strong>{' '}
        astronomique, calculés en astronomie de position.
      </p>
      <p className="text-slate-400 text-[11px] italic">
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

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden>
      <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
    </svg>
  );
}

import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';

const SECTIONS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'NASA',
    links: [
      {
        label: 'Science — système solaire (missions, données)',
        href: 'https://science.nasa.gov/solar-system/',
      },
      {
        label: 'Science — univers (galaxies, trous noirs, cosmologie)',
        href: 'https://science.nasa.gov/universe/',
      },
      {
        label: 'Image du jour (APOD)',
        href: 'https://apod.nasa.gov/apod/astropix.html',
      },
      {
        label: 'James Webb Space Telescope',
        href: 'https://webb.nasa.gov/',
      },
      {
        label: 'NASA+ — vidéos et directs',
        href: 'https://plus.nasa.gov/',
      },
    ],
  },
  {
    title: 'ESA & partenaires',
    links: [
      {
        label: 'ESA — exploration scientifique',
        href: 'https://www.esa.int/Science_Exploration/Space_Science',
      },
      {
        label: 'Gaia — carte de milliards d’étoiles',
        href: 'https://www.cosmos.esa.int/web/gaia',
      },
      {
        label: 'Hubble / observations',
        href: 'https://esahubble.org/',
      },
    ],
  },
  {
    title: 'Cartes du ciel & éphemerides',
    links: [
      {
        label: 'Stellarium Web — ciel interactif',
        href: 'https://stellarium-web.org/',
      },
      {
        label: 'TheSkyLive — positions planètes et comètes',
        href: 'https://theskylive.com/',
      },
      {
        label: 'Heavens-Above — passages ISS et satellites',
        href: 'https://www.heavens-above.com/',
      },
    ],
  },
  {
    title: 'Données & pédagogie',
    links: [
      {
        label: 'JPL Horizons — éphémérides précises',
        href: 'https://ssd.jpl.nasa.gov/horizons/',
      },
      {
        label: 'NASA SpacePlace — vulgarisation jeunes publics',
        href: 'https://spaceplace.nasa.gov/',
      },
      {
        label: 'IAU — astronomie et nomenclature',
        href: 'https://www.iau.org/',
      },
    ],
  },
];

interface Props {
  onClose: () => void;
}

export function ExploreSpacePopover({ onClose }: Props) {
  const reduceMotion = useReducedMotion();
  return createPortal(
    <motion.div
      role="presentation"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overflow-x-hidden overscroll-contain
                 p-4
                 pt-[max(1rem,env(safe-area-inset-top,0px))]
                 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre En savoir plus"
        className="fixed inset-0 z-0 bg-[#030014]/75 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="explore-space-title"
        className="relative z-10 w-[min(34rem,calc(100vw-2rem))] min-h-0 min-w-0
                   max-h-[min(75vh,32rem,calc(100svh-2rem))]
                   flex flex-col
                   bg-[#100828]/98 backdrop-blur-xl
                   border border-violet-400/35 rounded-sm
                   shadow-[0_12px_48px_rgba(0,0,0,0.85)] overflow-hidden"
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-violet-500/15">
          <div>
            <div
              id="explore-space-title"
              className="text-[10px] tracking-[0.28em] text-violet-300"
            >
              CONTINUER À EXPLORER LE CIEL
            </div>
            <p className="text-[9px] text-slate-500 mt-1 leading-snug">
              Si la précession et le ciel réel t’intriguent : observatoires, cartes
              du ciel interactives, éphémérides, vulgarisation. Sources officielles
              (NASA, ESA, IAU). Les liens s’ouvrent dans un nouvel onglet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cockpit-focus shrink-0 inline-flex items-center gap-2 h-9 px-2.5 rounded-sm border border-violet-400/20
                       text-slate-400 hover:text-white hover:bg-violet-500/15 transition text-[9px] tracking-[0.18em]"
            aria-label="Fermer"
          >
            <CloseIcon />
            <span>FERMER</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-5">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-[8px] tracking-[0.35em] text-violet-400/75 mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-2 text-[11px] leading-snug text-slate-300
                                 hover:text-violet-200 transition-colors"
                    >
                      <span className="text-violet-500/80 group-hover:text-violet-400 shrink-0 mt-0.5">
                        ↗
                      </span>
                      <span className="min-w-0 wrap-break-word underline decoration-violet-500/25 underline-offset-2 group-hover:decoration-violet-400/50">
                        {link.label}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </motion.div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0" aria-hidden>
      <path d="M5 5l8 8M13 5l-8 8" strokeLinecap="round" />
    </svg>
  );
}

export function InfoCircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.35">
      <circle cx="9" cy="9" r="7" />
      <path d="M9 8v5" strokeLinecap="round" />
      <circle cx="9" cy="5.3" r="0.55" fill="currentColor" stroke="none" />
    </svg>
  );
}

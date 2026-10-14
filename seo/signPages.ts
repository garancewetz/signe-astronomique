/**
 * Static, indexable sign pages generated at build time: one page per true
 * sign (/signe/<slug>/), an index (/signes/) and the sitemap. Plain HTML +
 * inline CSS — no React, no Cesium — so crawlers and slow phones get the
 * whole page in one request. Wired into the build by `signPagesPlugin` in
 * vite.config.ts, which also adds the CSP.
 */
import type { IauConstellation } from '../src/features/astronomy/astroEngine';
import { CONSTELLATION_LORE } from '../src/features/astronomy/constellationLore';
import {
  IAU_RUNS,
  REFERENCE_YEAR,
  SIGN_FR,
  SKY_TIP,
  TIMELINE,
  TROPICAL_RUNS,
  ZODIAC_ORDER,
  frDay,
  frDayShort,
  frMonth,
  frRange,
  frSpan,
  majority,
  oppositionIndex,
  shiftDays,
  splitBy,
  type Run,
} from './signData';

export const SITE_URL = 'https://signe-astronomique.netlify.app';
const SITE_NAME = 'Signe astronomique';

export interface StaticPage {
  /** Output path inside dist, e.g. "signe/balance/index.html". */
  fileName: string;
  html: string;
}

interface Faq {
  q: string;
  a: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Capitalize the first letter: « la Balance » → « La Balance ». */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const signPath = (c: IauConstellation) => `/signe/${SIGN_FR[c].slug}/`;

function signLink(c: IauConstellation, label = `${SIGN_FR[c].glyph} ${SIGN_FR[c].name}`): string {
  return `<a href="${signPath(c)}">${esc(label)}</a>`;
}

const plural = (n: number) => (n > 1 ? 's' : '');

/** JSON-LD body, with `<` escaped so the JSON can never close the script. */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// ─── Shared layout ──────────────────────────────────────────────────────────

const CSS = `
:root { color-scheme: dark; }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124, 58, 237, 0.28), transparent 70%),
    #060210;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 300;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
}
a { color: #c4b5fd; text-underline-offset: 3px; }
a:hover { color: #f5f3ff; }
a:focus-visible { outline: 2px solid #a78bfa; outline-offset: 2px; border-radius: 4px; }
strong { font-weight: 500; color: #e9d5ff; }
.wrap { max-width: 90rem; margin: 0 auto; padding: 1rem 16px 3rem; }
.narrow { max-width: 48rem; margin-inline: auto; }
.top { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem 1rem; font-size: 0.78rem; color: #94a3b8; }
.top a { color: #94a3b8; text-decoration: none; }
.top a:hover { color: #e2e8f0; }
.brand { color: #e2e8f0 !important; font-weight: 500; letter-spacing: 0.02em; }
.crumbs ol { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: 0; padding: 0; list-style: none; }
.crumbs li + li::before { content: '›'; margin-right: 0.35rem; color: #64748b; }
.hero { max-width: 48rem; margin: 2.5rem auto 2rem; text-align: center; }
.hero__glyph { font-size: 4rem; line-height: 1; color: #fde68a; text-shadow: 0 0 22px rgba(252, 211, 77, 0.45); }
h1 { margin: 0.75rem 0 1rem; font-size: clamp(1.45rem, 5.5vw, 2.1rem); font-weight: 600; line-height: 1.3; letter-spacing: -0.01em; color: #f8fafc; text-shadow: 0 0 24px rgba(124, 58, 237, 0.35); text-wrap: balance; }
.answer { margin: 0 auto; max-width: 34rem; font-size: 1.05rem; color: #cbd5e1; }
.answer strong { color: #fde68a; }
.cta { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; min-height: 3rem; padding: 0.8rem 1.6rem; border: 1px solid rgba(167, 139, 250, 0.6); border-radius: 0.7rem; background: rgba(124, 58, 237, 0.35); color: #f5f3ff; font-size: 0.95rem; font-weight: 500; letter-spacing: 0.02em; text-decoration: none; box-shadow: 0 0 40px rgba(124, 58, 237, 0.25); transition: background 0.15s ease, border-color 0.15s ease; }
.cta:hover { background: rgba(124, 58, 237, 0.55); border-color: rgba(167, 139, 250, 0.9); color: #fff; }
.card { margin: 1.25rem 0; padding: 1.25rem clamp(1rem, 4vw, 1.75rem); border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 1rem; background: rgba(13, 8, 30, 0.75); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3), 0 18px 50px rgba(0, 0, 0, 0.4); }
h2 { margin: 0 0 0.85rem; font-size: 1.02rem; font-weight: 500; line-height: 1.4; color: #c4b5fd; }
p { margin: 0 0 0.85rem; font-size: 0.9rem; color: #cbd5e1; }
p:last-child { margin-bottom: 0; }
.muted { color: #94a3b8; font-size: 0.8rem; }
.rows { margin: 0 0 0.85rem; padding: 0; list-style: none; }
.rows li { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 1rem; padding: 0.6rem 0; border-bottom: 1px solid rgba(148, 163, 184, 0.12); font-size: 0.88rem; }
.rows li:last-child { border-bottom: 0; }
.rows .when { color: #cbd5e1; }
.rows .what { font-weight: 500; }
.rows .main .what a { color: #fde68a; }
.rows .ok { color: #6ee7b7; font-size: 0.78rem; }
.facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0 0 1rem; }
.fact { padding: 0.75rem; border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 0.7rem; background: rgba(30, 20, 55, 0.45); }
.fact__label { display: block; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
.fact__value { display: block; margin-top: 0.2rem; font-size: 0.92rem; font-weight: 500; color: #f8fafc; }
.fact--old .fact__value { color: #94a3b8; text-decoration: line-through; text-decoration-color: rgba(100, 116, 139, 0.8); }
.fact--gold { border-color: rgba(252, 211, 77, 0.4); background: rgba(251, 191, 36, 0.08); }
.fact--gold .fact__value { color: #fde68a; }
.wheel { display: block; width: 100%; max-width: 30rem; height: auto; margin: 0.5rem auto 1rem; }
.wheel a { cursor: pointer; }
.wheel a:hover path { filter: brightness(1.5); }
.wheel a:focus { outline: none; }
.wheel a:focus-visible path, .wheel a.is-selected path { stroke: #fde68a; stroke-width: 2.5; }
.wheel-info { text-align: center; font-size: 0.8rem; color: #94a3b8; }
.wheel-info.is-filled { padding: 0.7rem 1rem; border: 1px solid rgba(148, 163, 184, 0.15); border-radius: 0.7rem; background: rgba(30, 20, 55, 0.45); text-align: left; }
.wheel-info p { margin: 0 0 0.3rem; font-size: 0.85rem; }
.wheel-info .wheel-info__title { font-weight: 500; color: #fde68a; }
.wheel-info .wheel-info__link { display: inline-block; margin-top: 0.2rem; }
.aside .cta { display: flex; margin-top: 1rem; }
.aside-desktop { display: none; }
.page { display: grid; grid-template-columns: minmax(0, 1fr); }
.page > .aside { order: -1; }
.signs-grid { display: grid; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 64rem) {
  .page { grid-template-columns: minmax(0, 48rem) minmax(0, 30rem); gap: 0 3rem; justify-content: center; align-items: start; }
  .page > .aside { order: 0; margin-top: 1.25rem; }
  .aside-desktop { display: block; }
  .signs-grid { grid-template-columns: minmax(0, 40rem) minmax(0, 46rem); gap: 0 2.5rem; justify-content: center; align-items: start; }
  /* The wheel shrinks with the screen height so the sticky card always fits
     (room left for the title, legend, detail panel and CTA). */
  .page .wheel { max-width: min(26rem, calc(100vh - 22rem)); margin-top: 0; }
  .signs-grid .wheel { max-width: min(34rem, calc(100vh - 21rem)); }
}
/* Sticky only when the card fits on screen — never a scroll box inside. */
@media (min-width: 64rem) and (min-height: 40rem) {
  .page > .aside, .signs-grid > .wheel-card { position: sticky; top: 1rem; }
}
tr.is-selected td { background: rgba(252, 211, 77, 0.1); }
.legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.3rem 1rem; margin: 0 0 0.6rem; font-size: 0.74rem; color: #94a3b8; }
.legend i { display: inline-block; width: 0.8rem; height: 0.8rem; margin-right: 0.4rem; border-radius: 3px; vertical-align: -0.1rem; }
.sky { display: block; width: 100%; max-width: 24rem; height: auto; margin: 0 auto 1rem; }
dl { margin: 0 0 0.85rem; }
dt { font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
dd { margin: 0.15rem 0 0.85rem; font-size: 0.9rem; color: #cbd5e1; }
.faq h3 { margin: 1.2rem 0 0.4rem; font-size: 0.92rem; font-weight: 500; color: #e9d5ff; }
.faq h3:first-of-type { margin-top: 0; }
.table-wrap { overflow-x: auto; margin: 0 -0.25rem 0.85rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
th, td { padding: 0.6rem 0.4rem; border-bottom: 1px solid rgba(148, 163, 184, 0.12); text-align: left; vertical-align: top; }
th { font-size: 0.66rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; }
td.num, .nw { white-space: nowrap; }
td.old { color: #94a3b8; }
tr.star td { background: rgba(251, 191, 36, 0.06); }
.pager { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.75rem; margin-top: 2rem; font-size: 0.85rem; }
.pager a { display: inline-flex; align-items: center; min-height: 2.75rem; padding: 0.4rem 0.85rem; border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 0.6rem; background: rgba(30, 20, 55, 0.5); text-decoration: none; }
.pager a:hover { border-color: rgba(167, 139, 250, 0.6); }
.pager .all { margin: 0 auto; }
.foot { margin-top: 2rem; text-align: center; font-size: 0.75rem; color: #64748b; }
@media (max-width: 30rem) {
  .pager { justify-content: center; }
  .pager .all { order: -1; flex-basis: 100%; text-align: center; }
  .pager .all a { justify-content: center; }
}
`;

// Hovering a table row lights its constellation on the wheel, and back.
const LINK_CSS = ZODIAC_ORDER.map(c => {
  const slug = SIGN_FR[c].slug;
  return `.signs-grid:has(tr[data-sign="${slug}"]:hover) .wheel a[data-sign="${slug}"][data-kind="sky"] path { filter: brightness(1.7); }
.signs-grid:has(.wheel a[data-sign="${slug}"]:hover) tr[data-sign="${slug}"] td { background: rgba(167, 139, 250, 0.12); }`;
}).join('\n');

/**
 * Progressive enhancement for the wheel: a click shows the part's dates in
 * the panel under it instead of navigating (no page reload, no jump to the
 * top). Without JS the parts stay plain links to the sign pages. Built with
 * textContent only; the CSP allows it through its build-time hash.
 */
const WHEEL_SCRIPT = `(() => {
  for (const box of document.querySelectorAll('.wheel-box')) {
    const info = box.querySelector('.wheel-info');
    box.addEventListener('click', (e) => {
      const a = e.target.closest('.wheel a');
      if (!a || !info) return;
      e.preventDefault();
      for (const el of document.querySelectorAll('.is-selected')) el.classList.remove('is-selected');
      a.classList.add('is-selected');
      document.querySelector('tr[data-sign="' + a.dataset.sign + '"]')?.classList.add('is-selected');
      const add = (tag, cls, text) => {
        const el = document.createElement(tag);
        el.className = cls;
        el.textContent = text;
        info.append(el);
        return el;
      };
      info.replaceChildren();
      info.classList.add('is-filled');
      add('p', 'wheel-info__title', a.dataset.title);
      add('p', '', a.dataset.dates);
      add('p', 'muted', a.dataset.note);
      const href = a.getAttribute('href');
      if (href !== location.pathname) {
        add('a', 'wheel-info__link', 'Voir la page ' + a.dataset.name + ' →').href = href;
      }
    });
  }
})();`;

interface LayoutInput {
  path: string;
  title: string;
  description: string;
  /** Visible breadcrumb, also emitted as BreadcrumbList. */
  crumbs: Array<{ name: string; path: string }>;
  faq: Faq[];
  body: string;
}

function layout({ path, title, description, crumbs, faq, body }: LayoutInput): string {
  const url = `${SITE_URL}${path}`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: title,
        description,
        inLanguage: 'fr-FR',
        isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/` },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: `${SITE_URL}${c.path}`,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(f => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  const crumbsHtml = crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<li aria-current="page">${esc(c.name)}</li>`
        : `<li><a href="${c.path}">${esc(c.name)}</a></li>`,
    )
    .join('');

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#060210" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="apple-touch-icon" href="/favicon.svg" />
    <meta property="og:type" content="article" />
    <meta property="og:locale" content="fr_FR" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.png" />
    <script type="application/ld+json">${jsonLd(graph)}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet" />
    <style>${CSS}${LINK_CSS}</style>
  </head>
  <body>
    <div class="wrap">
      <header class="top">
        <a class="brand" href="/">✦ ${SITE_NAME}</a>
        <nav class="crumbs" aria-label="Fil d’Ariane"><ol>${crumbsHtml}</ol></nav>
      </header>
      <main>
${body}
      </main>
      <footer class="foot">
        Dates calculées pour ${REFERENCE_YEAR} selon les frontières officielles de l’Union astronomique internationale (IAU, 1930).
      </footer>
    </div>
    <script>${WHEEL_SCRIPT}</script>
  </body>
</html>
`;
}

function faqSection(faq: Faq[]): string {
  return `<section class="card faq" aria-labelledby="faq-title">
  <h2 id="faq-title">Questions fréquentes</h2>
  ${faq.map(f => `<h3>${esc(f.q)}</h3>\n  <p>${esc(f.a)}</p>`).join('\n  ')}
</section>`;
}

// ─── Sky alignment diagram (static twin of SkyAlignment in SignReveal.tsx) ──

/** A small generic star pattern drawn around (0, 0). */
const PATTERN: ReadonlyArray<[number, number]> = [
  [-14, -9], [-4, -13], [6, -4], [15, 5], [3, 12],
];

function skyAlignmentSvg(sign: IauConstellation): string {
  const i = ZODIAC_ORDER.indexOf(sign);
  const prev = ZODIAC_ORDER[(i - 1 + ZODIAC_ORDER.length) % ZODIAC_ORDER.length];
  const next = ZODIAC_ORDER[(i + 1) % ZODIAC_ORDER.length];
  const cx = 256;
  const cy = 80;
  const pts = PATTERN.map(([x, y]) => `${cx + x},${cy + y}`).join(' ');
  const stars = PATTERN.map(([x, y]) => `<circle cx="${cx + x}" cy="${cy + y}" r="1.8" fill="#fef3c7"/>`).join('');
  const label = (c: IauConstellation) => esc(`${SIGN_FR[c].glyph} ${SIGN_FR[c].name}`);

  return `<svg class="sky" viewBox="0 0 320 150" role="img" aria-label="${esc(`Depuis la Terre, on voit le Soleil devant la constellation ${SIGN_FR[sign].of}`)}" font-family="inherit">
    <ellipse cx="128" cy="80" rx="90" ry="30" fill="none" stroke="rgba(100,116,139,0.5)" stroke-dasharray="3 4"/>
    <line x1="46" y1="80" x2="226" y2="80" stroke="rgba(253,230,138,0.7)" stroke-width="1.2" stroke-dasharray="5 4"/>
    <path d="M 220 75 L 228 80 L 220 85" fill="none" stroke="rgba(253,230,138,0.7)" stroke-width="1.2"/>
    <text x="${cx}" y="22" text-anchor="middle" fill="#64748b" font-size="12">${label(prev)}</text>
    <text x="${cx}" y="146" text-anchor="middle" fill="#64748b" font-size="12">${label(next)}</text>
    <circle cx="${cx}" cy="${cy}" r="26" fill="rgba(252,211,77,0.1)" stroke="rgba(252,211,77,0.4)"/>
    <polyline points="${pts}" fill="none" stroke="#fde68a" stroke-width="1"/>
    ${stars}
    <text x="${cx}" y="122" text-anchor="middle" fill="#fde68a" font-size="15" font-weight="600">${label(sign)}</text>
    <circle cx="128" cy="80" r="20" fill="rgba(252,211,77,0.15)"/>
    <text x="128" y="81" text-anchor="middle" dominant-baseline="central" font-size="26">☀️</text>
    <text x="128" y="112" text-anchor="middle" fill="#cbd5e1" font-size="12">Soleil</text>
    <text x="32" y="81" text-anchor="middle" dominant-baseline="central" font-size="20">🌍</text>
    <text x="32" y="102" text-anchor="middle" fill="#cbd5e1" font-size="12">Terre</text>
  </svg>`;
}

// ─── Zodiac wheel: horoscope (12 equal parts) vs real sky (13 IAU parts) ────

const MONTH_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

const W = 420;
const C = W / 2;
/** Ring radii: outer = horoscope, inner = real sky. */
const R = { skyIn: 74, skyOut: 136, horoIn: 140, horoOut: 178, tick: 184, month: 199 };

/** Calendar angle of a day index (Jan 1 at the top, clockwise), radians. */
const dayAngle = (i: number) => ((i / TIMELINE.length) * 360 - 90) * (Math.PI / 180);

const pt = (r: number, a: number) =>
  `${(C + r * Math.cos(a)).toFixed(2)},${(C + r * Math.sin(a)).toFixed(2)}`;

/** First day index and length (in days) of a run — handles Dec → Jan wraps. */
function runSpan(run: { idx: number[] }): { start: number; days: number } {
  return { start: run.idx[0], days: run.idx.length };
}

/** Annulus sector from day `start` over `days` days, between radii r0 < r1. */
function sectorPath(start: number, days: number, r0: number, r1: number): string {
  const a0 = dayAngle(start);
  const a1 = dayAngle(start + days);
  const large = days > TIMELINE.length / 2 ? 1 : 0;
  return `M ${pt(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)} L ${pt(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)} Z`;
}

function sectorLabel(start: number, days: number, r: number, text: string, size: number, fill: string): string {
  const a = dayAngle(start + days / 2);
  const [x, y] = pt(r, a).split(',');
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${size}" fill="${fill}">${esc(text)}</text>`;
}

/**
 * Calendar wheel of the year: the outer ring is the horoscope (12 equal
 * signs), the inner ring the real sky (13 constellations, IAU sizes). Both
 * share the same calendar, so reading straight inward from a horoscope sign
 * shows which constellation the Sun is really in on those days.
 * `focus` (sign pages) outlines a run of days across both rings and lights
 * up the horoscope sign and the true constellation it is about.
 */
interface WheelFocus {
  /** Days outlined across both rings. */
  run: Run;
  /** Horoscope sign lit in the outer ring. */
  horoscope: IauConstellation;
  /** True constellation lit in the inner ring. */
  sky: IauConstellation;
  /** Legend text for the outline. */
  label: string;
}

/** Data read by WHEEL_SCRIPT to fill the info panel in place. */
function segmentData(sign: IauConstellation, kind: 'sky' | 'horo', dates: string, note: string): string {
  const fr = SIGN_FR[sign];
  return [
    `data-sign="${fr.slug}"`,
    `data-kind="${kind}"`,
    `data-title="${esc(`${fr.glyph} ${fr.name} · ${kind === 'sky' ? 'vrai ciel' : 'horoscope'}`)}"`,
    `data-dates="${esc(dates)}"`,
    `data-note="${esc(note)}"`,
    `data-name="${esc(fr.name)}"`,
  ].join(' ');
}

function zodiacWheelSvg(focus?: WheelFocus): string {
  const parts: string[] = [];

  // Month ticks and labels.
  for (let m = 0; m < 12; m++) {
    const i = TIMELINE.findIndex(d => d.date.getUTCMonth() === m);
    const a = dayAngle(i);
    parts.push(`<path d="M ${pt(R.horoOut, a)} L ${pt(R.tick, a)}" stroke="rgba(148,163,184,0.5)"/>`);
    const mid = dayAngle(i + 15);
    const [x, y] = pt(R.month, mid).split(',');
    parts.push(`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#94a3b8">${MONTH_SHORT[m]}</text>`);
  }

  // Focused days: a faint wedge over both rings.
  if (focus) {
    const { start, days } = runSpan(focus.run);
    parts.push(`<path d="${sectorPath(start, days, R.skyIn - 4, R.horoOut + 2)}" fill="rgba(167,139,250,0.12)" stroke="#a78bfa" stroke-width="1.2" stroke-dasharray="4 3"/>`);
  }

  // Outer ring — horoscope, 12 equal signs.
  [...TROPICAL_RUNS.values()].forEach((run, k) => {
    const { start, days } = runSpan(run);
    const on = run.sign === focus?.horoscope;
    const fill = on ? 'rgba(167,139,250,0.35)' : k % 2 ? 'rgba(148,163,184,0.10)' : 'rgba(148,163,184,0.17)';
    const label = SIGN_FR[run.sign].glyph;
    const sky = SIGN_FR[majority(splitBy(TIMELINE, run.idx, d => d.constellation)).sign].name;
    const data = segmentData(run.sign, 'horo', frSpan(run), `Dans le vrai ciel à ces dates : surtout ${sky}.`);
    parts.push(`<a href="${signPath(run.sign)}" ${data} aria-label="${esc(`Horoscope ${SIGN_FR[run.sign].name} : ${frSpan(run)}`)}"><title>${esc(`Horoscope · ${SIGN_FR[run.sign].name} · ${frSpan(run)}`)}</title><path d="${sectorPath(start, days, R.horoIn, R.horoOut)}" fill="${fill}" stroke="#060210" stroke-width="1.5"/>${sectorLabel(start, days, (R.horoIn + R.horoOut) / 2, label, 18, on ? '#f5f3ff' : '#94a3b8')}</a>`);
  });

  // Inner ring — real sky, 13 IAU constellations.
  [...IAU_RUNS.values()].forEach((run, k) => {
    const { start, days } = runSpan(run);
    const on = run.sign === focus?.sky;
    const ophiuchus = run.sign === 'Ophiuchus';
    const fill = on
      ? 'rgba(252,211,77,0.45)'
      : ophiuchus
        ? 'rgba(252,211,77,0.22)'
        : k % 2 ? 'rgba(124,58,237,0.22)' : 'rgba(124,58,237,0.34)';
    const size = days < 10 ? 12 : 21;
    const horo = SIGN_FR[majority(splitBy(TIMELINE, run.idx, d => d.tropical)).sign].name;
    const data = segmentData(run.sign, 'sky', `${frSpan(run)} · ${days} jours`, `L’horoscope dit surtout ${horo} à ces dates.`);
    parts.push(`<a href="${signPath(run.sign)}" ${data} aria-label="${esc(`Vrai ciel ${SIGN_FR[run.sign].name} : ${frSpan(run)}, ${days} jours`)}"><title>${esc(`Vrai ciel · ${SIGN_FR[run.sign].name} · ${frSpan(run)} (${days} j)`)}</title><path d="${sectorPath(start, days, R.skyIn, R.skyOut)}" fill="${fill}" stroke="#060210" stroke-width="1.5"/>${sectorLabel(start, days, (R.skyIn + R.skyOut) / 2, SIGN_FR[run.sign].glyph, size, on || ophiuchus ? '#fde68a' : '#e9d5ff')}</a>`);
  });

  // Center: the Earth, from where we watch the Sun cross the sky.
  parts.push(`<circle cx="${C}" cy="${C}" r="${R.skyIn - 6}" fill="rgba(13,8,30,0.9)" stroke="rgba(167,139,250,0.2)"/>`);
  parts.push(`<text x="${C}" y="${C - 6}" text-anchor="middle" dominant-baseline="central" font-size="30">🌍</text>`);
  parts.push(`<text x="${C}" y="${C + 26}" text-anchor="middle" font-size="12" fill="#cbd5e1">Terre</text>`);

  const label = focus
    ? `Roue de l’année. ${focus.label} : horoscope ${SIGN_FR[focus.horoscope].name} (anneau extérieur), vrai ciel ${SIGN_FR[focus.sky].name} (anneau intérieur).`
    : 'Roue de l’année : les 12 signes égaux de l’horoscope (anneau extérieur) et les 13 vraies constellations (anneau intérieur).';
  return `<svg class="wheel" viewBox="0 0 ${W} ${W}" role="group" aria-label="${esc(label)}" font-family="inherit">
    ${parts.join('\n    ')}
  </svg>`;
}


/** Wheel, legend and the panel a click on the wheel fills in. */
function wheelBox(focus?: WheelFocus): string {
  return `<div class="wheel-box">
    ${zodiacWheelSvg(focus)}
    ${wheelLegend(focus)}
    <div class="wheel-info" aria-live="polite">Touche la roue pour voir les dates.</div>
  </div>`;
}

function wheelLegend(focus?: WheelFocus): string {
  const items = [
    '<span><i style="background:rgba(148,163,184,0.3)"></i>Horoscope (12)</span>',
    '<span><i style="background:rgba(124,58,237,0.5)"></i>Vrai ciel (13)</span>',
  ];
  if (focus) {
    items.push(`<span><i style="border:1px dashed #a78bfa"></i>${esc(focus.label)}</span>`);
  }
  return `<p class="legend">${items.join('')}</p>`;
}

// ─── One sign page ──────────────────────────────────────────────────────────

/** Rank of the Sun's passage by length, 1 = longest. */
function lengthRank(sign: IauConstellation): number {
  const sorted = [...IAU_RUNS.values()].sort((a, b) => b.idx.length - a.idx.length);
  return sorted.findIndex(r => r.sign === sign) + 1;
}

function lengthComment(sign: IauConstellation): string {
  const rank = lengthRank(sign);
  const total = IAU_RUNS.size;
  if (rank === 1) return 'C’est le passage le plus long des 13 constellations.';
  if (rank === total) return 'C’est le passage le plus court des 13 constellations.';
  if (rank === 2) return 'C’est le deuxième passage le plus long des 13.';
  if (rank === total - 1) return 'C’est le deuxième passage le plus court des 13.';
  return `C’est la ${rank}ᵉ traversée sur 13, de la plus longue à la plus courte.`;
}

function shiftWords(days: number): string {
  if (days < 24) return 'près de trois semaines';
  if (days <= 35) return 'environ un mois';
  return 'plus d’un mois';
}

function signPage(sign: IauConstellation): StaticPage {
  const fr = SIGN_FR[sign];
  const lore = CONSTELLATION_LORE[sign];
  const iauRun = IAU_RUNS.get(sign)!;
  const tropicalRun = TROPICAL_RUNS.get(sign);
  const isOphiuchus = sign === 'Ophiuchus';
  const days = iauRun.idx.length;
  const path = signPath(sign);

  // Horoscope dates of this sign → true constellations, day by day.
  const tropicalSplit = tropicalRun ? splitBy(TIMELINE, tropicalRun.idx, d => d.constellation) : [];
  // Real dates of this constellation → what the horoscope says on those days.
  const iauSplit = splitBy(TIMELINE, iauRun.idx, d => d.tropical);
  const mainTrue = tropicalRun ? majority(tropicalSplit) : iauRun;
  const mainHoroscope = majority(iauSplit);

  // A sample birthday for the FAQ: the middle of the main group.
  const sampleIdx = mainTrue.idx[Math.floor(mainTrue.idx.length / 2)];
  const sample = TIMELINE[sampleIdx];
  const sampleDay = frDay(sample.date);

  const i = ZODIAC_ORDER.indexOf(sign);
  const prev = ZODIAC_ORDER[(i - 1 + ZODIAC_ORDER.length) % ZODIAC_ORDER.length];
  const next = ZODIAC_ORDER[(i + 1) % ZODIAC_ORDER.length];
  const trueMain = SIGN_FR[mainTrue.sign];
  const horoMain = SIGN_FR[mainHoroscope.sign];

  // ── Copy ──
  const h1 = isOphiuchus
    ? `Le 13ᵉ signe oublié : es-tu Ophiuchus ? ${fr.glyph}`
    : `Vrai signe astronomique · ${fr.name} ${fr.glyph}`;
  const answer = isOphiuchus
    ? `Tu es né·e ${frRange(iauRun)} ? Ton horoscope dit <strong>${horoMain.name}</strong>, mais dans le vrai ciel, tu es <strong>Ophiuchus</strong>, le Serpentaire.`
    : `Tu es ${esc(fr.name)} ? Dans le vrai ciel, tu es sûrement <strong>${esc(trueMain.name)}</strong>.`;

  const title = isOphiuchus
    ? 'Ophiuchus, le 13ᵉ signe oublié : es-tu Ophiuchus ? Vraies dates'
    : `${fr.name} : quel est ton vrai signe astronomique ? Vraies dates`;
  const description = isOphiuchus
    ? `Ophiuchus (le Serpentaire) est le 13ᵉ signe oublié : le Soleil le traverse ${frRange(iauRun)}, pendant ${days} jours. Né·e à ces dates ? Ton horoscope dit ${horoMain.name}, le ciel dit Ophiuchus.`
    : `Tu es ${fr.name} ? ${frRange(mainTrue).replace(/^./, c => c.toUpperCase())}, le Soleil est en réalité devant ${trueMain.the}. Les vraies dates ${fr.of} : ${frSpan(iauRun)} (${days} jours), selon les frontières IAU.`;

  // Block 2 — the day-by-day mapping, with the wheel.
  const wheelFocus: WheelFocus = tropicalRun
    ? { run: tropicalRun, horoscope: sign, sky: mainTrue.sign, label: `${fr.name} (horoscope)` }
    : { run: iauRun, horoscope: mainHoroscope.sign, sky: sign, label: `${fr.name} (vrai ciel)` };
  let mapping: string;
  if (tropicalRun) {
    const rows = tropicalSplit
      .map(r => {
        const n = r.idx.length;
        const ok = r.sign === sign ? ' <span class="ok">✓ ton horoscope a raison</span>' : '';
        return `<li class="${r === mainTrue ? 'main' : ''}"><span class="when">${esc(cap(frRange(r)))} <span class="muted">(${n} jour${plural(n)})</span></span><span class="what">${signLink(r.sign)}${ok}</span></li>`;
      })
      .join('\n      ');
    mapping = `<section class="card" aria-labelledby="map-title">
    <h2 id="map-title">Ton horoscope dit ${esc(fr.name)}, le ciel dit…</h2>
    <p>Les dates ${esc(fr.of)} de l’horoscope vont ${esc(frRange(tropicalRun))}. Voici devant quelle constellation se trouve vraiment le Soleil ces jours-là :</p>
    <ul class="rows">
      ${rows}
    </ul>
    <p class="muted">Calculé pour ${REFERENCE_YEAR}. Les jours limites peuvent varier d’un jour selon l’année et l’heure de naissance.</p>
  </section>`;
  } else {
    const rows = iauSplit
      .map(r => {
        const n = r.idx.length;
        return `<li class="main"><span class="when">${esc(cap(frRange(r)))} <span class="muted">(${n} jour${plural(n)})</span></span><span class="what">horoscope ${signLink(r.sign)} → <a href="${path}">${esc(fr.glyph)} Ophiuchus</a></span></li>`;
      })
      .join('\n      ');
    mapping = `<section class="card" aria-labelledby="map-title">
    <h2 id="map-title">Ton horoscope dit ${esc(horoMain.name)}, le ciel dit Ophiuchus</h2>
    <p>Aucun horoscope ne parle d’Ophiuchus : les astrologues n’ont gardé que 12 signes, un par mois. Pourtant, chaque année, le Soleil passe devant cette constellation :</p>
    <ul class="rows">
      ${rows}
    </ul>
    <p class="muted">Calculé pour ${REFERENCE_YEAR}. Les jours limites peuvent varier d’un jour selon l’année et l’heure de naissance.</p>
  </section>`;
  }

  // Block 3 — real dates vs horoscope dates.
  const shift = shiftDays(sign);
  const facts = [
    tropicalRun
      ? `<div class="fact fact--old"><span class="fact__label">Dates horoscope</span><span class="fact__value">${esc(frSpan(tropicalRun))}</span></div>`
      : `<div class="fact"><span class="fact__label">Dates horoscope</span><span class="fact__value">aucune, oubliée</span></div>`,
    `<div class="fact fact--gold"><span class="fact__label">Vraies dates (IAU)</span><span class="fact__value">${esc(frSpan(iauRun))}</span></div>`,
    `<div class="fact"><span class="fact__label">Durée</span><span class="fact__value">${days} jours</span></div>`,
    shift !== null
      ? `<div class="fact"><span class="fact__label">Décalage</span><span class="fact__value">${shift} jours plus tard</span></div>`
      : `<div class="fact"><span class="fact__label">Entre</span><span class="fact__value">${esc(`${SIGN_FR[prev].name} et ${SIGN_FR[next].name}`)}</span></div>`,
  ].join('\n      ');
  const realDates = `<section class="card" aria-labelledby="dates-title">
    <h2 id="dates-title">Les vraies dates ${esc(fr.of)}</h2>
    <div class="facts">
      ${facts}
    </div>
    <p>Le Soleil se trouve devant la constellation ${esc(fr.of)} ${esc(frRange(iauRun))}, soit <strong>${days} jours</strong>. ${esc(lengthComment(sign))}${
      shift !== null
        ? ` Ses vraies dates commencent ${shift} jours après celles de l’horoscope : ${shiftWords(shift)} de décalage.`
        : ''
    }</p>
    <p>Né·e entre ces dates ? Ton horoscope te dit sûrement ${signLink(mainHoroscope.sign, horoMain.name)}, mais ton vrai signe est ${esc(fr.name)}.</p>
  </section>`;

  // Block 4 — why.
  const why = `<section class="card" aria-labelledby="why-title">
    <h2 id="why-title">Pourquoi ?</h2>
    ${skyAlignmentSvg(sign)}
    <p>Ton signe, c’est la constellation qui se trouve <strong>derrière le Soleil</strong>, vue depuis la Terre, le jour de ta naissance. Les dates des horoscopes ont environ 2 000 ans : depuis, l’axe de la Terre a lentement pivoté (la précession des équinoxes) et <strong>le ciel a glissé d’environ un mois</strong>.</p>
    <p>${
      isOphiuchus
        ? 'Et pour coller aux 12 mois, l’astrologie n’a gardé que 12 signes : Ophiuchus, que le Soleil traverse pourtant chaque année, a été laissé de côté.'
        : `C’est pour ça qu’aux dates ${esc(fr.of)} de l’horoscope, le Soleil est en réalité surtout devant ${esc(trueMain.the)}.`
    }</p>
  </section>`;

  // Block 5 — the constellation.
  const opposition = frMonth(TIMELINE[oppositionIndex(sign)].date);
  const constellation = `<section class="card" aria-labelledby="sky-title">
    <h2 id="sky-title">La constellation ${esc(fr.of)}</h2>
    <dl>
      <dt>Nom latin</dt><dd>${esc(lore.latin)}${isOphiuchus ? ' (le Serpentaire)' : ''}</dd>
      <dt>Étoile la plus brillante</dt><dd>${esc(lore.brightestStar)}</dd>
      <dt>Le mythe</dt><dd>${esc(lore.myth)}</dd>
    </dl>
    <p>${esc(lore.poetic)}</p>
    <p><strong>Quand la voir ?</strong> Jamais à ton anniversaire : le Soleil est devant elle, elle est donc noyée dans sa lumière. Elle passe au plus haut vers minuit en ${esc(opposition)}, six mois plus tard. ${esc(SKY_TIP[sign])}</p>
  </section>`;

  // Block 6 — FAQ.
  const faq: Faq[] = [
    {
      q: `Je suis né·e le ${sampleDay}, quel est mon vrai signe ?`,
      a: `Le ${sampleDay}, le Soleil se trouve devant ${SIGN_FR[sample.constellation].the}. Ton horoscope dit ${SIGN_FR[sample.tropical].name}, mais ton vrai signe astronomique est ${SIGN_FR[sample.constellation].name}. Pour une réponse exacte, entre ta date, ton heure et ton lieu de naissance dans le calculateur.`,
    },
    {
      q: days < 30
        ? `Pourquoi le Soleil ne reste que ${days} jours dans ${fr.the} ?`
        : `Pourquoi le Soleil reste ${days} jours dans ${fr.the} ?`,
      a: `Les horoscopes découpent le ciel en 12 parts égales d’environ 30 jours. Les vraies constellations ont des tailles différentes : leurs frontières ont été fixées en 1930 par l’Union astronomique internationale. Le Soleil traverse ${fr.the} ${frRange(iauRun)}, soit ${days} jours. ${lengthComment(sign)}`,
    },
    isOphiuchus
      ? {
          q: 'Pourquoi Ophiuchus n’est pas dans mon horoscope ?',
          a: 'Le zodiaque des horoscopes a été fixé il y a environ 2 000 ans avec 12 signes de taille égale, un par mois. Ophiuchus est pourtant bien sur le chemin du Soleil, entre le Scorpion et le Sagittaire. Ce site ne fait pas d’astrologie : il te montre seulement devant quelle constellation se trouvait vraiment le Soleil à ta naissance.',
        }
      : {
          q: 'Est-ce que ça change mon horoscope ?',
          a: `Non. L’horoscope ${fr.of} reste fondé sur un calendrier symbolique fixé il y a environ 2 000 ans. Ce site ne fait pas d’astrologie : il te montre seulement devant quelle constellation se trouvait vraiment le Soleil à ta naissance. Pour la plupart des personnes nées ${fr.name}, c’est ${trueMain.the}.`,
        },
  ];

  const pager = `<nav class="pager" aria-label="Autres signes">
    <a href="${signPath(prev)}" rel="prev">← ${esc(`${SIGN_FR[prev].glyph} ${SIGN_FR[prev].name}`)}</a>
    <span class="all"><a href="/signes/">Tous les signes</a></span>
    <a href="${signPath(next)}" rel="next">${esc(`${SIGN_FR[next].glyph} ${SIGN_FR[next].name}`)} →</a>
  </nav>`;

  // Side panel: sticky beside the text on desktop, right after the hero on
  // mobile (where the facts and CTA are dropped — the page already has them).
  const aside = `<aside class="aside card" aria-label="La roue de l’année">
    ${wheelBox(wheelFocus)}
    <div class="aside-desktop">
      <a class="cta" href="/">Calcule ton vrai signe →</a>
    </div>
  </aside>`;

  const body = `  <section class="hero">
    <div class="hero__glyph" aria-hidden="true">${fr.glyph}</div>
    <h1>${esc(h1)}</h1>
    <p class="answer">${answer}</p>
    <a class="cta" href="/">Calcule ton vrai signe →</a>
  </section>
  <div class="page">
    <div>
  ${mapping}
  ${realDates}
  ${why}
  ${constellation}
  ${faqSection(faq)}
  ${pager}
    </div>
    ${aside}
  </div>`;

  return {
    fileName: `signe/${fr.slug}/index.html`,
    html: layout({
      path,
      title,
      description,
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'Tous les signes', path: '/signes/' },
        { name: fr.name, path },
      ],
      faq,
      body,
    }),
  };
}

// ─── Index page ─────────────────────────────────────────────────────────────

/** Two nowrap halves so a narrow cell breaks only between the dates. */
function shortSpan(run: { idx: number[] }): string {
  const first = TIMELINE[run.idx[0]].date;
  const last = TIMELINE[run.idx[run.idx.length - 1]].date;
  return `<span class="nw">${esc(frDayShort(first))} –</span> <span class="nw">${esc(frDayShort(last))}</span>`;
}

function indexPage(): StaticPage {
  const path = '/signes/';
  const rows = ZODIAC_ORDER.map(c => {
    const iau = IAU_RUNS.get(c)!;
    const tropical = TROPICAL_RUNS.get(c);
    return `<tr data-sign="${SIGN_FR[c].slug}"${c === 'Ophiuchus' ? ' class="star"' : ''}>
          <td>${signLink(c)}</td>
          <td>${shortSpan(iau)}</td>
          <td class="num">${iau.idx.length} j</td>
          <td class="old">${tropical ? shortSpan(tropical) : 'oublié'}</td>
        </tr>`;
  }).join('\n        ');

  const ophiuchus = IAU_RUNS.get('Ophiuchus')!;
  const longest = [...IAU_RUNS.values()].sort((a, b) => b.idx.length - a.idx.length)[0];
  const shortest = [...IAU_RUNS.values()].sort((a, b) => a.idx.length - b.idx.length)[0];

  const faq: Faq[] = [
    {
      q: 'Combien y a-t-il de signes astronomiques ?',
      a: `Treize. Sur son chemin dans le ciel, le Soleil traverse 13 constellations : les 12 du zodiaque et Ophiuchus, le Serpentaire, ${frRange(ophiuchus)}.`,
    },
    {
      q: 'Pourquoi les vraies dates ne sont pas les dates des horoscopes ?',
      a: `Les dates des horoscopes ont environ 2 000 ans. Depuis, la précession des équinoxes a fait glisser le ciel d’environ un mois. Et les vraies constellations n’ont pas toutes la même taille : le Soleil passe ${longest.idx.length} jours dans ${SIGN_FR[longest.sign].the}, mais seulement ${shortest.idx.length} dans ${SIGN_FR[shortest.sign].the}.`,
    },
  ];

  const body = `  <section class="hero">
    <div class="hero__glyph" aria-hidden="true">✦</div>
    <h1>Les vraies dates des 13 signes astronomiques</h1>
    <p class="answer">Le Soleil traverse <strong>13 constellations</strong>, pas 12. Voici leurs vraies dates, selon les frontières officielles de l’IAU, à côté des dates des horoscopes.</p>
    <a class="cta" href="/">Calcule ton vrai signe →</a>
  </section>
  <div class="signs-grid">
  <section class="card wheel-card" aria-labelledby="wheel-title">
    <h2 id="wheel-title">La roue des 13 signes</h2>
    <p>Ton vrai signe est <strong>juste en dessous</strong> de ton signe d’horoscope.</p>
    ${wheelBox()}
  </section>
  <section class="card" aria-labelledby="table-title">
    <h2 id="table-title">Tous les signes, dans l’ordre du ciel</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Signe</th><th scope="col">Vraies dates</th><th scope="col">Durée</th><th scope="col">Horoscope</th></tr></thead>
        <tbody>
        ${rows}
        </tbody>
      </table>
    </div>
    <p class="muted">Calculé pour ${REFERENCE_YEAR}. Les jours limites peuvent varier d’un jour selon l’année et l’heure de naissance.</p>
    <p>Ton vrai signe, c’est la constellation qui se trouvait derrière le Soleil le jour de ta naissance. Comme le ciel a glissé d’environ un mois depuis l’invention des horoscopes, il est presque toujours <strong>le signe d’avant</strong> celui de ton horoscope. Et si tu es né·e ${esc(frRange(ophiuchus))}, tu es ${signLink('Ophiuchus', 'Ophiuchus')}, le 13ᵉ signe oublié.</p>
  </section>
  </div>
  <div class="narrow">
  ${faqSection(faq)}
  </div>`;

  return {
    fileName: 'signes/index.html',
    html: layout({
      path,
      title: 'Les vraies dates des 13 signes astronomiques (avec Ophiuchus)',
      description: `Le Soleil traverse 13 constellations, pas 12. Les vraies dates de chaque signe selon l’IAU, leur durée (de ${shortest.idx.length} à ${longest.idx.length} jours) et les dates des horoscopes, Ophiuchus compris.`,
      crumbs: [
        { name: 'Accueil', path: '/' },
        { name: 'Tous les signes', path },
      ],
      faq,
      body,
    }),
  };
}

// ─── Sitemap ────────────────────────────────────────────────────────────────

function sitemap(lastmod: string): string {
  const urls = [
    { path: '/', priority: '1.0' },
    { path: '/signes/', priority: '0.9' },
    ...ZODIAC_ORDER.map(c => ({ path: signPath(c), priority: c === 'Ophiuchus' ? '0.9' : '0.8' })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `  <url>
    <loc>${SITE_URL}${u.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
}

/** All static pages plus the sitemap, ready to be emitted into dist. */
export function buildStaticPages(lastmod: string): { pages: StaticPage[]; sitemap: string } {
  return {
    pages: [indexPage(), ...ZODIAC_ORDER.map(signPage)],
    sitemap: sitemap(lastmod),
  };
}

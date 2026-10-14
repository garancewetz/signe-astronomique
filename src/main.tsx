import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { CockpitFallback, ErrorBoundary } from '@/features/cockpit-shell'
import { LocaleProvider } from './context/LocaleContext'
import { MOBILE_QUERY } from './ui/useMobileLayout'
import { WELCOME_EVENTS } from '@/features/cockpit-shell/welcomeEvents'
import { LOCALE_STORAGE_KEY } from './context/localeContextInternal'
import { loreShortName, sunSigns } from '@/features/astronomy'

registerSW({ immediate: true })

// Intentional dev-tools banner — author signature for curious visitors.
// Not a leftover debug statement; the project lint convention bans console.log
// elsewhere, but this single greeting is by design.
console.log(
  '%csigne astronomique%c\n' +
    'Conçu et développé par Garance Wetzel.\n\n' +
    '%cStack%c\n' +
    '· React 19 + TypeScript\n' +
    '· Vite\n' +
    '· CesiumJS (rendu 3D du globe et du ciel)\n' +
    '· satellite.js (propagation orbitale SGP4)\n' +
    '· Framer Motion\n' +
    '· Tailwind CSS v4\n\n' +
    '%cGitHub  %chttps://github.com/garancewetz\n' +
    '%cSources %chttps://github.com/garancewetz/signe-astronomique',
  'color:#fef9c3;font-size:20px;font-weight:700;letter-spacing:0.05em;text-shadow:0 0 10px #fde68a;',
  'color:#cbd5e1;font-size:12px;',
  'color:#a5b4fc;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;',
  'color:#e2e8f0;font-size:12px;line-height:1.7;',
  'color:#a5b4fc;font-size:12px;font-weight:600;',
  'color:#93c5fd;font-size:12px;text-decoration:underline;',
  'color:#a5b4fc;font-size:12px;font-weight:600;',
  'color:#93c5fd;font-size:12px;text-decoration:underline;',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <ErrorBoundary fallback={<CockpitFallback />}>
        <App />
      </ErrorBoundary>
    </LocaleProvider>
  </StrictMode>,
)

// The welcome overlay (#seo-splash) is static HTML in index.html — it ships
// in the raw markup so crawlers and no-JS visitors get readable content, and
// for real visitors it sits over the blurred cockpit until they dismiss it.
// React renders underneath; this wires the dismiss interactions and fades the
// overlay out before removing it from the DOM.
function wireWelcomeOverlay() {
  // Local non-nullable binding: TS won't propagate the early-return narrowing
  // into the nested `dismiss` closure, so capture it as a typed const here.
  const overlay: HTMLElement | null = document.getElementById('seo-splash')
  if (!overlay) return
  const el = overlay

  let dismissed = false
  let removeTimer = 0
  // Tells the birth form rendered inside the card (WelcomeForm) to unmount.
  const remove = () => {
    window.clearTimeout(removeTimer)
    if (!el.isConnected) return
    el.remove()
    window.dispatchEvent(new Event(WELCOME_EVENTS.removed))
  }
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss()
  }
  function dismiss() {
    if (dismissed) return
    dismissed = true
    el.classList.add('seo-splash--hidden')
    el.addEventListener('transitionend', remove, { once: true })
    // Fallback removal: with prefers-reduced-motion the transition is disabled,
    // so `transitionend` never fires and we drop the node on a timer instead.
    removeTimer = window.setTimeout(remove, 600)
    document.removeEventListener('keydown', onKeydown)
  }

  // Desktop: the header carries the question and today's hook (HudFrame);
  // the card only opens on demand, from its "Pourquoi ?" link.
  if (!window.matchMedia(MOBILE_QUERY).matches) {
    wireDesktopCard(el)
    return
  }

  document.getElementById('seo-splash-close')?.addEventListener('click', dismiss)
  // The birth form inside the card computed a sign: the card has done its job.
  window.addEventListener(WELCOME_EVENTS.dismiss, dismiss, { once: true })
  document.getElementById('seo-splash-enter')?.addEventListener('click', dismiss)
  // A click on the blurred backdrop (outside the card) also closes.
  el.addEventListener('click', (e) => {
    if (e.target === el) dismiss()
  })
  document.addEventListener('keydown', onKeydown)

  fillToday()
  wireLanguageToggle(el)

  // On mobile the card is a real modal: move focus into it so keyboard /
  // screen-reader users land on the dismiss control.
  document.getElementById('seo-splash-close')?.focus()
}

// Desktop: hidden at arrival (index.html CSS), shown and hidden on demand —
// never removed, so "Pourquoi ?" can reopen it as often as wanted.
function wireDesktopCard(el: HTMLElement) {
  el.setAttribute('aria-modal', 'false')
  const closeBtn = document.getElementById('seo-splash-close')
  const close = () => el.classList.remove('seo-splash--open')
  window.addEventListener(WELCOME_EVENTS.open, () => {
    el.classList.add('seo-splash--open')
    // "Pourquoi ?" asks for the explanation: unfold it straight away.
    el.querySelector('details')?.setAttribute('open', '')
    closeBtn?.focus()
  })
  // A sign was computed: the explanation can step aside.
  window.addEventListener(WELCOME_EVENTS.dismiss, close)
  closeBtn?.addEventListener('click', close)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
  })
  fillToday()
  wireLanguageToggle(el)
}

// Today's horoscope sign vs the constellation really behind the Sun — the
// site's claim, proven on today's date before anyone types theirs. Filled
// before wireLanguageToggle caches the French markup, with the English in
// data-en like the rest of the card. Names come from our own lore table.
function fillToday() {
  const p = document.getElementById('seo-splash-today')
  if (!p) return
  const { tropical, constellation } = sunSigns(new Date())
  const name = (lang: 'fr' | 'en', c: typeof tropical) => `<strong>${loreShortName(c, lang)}</strong>`
  if (tropical === constellation) {
    p.innerHTML = `Aujourd’hui, le Soleil est devant ${name('fr', constellation)} : pour une fois, l’horoscope a raison.`
    p.dataset.en = `Today the Sun is in front of ${name('en', constellation)}: for once, horoscopes are right.`
  } else {
    p.innerHTML = `Aujourd’hui, l’horoscope dit ${name('fr', tropical)}. Le ciel dit ${name('fr', constellation)}.`
    p.dataset.en = `Today, horoscopes say ${name('en', tropical)}. The sky says ${name('en', constellation)}.`
  }
  p.hidden = false
}

// FR is the raw-HTML default; this lets a visitor flip the overlay to English
// on demand. The EN copy lives in data-en attributes (and data-en-aria for the
// close button) so it never ships as indexable French page text — we only swap
// it into the DOM when EN is picked. App-wide language stays controlled by the
// in-cockpit switcher too; this toggle also drives it via WELCOME_EVENTS.lang.
function wireLanguageToggle(root: HTMLElement) {
  const frBtn = document.getElementById('seo-lang-fr')
  const enBtn = document.getElementById('seo-lang-en')
  const closeBtn = document.getElementById('seo-splash-close')
  if (!frBtn || !enBtn) return

  const content = root.querySelector<HTMLElement>('.seo-splash__inner')
  const nodes = root.querySelectorAll<HTMLElement>('[data-en]')
  // Cache the original French markup so EN ↔ FR is reversible.
  nodes.forEach((n) => {
    n.dataset.fr = n.innerHTML
  })
  const frAria = closeBtn?.getAttribute('aria-label') ?? ''

  const setLang = (lang: 'fr' | 'en') => {
    nodes.forEach((n) => {
      const next = lang === 'en' ? n.dataset.en : n.dataset.fr
      if (next != null) n.innerHTML = next
    })
    if (closeBtn) {
      const aria = lang === 'en' ? closeBtn.dataset.enAria : frAria
      if (aria) closeBtn.setAttribute('aria-label', aria)
    }
    // Mark the content's language so assistive tech reads it correctly — the
    // <main> carries lang="fr" in the raw HTML, so update it there.
    content?.setAttribute('lang', lang)
    frBtn.classList.toggle('is-active', lang === 'fr')
    enBtn.classList.toggle('is-active', lang === 'en')
    frBtn.setAttribute('aria-pressed', String(lang === 'fr'))
    enBtn.setAttribute('aria-pressed', String(lang === 'en'))
  }
  // The card now holds the React birth form: keep both in the same language.
  const pick = (lang: 'fr' | 'en') => {
    setLang(lang)
    window.dispatchEvent(new CustomEvent(WELCOME_EVENTS.lang, { detail: lang }))
  }

  frBtn.addEventListener('click', () => pick('fr'))
  enBtn.addEventListener('click', () => pick('en'))

  // Returning English visitors: open the card in English too.
  try {
    if (window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'en') setLang('en')
  } catch {
    // Storage blocked (private mode): stay on the French default.
  }
}

wireWelcomeOverlay()

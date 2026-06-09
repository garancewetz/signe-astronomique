import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { CockpitFallback, ErrorBoundary } from '@/features/cockpit-shell'
import { LocaleProvider } from './context/LocaleContext'

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
  const onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') dismiss()
  }
  function dismiss() {
    if (dismissed) return
    dismissed = true
    el.classList.add('seo-splash--hidden')
    el.addEventListener(
      'transitionend',
      () => {
        window.clearTimeout(removeTimer)
        el.remove()
      },
      { once: true },
    )
    // Fallback removal: with prefers-reduced-motion the transition is disabled,
    // so `transitionend` never fires and we drop the node on a timer instead.
    removeTimer = window.setTimeout(() => el.remove(), 600)
    document.removeEventListener('keydown', onKeydown)
  }

  document.getElementById('seo-splash-close')?.addEventListener('click', dismiss)
  document.getElementById('seo-splash-enter')?.addEventListener('click', dismiss)
  // A click on the blurred backdrop (outside the card) also closes.
  el.addEventListener('click', (e) => {
    if (e.target === el) dismiss()
  })
  document.addEventListener('keydown', onKeydown)

  // Move focus into the dialog so keyboard / screen-reader users land on the
  // dismiss control rather than being left behind it.
  document.getElementById('seo-splash-close')?.focus()
}

wireWelcomeOverlay()

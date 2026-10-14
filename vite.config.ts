import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { buildStaticPages } from './seo/signPages'

/** SHA-256 hashes of every inline <script> body, for `script-src`. */
function inlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];
  const inlineScriptRe = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  for (const match of html.matchAll(inlineScriptRe)) {
    const body = match[1];
    if (!body.trim()) continue;
    const hash = createHash('sha256').update(body).digest('base64');
    hashes.push(`'sha256-${hash}'`);
  }
  return hashes;
}

/**
 * Inject a production-only Content-Security-Policy meta tag into `index.html`.
 * Skipped in dev because Vite's HMR uses inline scripts and a WebSocket that
 * would require permissive directives anyway.
 *
 * The inline JSON-LD blocks (SEO structured data) are kept under `script-src`
 * via per-block SHA-256 hashes — `'unsafe-inline'` would defeat the whole
 * point of CSP, so we compute the hashes at build time instead.
 *
 * Sources allowed:
 *   - nominatim       — geocoding
 *   - earthdata.nasa  — Cesium imagery (NASA GIBS)
 *   - fonts.gstatic   — JetBrains Mono WOFF
 *   - fonts.googleapis— Google Fonts CSS
 */
function cspMetaTag(): Plugin {
  return {
    name: 'inject-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      // Cesium uses `new Function(...)` and WebAssembly internally, so we
      // need 'unsafe-eval' + 'wasm-unsafe-eval'. Cesium also bootstraps
      // its workers via blob: URLs and they then `importScripts(blob:...)`,
      // which is governed by script-src inside the worker context — hence
      // `blob:`. There is no workaround short of forking Cesium.
      const scriptSrc = [
        "'self'",
        "blob:",
        "'unsafe-eval'",
        "'wasm-unsafe-eval'",
        ...inlineScriptHashes(html),
      ].join(' ');
      // Note: `frame-ancestors` is only enforced when served as an HTTP
      // header, not via <meta>. If clickjacking protection becomes a
      // requirement, add it to a Netlify _headers / netlify.toml file.
      const csp = [
        "default-src 'self'",
        "connect-src 'self' https://nominatim.openstreetmap.org https://gibs.earthdata.nasa.gov https://*.earthdata.nasa.gov",
        "img-src 'self' data: blob: https://gibs.earthdata.nasa.gov https://*.earthdata.nasa.gov",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `script-src ${scriptSrc}`,
        "worker-src 'self' blob:",
        "base-uri 'self'",
        "form-action 'none'",
      ].join('; ');

      const tag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
      return html.replace('<head>', `<head>\n    ${tag}`);
    },
  };
}

/**
 * Emit the static sign pages (/signe/<slug>/, /signes/) and the sitemap
 * from seo/signPages.ts. They carry no JS at all, so their CSP is much
 * stricter than the app's: only the hashed JSON-LD block may "run".
 */
function signPagesPlugin(): Plugin {
  return {
    name: 'static-sign-pages',
    apply: 'build',
    generateBundle() {
      const lastmod = new Date().toISOString().slice(0, 10);
      const { pages, sitemap } = buildStaticPages(lastmod);
      for (const page of pages) {
        const csp = [
          "default-src 'self'",
          "img-src 'self' data:",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          `script-src ${inlineScriptHashes(page.html).join(' ')}`,
          "base-uri 'self'",
          "form-action 'none'",
        ].join('; ');
        const tag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
        this.emitFile({
          type: 'asset',
          fileName: page.fileName,
          source: page.html.replace('<head>', `<head>\n    ${tag}`),
        });
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    cesium(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: [
        'favicon.svg',
        'logo.svg',
        'pwa-192.png',
        'pwa-512.png',
        'robots.txt',
      ],
      manifest: {
        id: '/',
        name: 'Signe astronomique',
        short_name: 'Signe astro',
        description:
          'Cockpit astronomique : ta vraie constellation solaire de naissance, calculée selon les frontières IAU 1930 (avec Ophiuchus).',
        lang: 'fr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#060210',
        theme_color: '#060210',
        categories: ['education', 'science', 'utilities'],
        // PNG icons are required for reliable Android home-screen install —
        // SVG manifest icons are accepted inconsistently and Android falls
        // back to a generated first-letter avatar when it gives up.
        icons: [
          {
            src: '/pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
        globIgnores: ['**/Cesium/**', '**/cesium/**'],
        // The static sign pages are real documents, never the SPA shell.
        navigateFallbackDenylist: [/^\/api\//, /^\/_/, /^\/signes?\//],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
    cspMetaTag(),
    signPagesPlugin(),
  ],
})

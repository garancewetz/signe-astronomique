import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

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
 *   - celestrak.org   — orbital TLEs
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
      const scriptHashes: string[] = [];
      const inlineScriptRe =
        /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
      for (const match of html.matchAll(inlineScriptRe)) {
        const body = match[1];
        if (!body.trim()) continue;
        const hash = createHash('sha256').update(body).digest('base64');
        scriptHashes.push(`'sha256-${hash}'`);
      }

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
        ...scriptHashes,
      ].join(' ');
      // Note: `frame-ancestors` is only enforced when served as an HTTP
      // header, not via <meta>. If clickjacking protection becomes a
      // requirement, add it to a Netlify _headers / netlify.toml file.
      const csp = [
        "default-src 'self'",
        "connect-src 'self' https://celestrak.org https://*.celestrak.org https://nominatim.openstreetmap.org https://gibs.earthdata.nasa.gov https://*.earthdata.nasa.gov",
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

// https://vite.dev/config/
export default defineConfig({
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
        name: 'True Cosmic Sign',
        short_name: 'Cosmic Sign',
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
        navigateFallbackDenylist: [/^\/api\//, /^\/_/],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
    cspMetaTag(),
  ],
})

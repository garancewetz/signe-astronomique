import { createHash } from 'node:crypto'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import tailwindcss from '@tailwindcss/vite'

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

      const scriptSrc = ["'self'", ...scriptHashes].join(' ');
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
        "frame-ancestors 'none'",
      ].join('; ');

      const tag = `<meta http-equiv="Content-Security-Policy" content="${csp}">`;
      return html.replace('<head>', `<head>\n    ${tag}`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cesium(), tailwindcss(), cspMetaTag()],
})

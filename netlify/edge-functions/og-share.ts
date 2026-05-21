/**
 * Inline type stubs for the Netlify Edge runtime — declared here so we
 * don't pull in `@netlify/edge-functions` just for the IDE. Only the
 * fields we touch are modeled; the Netlify deployment runtime supplies
 * the full implementation at execution time.
 */
interface EdgeContext {
  next: () => Promise<Response>;
}
interface EdgeConfig {
  path: string | string[];
}

/**
 * Inject natal-payload-aware Open Graph metadata into the SPA's index.html
 * so share-link previews in WhatsApp/iMessage/mail/Slack show the recipient
 * which sky is being offered (city + date + time) before they tap.
 *
 * The static `og:title` and `og:description` in index.html serve as
 * fallback for visitors landing on the root URL without share params.
 * When the five natal params are present and valid, we swap them for a
 * payload-specific pair while keeping the OG image static (the generic
 * sun-on-ecliptic card still represents the product well enough).
 *
 * Runs on every request to `/`; falls through to the static asset
 * pipeline when no natal params are present, so cold visitors keep the
 * fast cached HTML.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;
const MAX_LABEL_LENGTH = 80;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatPayload(params: URLSearchParams): {
  title: string;
  description: string;
} | null {
  const date = params.get('d');
  const time = params.get('t');
  const lat = params.get('lat');
  const lon = params.get('lon');
  const rawLabel = params.get('label');
  if (!date || !time || !lat || !lon || !rawLabel) return null;
  if (!DATE_RE.test(date) || !TIME_RE.test(time)) return null;
  // Mirror the SPA-side validation in shareLink.ts so any payload that would
  // be rejected on the client never makes it into a cached OG card either.
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;
  if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) return null;

  const label =
    rawLabel.length > MAX_LABEL_LENGTH
      ? `${rawLabel.slice(0, MAX_LABEL_LENGTH - 1)}…`
      : rawLabel;

  const [y, mo, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, hh, mm));

  // The site is FR-primary; OG cards render once per crawl regardless of
  // the visitor's locale, so we pick fr-FR deliberately. Switching by
  // Accept-Language would fragment social caches and is not worth it.
  const dateFmt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
  const timeFmt = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(dt);

  return {
    title: `Le ciel de ${label} — ${dateFmt}`,
    description: `${dateFmt} à ${timeFmt}, depuis ${label}. Découvre la constellation du Soleil, l’ascendant et les planètes à cet instant précis.`,
  };
}

export default async (request: Request, context: EdgeContext) => {
  const url = new URL(request.url);
  const payload = formatPayload(url.searchParams);
  if (!payload) return; // Fall through to the static index.html.

  const response = await context.next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) return response;

  const safeTitle = escapeHtml(payload.title);
  const safeDesc = escapeHtml(payload.description);

  const replacements: Array<[RegExp, string]> = [
    [
      /<meta property="og:title"[^>]*>/,
      `<meta property="og:title" content="${safeTitle}" />`,
    ],
    [
      /<meta name="twitter:title"[^>]*>/,
      `<meta name="twitter:title" content="${safeTitle}" />`,
    ],
    [
      /<meta property="og:description"[^>]*>/,
      `<meta property="og:description" content="${safeDesc}" />`,
    ],
    [
      /<meta name="twitter:description"[^>]*>/,
      `<meta name="twitter:description" content="${safeDesc}" />`,
    ],
  ];
  let html = await response.text();
  for (const [re, replacement] of replacements) {
    html = html.replace(re, replacement);
  }

  // Drop content-length (rewrite changes the byte count) and any cached
  // ETag — keep the rest (CSP, security headers, etc.).
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('etag');
  // Force fresh fetch by social crawlers; the natal params are part of the
  // URL so each shared sky stays correctly cached upstream.
  headers.set('cache-control', 'public, max-age=0, must-revalidate');

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config: EdgeConfig = {
  path: '/',
};

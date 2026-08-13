/**
 * splitabroad demo server. Does three jobs, all optional-independent:
 *
 *  1. Serves the exported web app out of `dist/` (run `npx expo export
 *     --platform web` first). Same origin as the API, so no CORS to think about.
 *
 *  2. A "tap relay" so a *second* phone can trigger the payment on the
 *     presenter's screen, instead of the demo running on a timer. Purely
 *     in-memory, no auth — it is a stage prop, not a payment system.
 *
 *  3. Stripe Terminal connection tokens, only when STRIPE_SECRET_KEY is set.
 *     Without a key the server still starts; Terminal routes return 501.
 *
 * Run it:
 *   node server/index.mjs
 *   STRIPE_SECRET_KEY=sk_test_... node server/index.mjs
 *
 * Test keys only. The server refuses to start on a live key.
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const PORT = Number(process.env.PORT ?? 4242);
const KEY = process.env.STRIPE_SECRET_KEY ?? '';
const LOCATION_NAME = process.env.STRIPE_LOCATION_NAME ?? 'splitabroad demo';
const WEB_ROOT = resolve(process.env.WEB_ROOT ?? join(import.meta.dirname, '..', 'dist'));

if (KEY && !KEY.startsWith('sk_test_') && !KEY.startsWith('rk_test_')) {
  console.error('✗ Refusing to start: this demo is test-mode only. Use an sk_test_… key.');
  process.exit(1);
}

/* ------------------------------------------------------------------ relay */

/**
 * code → { armed, paid, amount, currency, collector, payer, at }
 *
 * The presenter's tap screen arms a code and polls it; the payer's phone opens
 * /pay?code=… and posts to it. Sessions are dropped after an hour so a long
 * demo session doesn't grow forever.
 */
const sessions = new Map();
const SESSION_TTL_MS = 60 * 60 * 1000;

function sweepSessions() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [code, s] of sessions) {
    if (s.updatedAt < cutoff) sessions.delete(code);
  }
}

function getSession(code) {
  return (
    sessions.get(code) ?? {
      armed: false,
      paid: false,
      amount: 0,
      currency: 'EUR',
      collector: '',
      payer: '',
      updatedAt: Date.now(),
    }
  );
}

function putSession(code, patch) {
  const next = { ...getSession(code), ...patch, updatedAt: Date.now() };
  sessions.set(code, next);
  sweepSessions();
  return next;
}

/* ----------------------------------------------------------------- stripe */

async function stripe(path, form = {}) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(form)) {
    if (v !== undefined && v !== null) body.append(k, String(v));
  }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': '2024-06-20',
    },
    body,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe ${path} failed (${res.status})`);
  return json;
}

let cachedLocationId = null;
async function ensureLocation() {
  if (cachedLocationId) return cachedLocationId;

  const res = await fetch('https://api.stripe.com/v1/terminal/locations?limit=100', {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? 'Could not list Terminal locations');

  const existing = (json.data ?? []).find((l) => l.display_name === LOCATION_NAME);
  if (existing) {
    cachedLocationId = existing.id;
    return cachedLocationId;
  }

  const created = await stripe('terminal/locations', {
    display_name: LOCATION_NAME,
    'address[line1]': process.env.STRIPE_LOCATION_LINE1 ?? '1 Demo Street',
    'address[city]': process.env.STRIPE_LOCATION_CITY ?? 'Budapest',
    'address[postal_code]': process.env.STRIPE_LOCATION_POSTAL ?? '1051',
    'address[country]': process.env.STRIPE_LOCATION_COUNTRY ?? 'HU',
  });
  cachedLocationId = created.id;
  return cachedLocationId;
}

/* ------------------------------------------------------------------- http */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

/** Serves `dist/`, trying `<path>.html` so expo-router's static routes work. */
function serveStatic(req, res, pathname) {
  if (!existsSync(WEB_ROOT)) return false;

  // normalize() collapses any ../ before it can escape the web root.
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates =
    rel === '/' || rel === ''
      ? ['index.html']
      : [rel.slice(1), `${rel.slice(1)}.html`, join(rel.slice(1), 'index.html')];

  for (const candidate of candidates) {
    const file = resolve(WEB_ROOT, candidate);
    if (!file.startsWith(WEB_ROOT)) continue;
    if (!existsSync(file) || !statSync(file).isFile()) continue;

    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': candidate.endsWith('.html') ? 'no-store' : 'public, max-age=3600',
    });
    createReadStream(file).pipe(res);
    return true;
  }
  return false;
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});

  const pathname = (req.url ?? '/').split('?')[0];

  try {
    if (pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        stripe: KEY ? 'test' : 'not configured',
        web: existsSync(WEB_ROOT) ? 'serving dist/' : 'no dist/ — run expo export',
        sessions: sessions.size,
      });
    }

    // --- tap relay -------------------------------------------------------
    const relay = pathname.match(/^\/relay\/([A-Za-z0-9-]{1,16})(\/[a-z]+)?$/);
    if (relay) {
      const code = relay[1].toUpperCase();
      const verb = relay[2] ?? '';

      if (req.method === 'GET' && !verb) {
        return sendJson(res, 200, getSession(code));
      }
      if (req.method === 'POST' && verb === '/arm') {
        const { amount = 0, currency = 'EUR', collector = '' } = await readBody(req);
        return sendJson(
          res,
          200,
          putSession(code, { armed: true, paid: false, amount, currency, collector, payer: '' })
        );
      }
      if (req.method === 'POST' && verb === '/pay') {
        const { payer = '' } = await readBody(req);
        return sendJson(res, 200, putSession(code, { paid: true, payer }));
      }
      if (req.method === 'POST' && verb === '/reset') {
        sessions.delete(code);
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 405, { error: `${req.method} not allowed on ${pathname}` });
    }

    // --- stripe terminal -------------------------------------------------
    if (pathname === '/connection_token' || pathname === '/location') {
      if (!KEY) {
        return sendJson(res, 501, {
          error: 'STRIPE_SECRET_KEY is not set — Terminal routes are disabled.',
        });
      }
      if (pathname === '/connection_token') {
        const token = await stripe('terminal/connection_tokens');
        return sendJson(res, 200, { secret: token.secret });
      }
      return sendJson(res, 200, { id: await ensureLocation() });
    }

    // --- the web app -----------------------------------------------------
    if (req.method === 'GET' && serveStatic(req, res, pathname)) return;

    return sendJson(res, 404, { error: `Not found: ${pathname}` });
  } catch (err) {
    console.error('✗', err.message);
    return sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('splitabroad demo server');
  console.log(`  http://localhost:${PORT}/health`);
  console.log(`  web:    ${existsSync(WEB_ROOT) ? WEB_ROOT : 'dist/ missing — run: npx expo export --platform web'}`);
  console.log(`  stripe: ${KEY ? 'test mode' : 'not configured (relay + web still work)'}`);
});

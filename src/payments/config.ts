/**
 * Stripe Terminal needs a *server* to mint connection tokens — the secret key
 * must never ship inside the app. `server/index.mjs` in this repo is a
 * zero-dependency implementation; point this at it (or at your own backend).
 *
 * Set it in `.env`:
 *   EXPO_PUBLIC_TERMINAL_BACKEND_URL=http://192.168.1.20:4242
 *
 * Leave it unset and the app simply stays in Simulated Reader mode.
 */
export const TERMINAL_BACKEND_URL = (
  process.env.EXPO_PUBLIC_TERMINAL_BACKEND_URL ?? ''
).replace(/\/$/, '');

/** Shown on the OS Tap to Pay sheet. */
export const MERCHANT_DISPLAY_NAME =
  process.env.EXPO_PUBLIC_MERCHANT_NAME ?? 'splitabroad (test)';

/**
 * Discover Stripe's *Simulated Reader* instead of the phone's NFC radio while
 * still going through the real SDK and a real test-mode PaymentIntent. Useful
 * on a simulator, or anywhere Tap to Pay is region-locked.
 *   EXPO_PUBLIC_TERMINAL_SIMULATED=1
 */
export const USE_SIMULATED_READER = process.env.EXPO_PUBLIC_TERMINAL_SIMULATED === '1';

export const hasBackend = () => TERMINAL_BACKEND_URL.length > 0;

async function backendJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasBackend()) {
    throw new Error(
      'No Stripe backend configured. Set EXPO_PUBLIC_TERMINAL_BACKEND_URL, or use Simulated Reader mode.'
    );
  }
  const res = await fetch(`${TERMINAL_BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Backend ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

/** Handed to `StripeTerminalProvider` — the SDK calls it whenever it needs auth. */
export async function fetchConnectionToken(): Promise<string> {
  const { secret } = await backendJson<{ secret: string }>('/connection_token');
  return secret;
}

/** Tap to Pay readers must be registered against a Terminal location. */
export async function fetchLocationId(): Promise<string> {
  const { id } = await backendJson<{ id: string }>('/location');
  return id;
}

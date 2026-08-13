import { Platform } from 'react-native';

/**
 * The "second phone" channel.
 *
 * A demo of a contactless payment is much more convincing when the *payer*
 * triggers it than when it fires on a timer. The presenter's tap screen arms a
 * short code and polls it; the payer opens `/pay?code=…` on their own phone and
 * posts to it. It's a stage prop — in-memory on the server, no auth, no money.
 */

export type RelaySession = {
  armed: boolean;
  paid: boolean;
  amount: number;
  currency: string;
  collector: string;
  payer: string;
};

/**
 * The server hosts the web build, so on web the relay is same-origin and needs
 * no configuration at all. Native builds need to be told where it lives.
 */
export function relayBase(): string | null {
  const configured = process.env.EXPO_PUBLIC_RELAY_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return null;
}

export const relayAvailable = () => relayBase() !== null;

/** Short, unambiguous codes — no 0/O or 1/I to misread off a screen. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newCode(length = 4) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  const base = relayBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/relay/${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // The relay is a nicety — never let it break the payment flow.
    return null;
  }
}

/** Presenter side: publish what's being collected, and clear any previous pay. */
export function armSession(
  code: string,
  data: { amount: number; currency: string; collector: string }
) {
  return call<RelaySession>(`${code}/arm`, { method: 'POST', body: JSON.stringify(data) });
}

/** Payer side: the tap. */
export function paySession(code: string, payer: string) {
  return call<RelaySession>(`${code}/pay`, { method: 'POST', body: JSON.stringify({ payer }) });
}

export function readSession(code: string) {
  return call<RelaySession>(code);
}

export function resetSession(code: string) {
  return call<{ ok: boolean }>(`${code}/reset`, { method: 'POST' });
}

/**
 * Where the payer's phone goes. Deliberately *not* shown as a QR code on the
 * tap screen: QR is the app's alternative payment rail (Revolut, PayPal, Wise),
 * and putting one on the contactless screen would blur the two features. The
 * payer opens this once and then only needs the 4-character code.
 */
export function payerUrl(code: string) {
  const base = relayBase() ?? '';
  return `${base}/pay?code=${code}`;
}

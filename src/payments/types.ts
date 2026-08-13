import type { CurrencyCode } from '@/lib/money';

/**
 * `simulated` runs Stripe's Simulated Reader (or a pure software animation when
 * the native SDK isn't present at all). `hardware` drives the phone's own NFC
 * radio through Stripe Tap to Pay. The demo defaults to `simulated` so a live
 * pitch can never be derailed by region/Apple-ID restrictions on the reader.
 */
export type TerminalMode = 'simulated' | 'hardware';

export type TerminalPhase =
  | 'idle'
  | 'connecting'
  | 'waiting'
  | 'processing'
  | 'success'
  | 'error'
  | 'cancelled';

export type ChargeRequest = {
  amount: number;
  currency: CurrencyCode;
  description: string;
  /** Who this charge settles, so the success screen can name them. */
  personId: string;
  personName: string;
};

export type ChargeResult =
  | { status: 'success'; paymentIntentId: string | null }
  | { status: 'error'; message: string }
  | { status: 'cancelled' };

export type TerminalSnapshot = {
  mode: TerminalMode;
  phase: TerminalPhase;
  /** Human-readable line shown under the NFC target. */
  message: string;
  /** True when the native Stripe Terminal SDK is actually linked in. */
  hardwareAvailable: boolean;
  request: ChargeRequest | null;
};

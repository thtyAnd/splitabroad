import { railColors } from '@/theme/tokens';

import { formatAmount, type CurrencyCode } from './money';

/** Every way a person can settle up. `tap` is the SoftPOS / Stripe Tap to Pay rail. */
export type RailId = 'revolut' | 'paypal' | 'wise' | 'venmo' | 'cash' | 'tap';

export type Rail = {
  id: RailId;
  name: string;
  emoji: string;
  color: string;
  /** Rails without a handle need no setup on the collector's side. */
  needsHandle: boolean;
  handlePlaceholder: string;
  /** What the collector's account looks like, shown under the field. */
  hint: string;
};

export const RAILS: Rail[] = [
  {
    id: 'revolut',
    name: 'Revolut',
    emoji: '🔵',
    color: railColors.revolut,
    needsHandle: true,
    handlePlaceholder: '@username',
    hint: 'revolut.me/username',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    emoji: '🅿️',
    color: railColors.paypal,
    needsHandle: true,
    handlePlaceholder: '@username',
    hint: 'paypal.me/username',
  },
  {
    id: 'wise',
    name: 'Wise',
    emoji: '🟢',
    color: railColors.wise,
    needsHandle: true,
    handlePlaceholder: 'link handle',
    hint: 'wise.com/pay/me/handle',
  },
  {
    id: 'venmo',
    name: 'Venmo',
    emoji: '💙',
    color: railColors.venmo,
    needsHandle: true,
    handlePlaceholder: '@username',
    hint: 'venmo.com/username',
  },
  {
    id: 'cash',
    name: 'Cash',
    emoji: '💵',
    color: railColors.cash,
    needsHandle: false,
    handlePlaceholder: '',
    hint: 'Always available',
  },
  {
    id: 'tap',
    name: 'Tap to pay',
    emoji: '📲',
    color: railColors.tap,
    needsHandle: false,
    handlePlaceholder: '',
    hint: 'Card or wallet, tapped on this phone',
  },
];

export function rail(id: RailId): Rail {
  return RAILS.find((r) => r.id === id) ?? RAILS[4];
}

/** Rails the collector configures a handle for on step 1. */
export const HANDLE_RAILS = RAILS.filter((r) => r.needsHandle);

/** Strips the decorative `@` and any pasted URL prefix off a handle. */
function normalizeHandle(handle: string) {
  return handle
    .trim()
    .replace(/^https?:\/\/(www\.)?[^/]+\//i, '')
    .replace(/^@/, '');
}

/**
 * The URL a payer opens (and that we encode into their QR code).
 * Returns null for rails that have no link — cash and the NFC terminal.
 */
export function payLink(
  railId: RailId,
  handle: string,
  amount: number,
  currency: CurrencyCode,
  note: string
): string | null {
  const h = normalizeHandle(handle);
  if (!h) return null;
  const value = formatAmount(amount, currency);

  switch (railId) {
    case 'revolut':
      return `https://revolut.me/${h}?amount=${value}&currency=${currency}`;
    case 'paypal':
      return `https://paypal.me/${h}/${value}${currency}`;
    case 'wise':
      return `https://wise.com/pay/me/${h}?amount=${value}&currency=${currency}`;
    case 'venmo':
      return `https://venmo.com/${h}?txn=pay&amount=${value}&note=${encodeURIComponent(note)}`;
    default:
      return null;
  }
}

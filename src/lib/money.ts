type CurrencyMeta = {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
};

/**
 * Decimals follow ISO 4217, with two deliberate exceptions: COP and HUF are
 * nominally two-decimal but nobody prices anything in centavos or fillér, and a
 * bill reading "$135000.00" looks broken to the person holding it.
 */
export const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  { code: 'USD', symbol: '$', name: 'US dollar', decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'Pound sterling', decimals: 2 },
  { code: 'COP', symbol: '$', name: 'Colombian peso', decimals: 0 },

  { code: 'CHF', symbol: 'CHF', name: 'Swiss franc', decimals: 2 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian krone', decimals: 2 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish krona', decimals: 2 },
  { code: 'DKK', symbol: 'kr', name: 'Danish krone', decimals: 2 },
  { code: 'PLN', symbol: 'zł', name: 'Polish złoty', decimals: 2 },
  { code: 'CZK', symbol: 'Kč', name: 'Czech koruna', decimals: 2 },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian forint', decimals: 0 },
  { code: 'RON', symbol: 'lei', name: 'Romanian leu', decimals: 2 },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian lev', decimals: 2 },
  { code: 'ISK', symbol: 'kr', name: 'Icelandic króna', decimals: 0 },
  { code: 'TRY', symbol: '₺', name: 'Turkish lira', decimals: 2 },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian hryvnia', decimals: 2 },

  { code: 'CAD', symbol: 'C$', name: 'Canadian dollar', decimals: 2 },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican peso', decimals: 2 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian real', decimals: 2 },
  { code: 'ARS', symbol: 'AR$', name: 'Argentine peso', decimals: 2 },
  { code: 'CLP', symbol: 'CL$', name: 'Chilean peso', decimals: 0 },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian sol', decimals: 2 },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan peso', decimals: 2 },
  { code: 'BOB', symbol: 'Bs', name: 'Bolivian boliviano', decimals: 2 },
  { code: 'PYG', symbol: '₲', name: 'Paraguayan guaraní', decimals: 0 },
  { code: 'VES', symbol: 'Bs.', name: 'Venezuelan bolívar', decimals: 2 },
  { code: 'CRC', symbol: '₡', name: 'Costa Rican colón', decimals: 2 },
  { code: 'DOP', symbol: 'RD$', name: 'Dominican peso', decimals: 2 },

  { code: 'JPY', symbol: '¥', name: 'Japanese yen', decimals: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese yuan', decimals: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian rupee', decimals: 2 },
  { code: 'KRW', symbol: '₩', name: 'South Korean won', decimals: 0 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore dollar', decimals: 2 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong dollar', decimals: 2 },
  { code: 'THB', symbol: '฿', name: 'Thai baht', decimals: 2 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese đồng', decimals: 0 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian rupiah', decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian dollar', decimals: 2 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand dollar', decimals: 2 },
  { code: 'ZAR', symbol: 'R', name: 'South African rand', decimals: 2 },

  { code: 'AED', symbol: 'AED', name: 'UAE dirham', decimals: 2 },
  { code: 'ILS', symbol: '₪', name: 'Israeli shekel', decimals: 2 },
  { code: 'SAR', symbol: 'SR', name: 'Saudi riyal', decimals: 2 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian pound', decimals: 2 },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan dirham', decimals: 2 },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan shilling', decimals: 2 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian naira', decimals: 2 },
] as const satisfies readonly CurrencyMeta[];

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];


export function currencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

/** `EUR €` — the compact form used on buttons and pickers. */
export function currencyLabel(code: CurrencyCode) {
  const { symbol } = currencyMeta(code);
  return `${code} ${symbol}`;
}

export function symbolFor(code: CurrencyCode) {
  return currencyMeta(code).symbol;
}

/** `€128.50` — symbol-prefixed, currency-aware decimals. */
export function formatMoney(amount: number, code: CurrencyCode) {
  const { symbol, decimals } = currencyMeta(code);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${safe.toFixed(decimals)}`;
}

/** Bare number, no symbol — for text inputs. */
export function formatAmount(amount: number, code: CurrencyCode) {
  const { decimals } = currencyMeta(code);
  const safe = Number.isFinite(amount) ? amount : 0;
  return safe.toFixed(decimals);
}

/** Tolerant parse of whatever the user typed (accepts `12,50` and `12.50`). */
export function parseAmount(raw: string) {
  const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(',', '.');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}

/** Stripe works in minor units. JPY is zero-decimal. */
export function toMinorUnits(amount: number, code: CurrencyCode) {
  const { decimals } = currencyMeta(code);
  return Math.round(amount * 10 ** decimals);
}

/**
 * Split `total` across `count` people without losing or inventing cents:
 * the remainder is spread one minor unit at a time over the first shares.
 */
export function splitEvenly(total: number, count: number, code: CurrencyCode): number[] {
  if (count <= 0) return [];
  const { decimals } = currencyMeta(code);
  const factor = 10 ** decimals;
  const totalMinor = Math.round(total * factor);
  const base = Math.floor(totalMinor / count);
  const remainder = totalMinor - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / factor);
}

/** Rounds to the currency's precision so sums don't drift by float dust. */
export function roundTo(amount: number, code: CurrencyCode) {
  const factor = 10 ** currencyMeta(code).decimals;
  return Math.round(amount * factor) / factor;
}

/**
 * Rounds a set of exact shares to displayable amounts that still add up to
 * `target`. Rounding each share on its own drifts — four people splitting
 * 128.50 each land on 32.13, which sums to 128.52. Largest-remainder
 * allocation hands the spare cents to the shares that lost the most.
 */
export function allocateRounded(
  values: number[],
  target: number,
  code: CurrencyCode
): number[] {
  if (!values.length) return [];
  const factor = 10 ** currencyMeta(code).decimals;
  const targetMinor = Math.round(target * factor);

  const floors = values.map((v) => Math.floor(v * factor));
  const spare = targetMinor - floors.reduce((sum, v) => sum + v, 0);

  const byRemainder = values
    .map((v, i) => ({ i, frac: v * factor - Math.floor(v * factor) }))
    .sort((a, b) => b.frac - a.frac);

  for (let n = 0; n < Math.abs(spare); n++) {
    const { i } = byRemainder[n % byRemainder.length];
    floors[i] += Math.sign(spare);
  }

  return floors.map((v) => v / factor);
}

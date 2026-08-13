import type { CurrencyCode } from './money';

export type Region = 'Europe' | 'Americas' | 'Asia-Pacific' | 'Africa & Middle East';

export const REGIONS: { id: Region; flag: string; blurb: string }[] = [
  { id: 'Europe', flag: '🇪🇺', blurb: 'Euro, pound, forint, złoty…' },
  { id: 'Americas', flag: '🌎', blurb: 'Dollar, peso, real, sol…' },
  { id: 'Asia-Pacific', flag: '🌏', blurb: 'Yen, rupee, won, baht…' },
  { id: 'Africa & Middle East', flag: '🌍', blurb: 'Rand, dirham, shekel…' },
];

export type Country = {
  /** ISO 3166-1 alpha-2, also the key we store in state. */
  code: string;
  name: string;
  flag: string;
  currency: CurrencyCode;
  region: Region;
};

/**
 * Where you are decides what you pay in — asking for the country and deriving
 * the currency is one less thing for someone abroad to get wrong. Several
 * countries share a currency (the eurozone, and the places that use USD
 * outright), which is exactly why the mapping goes this direction.
 */
export const COUNTRIES: Country[] = [
  // Europe
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', currency: 'HUF', region: 'Europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currency: 'EUR', region: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currency: 'EUR', region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', currency: 'EUR', region: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currency: 'EUR', region: 'Europe' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', currency: 'EUR', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', currency: 'EUR', region: 'Europe' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', currency: 'EUR', region: 'Europe' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', currency: 'EUR', region: 'Europe' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', currency: 'EUR', region: 'Europe' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', currency: 'EUR', region: 'Europe' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', currency: 'EUR', region: 'Europe' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', currency: 'CHF', region: 'Europe' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', currency: 'NOK', region: 'Europe' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', currency: 'SEK', region: 'Europe' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', currency: 'DKK', region: 'Europe' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', currency: 'PLN', region: 'Europe' },
  { code: 'CZ', name: 'Czechia', flag: '🇨🇿', currency: 'CZK', region: 'Europe' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', currency: 'RON', region: 'Europe' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', currency: 'BGN', region: 'Europe' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', currency: 'ISK', region: 'Europe' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷', currency: 'TRY', region: 'Europe' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', currency: 'UAH', region: 'Europe' },

  // Americas
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', region: 'Americas' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currency: 'USD', region: 'Americas' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currency: 'CAD', region: 'Americas' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', currency: 'MXN', region: 'Americas' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', currency: 'BRL', region: 'Americas' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', region: 'Americas' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', region: 'Americas' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', currency: 'PEN', region: 'Americas' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', currency: 'UYU', region: 'Americas' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', currency: 'BOB', region: 'Americas' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', currency: 'PYG', region: 'Americas' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', currency: 'VES', region: 'Americas' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', currency: 'USD', region: 'Americas' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', currency: 'USD', region: 'Americas' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', currency: 'CRC', region: 'Americas' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', currency: 'DOP', region: 'Americas' },

  // Asia-Pacific
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY', region: 'Asia-Pacific' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currency: 'CNY', region: 'Asia-Pacific' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currency: 'INR', region: 'Asia-Pacific' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW', region: 'Asia-Pacific' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', region: 'Asia-Pacific' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', currency: 'HKD', region: 'Asia-Pacific' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB', region: 'Asia-Pacific' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', currency: 'VND', region: 'Asia-Pacific' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', currency: 'IDR', region: 'Asia-Pacific' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD', region: 'Asia-Pacific' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', currency: 'NZD', region: 'Asia-Pacific' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'SGD', region: 'Asia-Pacific' },

  // Africa & Middle East
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', region: 'Africa & Middle East' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', region: 'Africa & Middle East' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', currency: 'ILS', region: 'Africa & Middle East' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', region: 'Africa & Middle East' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', currency: 'EGP', region: 'Africa & Middle East' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', currency: 'MAD', region: 'Africa & Middle East' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', currency: 'KES', region: 'Africa & Middle East' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', region: 'Africa & Middle East' },
];

export const DEFAULT_COUNTRY = 'ES';

export function country(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function countriesIn(region: Region) {
  return COUNTRIES.filter((c) => c.region === region).sort((a, b) => a.name.localeCompare(b.name));
}

/** The region a country sits in, so reopening the picker lands where you were. */
export function regionOf(code: string): Region {
  return country(code).region;
}

/** Case- and accent-tolerant enough for a search box on a phone. */
function fold(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function searchCountries(query: string): Country[] {
  const q = fold(query.trim());
  if (!q) return COUNTRIES;
  return COUNTRIES.filter(
    (c) => fold(c.name).includes(q) || fold(c.code) === q || fold(c.currency).includes(q)
  );
}

/**
 * Design tokens lifted from the splitabroad Figma prototype
 * (https://filter-clever-78342671.figma.site).
 *
 * Values were read off the computed styles of the published prototype so the
 * native app renders pixel-identical to the design.
 */

export const colors = {
  /** page background */
  bg: '#080B16',
  /** cards, inputs, any raised surface */
  surface: '#0D1325',
  /** slightly lifted surface, used for pressed/hover states */
  surfaceAlt: '#131B33',
  /** hairline borders and the "disabled button" fill */
  border: '#1A2540',
  /** primary body copy */
  text: '#DCE4F5',
  /** secondary copy, mono labels */
  muted: '#6A7A9E',
  /** tertiary copy, hints */
  dim: '#4A5680',

  accent: '#5B73FF',
  accentAlt: '#9B6BFF',
  onAccent: '#FFFFFF',

  success: '#00D48C',
  warn: '#FFB340',
  danger: '#FF4D6A',
} as const;

/** Brand colour per payment rail, matching the design's chip tints. */
export const railColors = {
  revolut: '#818CF8',
  paypal: '#60A5FA',
  wise: '#4ADE80',
  venmo: '#38BDF8',
  cash: '#A3E635',
  tap: '#5B73FF',
} as const;

export const radius = {
  chip: 7,
  input: 10,
  card: 14,
  button: 12,
  panel: 18,
  pill: 99,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const font = {
  display: 'Outfit_700Bold',
  displaySemi: 'Outfit_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
  } as const;

/**
 * The design gives every person a hue stepped 53° around the wheel starting at
 * 220°, rendered at three fixed lightness levels.
 */
export function personPalette(index: number) {
  const hue = (220 + index * 53) % 360;
  return {
    fg: `hsl(${hue}, 65%, 68%)`,
    bg: `hsl(${hue}, 55%, 18%)`,
    border: `hsl(${hue}, 55%, 40%)`,
    /** solid accent used for the card's top rule */
    solid: `hsl(${hue}, 70%, 63%)`,
  };
}

/** Translucent overlay of a hex colour — RN has no colour-mix(). */
export function alpha(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

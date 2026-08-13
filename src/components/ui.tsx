import {
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';

/** 28px Outfit Bold — the one-per-screen page title. */
export function Display({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[styles.display, style]} />;
}

/** 20px Outfit Bold — section titles inside a screen. */
export function Heading({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[styles.heading, style]} />;
}

export function Body({
  style,
  muted,
  dim,
  ...rest
}: TextProps & { muted?: boolean; dim?: boolean }) {
  return (
    <RNText
      {...rest}
      style={[styles.body, muted && { color: colors.muted }, dim && { color: colors.dim }, style]}
    />
  );
}

/** Uppercase DM Mono caption — the design's field labels and tags. */
export function MonoLabel({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[styles.monoLabel, style]} />;
}

/** Tabular-feeling mono numerals for money. */
export function Amount({ style, ...rest }: TextProps) {
  return <RNText {...rest} style={[styles.amount, style]} />;
}

export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

/** Card with a coloured 3px rule across the top, as on the Figma QR cards. */
export function AccentCard({
  accent,
  style,
  children,
  ...rest
}: ViewProps & { accent: string }) {
  return (
    <View {...rest} style={[styles.card, styles.accentCard, style]}>
      <View style={[styles.accentRule, { backgroundColor: accent }]} />
      {children}
    </View>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function Row({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.row, style]} />;
}

/** Inline coloured tag, e.g. `🔵 Revolut · 2`. */
export function Tag({
  color,
  label,
  style,
}: {
  color: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        styles.tag,
        { borderColor: color, backgroundColor: tint(color, 0.1) },
        style,
      ]}>
      <RNText style={[styles.tagText, { color }]}>{label}</RNText>
    </View>
  );
}

/** hsl()/hex tolerant tint — RN can't do colour-mix. */
export function tint(color: string, a: number) {
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  if (color.startsWith('hsl(')) return color.replace('hsl(', 'hsla(').replace(')', `, ${a})`);
  return color;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: font.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.56,
    color: colors.text,
  },
  heading: {
    fontFamily: font.display,
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: colors.text,
  },
  body: {
    fontFamily: font.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  monoLabel: {
    fontFamily: font.mono,
    fontSize: 11,
    lineHeight: 16.5,
    letterSpacing: 0.88,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  amount: {
    fontFamily: font.monoMedium,
    fontSize: 20,
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: spacing.lg,
  },
  accentCard: {
    borderRadius: radius.panel,
    overflow: 'hidden',
    paddingTop: spacing.xl,
  },
  accentRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    borderWidth: 1,
    borderRadius: radius.chip,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: font.mono,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});

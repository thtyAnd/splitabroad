import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, font, radius } from '@/theme/tokens';

import { tint } from './ui';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Overrides the primary fill, e.g. a rail's brand colour. */
  color?: string;
  style?: ViewStyle;
  compact?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  color,
  style,
  compact,
}: Props) {
  const inert = disabled || loading;
  const accent = color ?? colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inert, busy: !!loading }}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        variant === 'primary' && { backgroundColor: inert ? colors.border : accent },
        variant === 'secondary' && {
          backgroundColor: tint(accent, 0.12),
          borderWidth: 1,
          borderColor: tint(accent, 0.45),
        },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.border },
        pressed && !inert && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onAccent : accent} size="small" />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            compact && styles.labelCompact,
            variant === 'primary' && { color: inert ? colors.muted : colors.onAccent },
            variant === 'secondary' && { color: accent },
            variant === 'ghost' && { color: colors.muted },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  compact: {
    paddingVertical: 10,
    minHeight: 40,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  label: {
    fontFamily: font.display,
    fontSize: 15,
    letterSpacing: 0.3,
  },
  labelCompact: {
    fontFamily: font.displaySemi,
    fontSize: 13.5,
  },
});

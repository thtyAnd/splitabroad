import { Pressable, StyleSheet, Text } from 'react-native';

import type { Rail } from '@/lib/rails';
import { colors, font, radius } from '@/theme/tokens';

import { tint } from './ui';

type Props = {
  rail: Rail;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
};

/** The `🔵 Revolut ✓` selector from step 2 of the design. */
export function RailChip({ rail, selected, disabled, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      accessibilityLabel={rail.name}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && { borderColor: rail.color, backgroundColor: tint(rail.color, 0.125) },
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <Text style={styles.emoji}>{rail.emoji}</Text>
      <Text style={[styles.label, selected && { color: rail.color }]}>{rail.name}</Text>
      {selected ? <Text style={[styles.check, { color: rail.color }]}>✓</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.chip,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  disabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.75,
  },
  emoji: {
    fontSize: 12,
  },
  label: {
    fontFamily: font.bodySemi,
    fontSize: 12.5,
    color: colors.muted,
  },
  check: {
    fontFamily: font.bodySemi,
    fontSize: 12,
  },
});

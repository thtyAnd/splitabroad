import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { font, personPalette } from '@/theme/tokens';

type Props = {
  /** Drives the colour: person 0 is blue, then 53° around the wheel. */
  index: number;
  name?: string;
  /** Shown when there's no name yet. Defaults to the person's number. */
  fallback?: string;
  size?: number;
  style?: ViewStyle;
};

/** Circular initial badge. */
export function Avatar({ index, name, fallback, size = 30, style }: Props) {
  const palette = personPalette(index);
  const initial = name?.trim() ? name.trim()[0].toUpperCase() : (fallback ?? String(index));

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}>
      <Text style={[styles.text, { color: palette.fg, fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: font.bodyBold,
  },
});

import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { colors, font, radius, spacing } from '@/theme/tokens';

import { MonoLabel, tint } from './ui';

type Props = {
  label?: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  /** Renders the value in DM Mono — used for every money input. */
  mono?: boolean;
  /** Fixed glyph pinned inside the field, e.g. the currency symbol. */
  prefix?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  accent?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next';
};

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize = 'sentences',
  mono,
  prefix,
  style,
  inputStyle,
  accent = colors.accent,
  onSubmitEditing,
  returnKeyType,
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={style}>
      {label ? <MonoLabel style={styles.label}>{label}</MonoLabel> : null}
      <View
        style={[
          styles.box,
          focused && { borderColor: accent, backgroundColor: tint(accent, 0.06) },
        ]}>
        {prefix ? (
          <MonoLabel style={[styles.prefix, focused && { color: accent }]}>{prefix}</MonoLabel>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.dim}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          selectionColor={accent}
          style={[styles.input, mono && styles.inputMono, inputStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
  },
  prefix: {
    fontSize: 13,
    letterSpacing: 0,
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 12,
    // RN Web draws a focus ring on top of our own; we style the box instead.
    outlineWidth: 0,
  },
  inputMono: {
    fontFamily: font.mono,
    letterSpacing: 0.5,
  },
});

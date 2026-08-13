import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOut } from 'react-native-reanimated';

import { useTerminal } from '@/payments/terminal';
import { colors, font, radius, spacing } from '@/theme/tokens';

import { MonoLabel, tint } from './ui';

/** Bill → You → Split → Collect. */
export const STEPS = [1, 2, 3, 4] as const;
export type Step = (typeof STEPS)[number];

type Props = {
  /** 1-based index of the active step; anything before it renders as done. */
  step?: Step;
};

/**
 * The design's sticky header. Long-pressing the logo is the demo's hidden
 * escape hatch: it flips between the phone's real NFC reader and the
 * always-works simulated one (spec §4).
 */
export function AppHeader({ step }: Props) {
  const { mode, toggleMode, hardwareBlockedReason } = useTerminal();
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 2600);
    return () => clearTimeout(timer);
  }, [flash]);

  const onLongPress = useCallback(() => {
    const next = toggleMode();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    setFlash(
      next === 'hardware'
        ? hardwareBlockedReason
          ? `Hardware reader — ${hardwareBlockedReason}`
          : 'Hardware reader — real Tap to Pay'
        : 'Simulated reader — no hardware needed'
    );
  }, [toggleMode, hardwareBlockedReason]);

  return (
    <View>
      <View style={styles.bar}>
        <Pressable
          onLongPress={onLongPress}
          delayLongPress={700}
          accessibilityRole="button"
          accessibilityLabel="splitabroad. Long press to switch card reader mode."
          style={styles.brand}>
          <LinearGradient
            colors={[colors.accent, colors.accentAlt]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}>
            <Text style={styles.logoGlyph}>÷</Text>
          </LinearGradient>
          <Text style={styles.wordmark}>splitabroad</Text>
          {mode === 'hardware' ? (
            <View style={styles.modeDot}>
              <Text style={styles.modeDotText}>NFC</Text>
            </View>
          ) : null}
        </Pressable>

        {step ? <Steps active={step} /> : null}
      </View>

      {flash ? (
        <Animated.View entering={FadeInUp.duration(180)} exiting={FadeOut} style={styles.flash}>
          <MonoLabel style={styles.flashText}>{flash}</MonoLabel>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Steps({ active }: { active: number }) {
  return (
    <View style={styles.steps}>
      {STEPS.map((n, i) => (
        <View key={n} style={styles.stepGroup}>
          {i > 0 ? <View style={styles.connector} /> : null}
          <View
            style={[
              styles.step,
              n === active && { backgroundColor: colors.accent },
              n < active && { backgroundColor: tint(colors.accent, 0.18) },
            ]}>
            <Text
              style={[
                styles.stepText,
                n === active && { color: colors.onAccent },
                n < active && { color: colors.accent },
              ]}>
              {n < active ? '✓' : n}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: radius.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    color: colors.onAccent,
    fontSize: 14,
    fontFamily: font.bodyBold,
    lineHeight: 18,
  },
  wordmark: {
    fontFamily: font.display,
    fontSize: 16,
    letterSpacing: -0.15,
    color: colors.text,
  },
  modeDot: {
    marginLeft: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: tint(colors.warn, 0.16),
    borderWidth: 1,
    borderColor: tint(colors.warn, 0.5),
  },
  modeDotText: {
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 0.6,
    color: colors.warn,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    width: 10,
    height: 1,
    backgroundColor: colors.border,
  },
  step: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: font.bodyBold,
    fontSize: 10,
    color: colors.muted,
  },
  flash: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
    backgroundColor: tint(colors.warn, 0.12),
    borderBottomWidth: 1,
    borderBottomColor: tint(colors.warn, 0.3),
  },
  flashText: {
    color: colors.warn,
    fontSize: 10,
  },
});

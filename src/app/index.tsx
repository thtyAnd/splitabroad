import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Screen } from '@/components/Screen';
import { Body, MonoLabel } from '@/components/ui';
import { useBill } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

/** How long the launch pulse runs before the start screen takes over. */
const PULSE_MS = 900;

/**
 * The front door. One tappable mark, a beat of feedback, then the app proper.
 * It gives the demo a clean opening frame and somewhere to land on "start over".
 */
export default function LaunchScreen() {
  const router = useRouter();
  const { reset } = useBill();
  const [launching, setLaunching] = useState(false);

  const enter = useCallback(() => {
    if (launching) return;
    setLaunching(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    reset();
    setTimeout(() => router.push('/start'), PULSE_MS);
  }, [launching, reset, router]);

  return (
    <Screen bare scroll={false} contentStyle={styles.fill}>
      <View style={styles.body}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open splitabroad"
          onPress={enter}
          style={styles.hit}>
          <Mark launching={launching} />
        </Pressable>

        <Animated.View style={styles.copy}>
          <Text style={styles.wordmark}>splitabroad</Text>
          <Body muted style={styles.tagline}>
            Split any bill, in any currency, with anyone.
          </Body>
        </Animated.View>
      </View>

      <Animated.View style={styles.footer}>
        <MonoLabel style={styles.hint}>
          {launching ? 'Opening…' : 'Tap the mark to start'}
        </MonoLabel>
      </Animated.View>
    </Screen>
  );
}

/** The ÷ tile: breathes while idle, then throws a ring on tap. */
function Mark({ launching }: { launching: boolean }) {
  const breathe = useSharedValue(0);
  const press = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => cancelAnimation(breathe);
  }, [breathe]);

  useEffect(() => {
    if (!launching) return;
    cancelAnimation(breathe);
    press.value = withSequence(
      withSpring(1.14, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );
    ring.value = withTiming(1, { duration: PULSE_MS, easing: Easing.out(Easing.quad) });
  }, [launching, press, ring, breathe]);

  const tile = useAnimatedStyle(() => ({
    transform: [
      { scale: launching ? press.value : 1 + breathe.value * 0.035 },
    ],
  }));

  const halo = useAnimatedStyle(() => ({
    transform: [{ scale: 0.75 + (launching ? ring.value : breathe.value) * 0.85 }],
    opacity: launching ? (1 - ring.value) * 0.5 : 0.06 + breathe.value * 0.06,
  }));

  return (
    <View style={styles.markWrap}>
      <Animated.View style={[styles.halo, halo]} />
      <Animated.View style={tile}>
        <LinearGradient
          colors={[colors.accent, colors.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tile}>
          <Text style={styles.glyph}>÷</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    padding: spacing.lg,
  },
  markWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'rgba(91, 115, 255, 0.05)',
  },
  tile: {
    width: 104,
    height: 104,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    color: colors.onAccent,
    fontFamily: font.bodyBold,
    fontSize: 48,
    lineHeight: 58,
  },
  copy: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  wordmark: {
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: -0.6,
    color: colors.text,
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  hint: {
    fontSize: 10,
    color: colors.dim,
  },
  radiusRef: { borderRadius: radius.card },
});

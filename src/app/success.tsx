import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SuccessWave } from '@/components/SuccessWave';
import { Body, MonoLabel, tint } from '@/components/ui';
import { formatMoney, type CurrencyCode } from '@/lib/money';
import { useTerminal } from '@/payments/terminal';
import { useBill } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

export default function SuccessScreen() {
  const router = useRouter();
  const { state, shareFor } = useBill();
  const { mode, reset } = useTerminal();
  const params = useLocalSearchParams<{ name?: string; amount?: string; currency?: string }>();

  const amount = Number.parseFloat(params.amount ?? '0') || 0;
  const currency = (params.currency as CurrencyCode) ?? state.currency;
  const name = params.name ?? 'They';

  const outstanding = state.people.filter((p) => !p.paid);
  const stillOwed = outstanding.reduce((sum, p) => sum + shareFor(p.id), 0);

  // Leave the terminal idle so the next tap starts from a clean state.
  useEffect(() => reset, [reset]);

  return (
    <Screen bare scroll={false} contentStyle={styles.fill}>
      <SuccessWave />

      <View style={styles.body}>
        <Checkmark />

        <Animated.View style={styles.copy}>
          <Text style={styles.title}>Payment successful!</Text>
          <Text style={styles.amount}>{formatMoney(amount, currency)}</Text>
          <Body muted style={styles.who}>
            collected from {name}
          </Body>
        </Animated.View>

        <Animated.View style={styles.meta}>
          <View style={styles.badge}>
            <MonoLabel style={styles.badgeText}>
              {mode === 'hardware' ? 'Stripe test mode · no funds moved' : 'Simulated reader · demo'}
            </MonoLabel>
          </View>
          {outstanding.length ? (
            <Body dim style={styles.remaining}>
              {outstanding.length} {outstanding.length === 1 ? 'person' : 'people'} left ·{' '}
              {formatMoney(stillOwed, currency)} still to collect
            </Body>
          ) : (
            <Body dim style={styles.remaining}>
              That was the last one — the bill is fully settled. 🎉
            </Body>
          )}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button label="Back to the bill" onPress={() => router.dismissTo('/collect')} />
      </View>
    </Screen>
  );
}

/** Pops in with a spring and throws off one ring — the spec's "celebratory" beat. */
function Checkmark() {
  const scale = useSharedValue(0);
  const ripple = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.12, { damping: 9, stiffness: 160 }),
      withSpring(1, { damping: 14 })
    );
    ripple.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.quad) });
  }, [scale, ripple]);

  const disc = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + ripple.value * 0.85 }],
    opacity: (1 - ripple.value) * 0.55,
  }));

  return (
    <View style={styles.checkWrap}>
      <Animated.View style={[styles.ripple, ring]} />
      <Animated.View style={[styles.disc, disc]}>
        <Text style={styles.check}>✓</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ripple: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: colors.success,
  },
  disc: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: tint(colors.success, 0.16),
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    fontSize: 44,
    lineHeight: 52,
    color: colors.success,
    fontFamily: font.bodyBold,
  },
  copy: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  title: {
    fontFamily: font.display,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.text,
  },
  amount: {
    fontFamily: font.monoMedium,
    fontSize: 34,
    color: colors.success,
    marginTop: spacing.sm,
  },
  who: {
    marginTop: 2,
  },
  meta: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  badgeText: {
    fontSize: 9.5,
    color: colors.muted,
  },
  remaining: {
    fontSize: 12.5,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: spacing.xxl,
  },
});

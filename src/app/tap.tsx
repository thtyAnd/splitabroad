import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Body, Card, Display, MonoLabel, tint } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import {
  armSession,
  newCode,
  payerUrl,
  readSession,
  relayAvailable,
  resetSession,
} from '@/payments/relay';
import { useTerminal } from '@/payments/terminal';
import { useBill } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

export default function TapScreen() {
  const router = useRouter();
  const { personId } = useLocalSearchParams<{ personId: string }>();
  const { state, shareFor, patchPerson } = useBill();
  const { mode, phase, message, charge, complete, cancel, reset, hardwareBlockedReason } =
    useTerminal();

  const person = state.people.find((p) => p.id === personId);
  const amount = person ? shareFor(person.id) : 0;
  const name = person?.name.trim() || 'Person';

  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  // A short code the payer types on their own phone at /pay. Not a QR — QR is
  // this app's *other* payment rail and mixing them up muddles the demo.
  const [code] = useState(() => newCode());
  // The payer is holding their own phone, so "/pay" alone is no use to them —
  // show the address they actually have to open.
  const payerAddress = payerUrl(code).replace(/^https?:\/\//, '') || 'this app at /pay';

  const run = useCallback(async () => {
    if (!person) return;
    setError(null);
    const result = await charge({
      amount,
      currency: state.currency,
      description: `${state.restaurant} — ${name}'s share`,
      personId: person.id,
      personName: name,
    });

    if (result.status === 'success') {
      patchPerson(person.id, { paid: true });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      router.replace({
        pathname: '/success',
        params: { name, amount: String(amount), currency: state.currency },
      });
    } else if (result.status === 'error') {
      setError(result.message);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  }, [person, amount, state.currency, state.restaurant, name, charge, patchPerson, router]);

  // Pressing the CTA on the previous screen is the "start" — begin immediately.
  useEffect(() => {
    if (started.current || !person) return;
    started.current = true;
    run();
  }, [person, run]);

  // Tell the relay what's being collected, so the payer's phone can show it.
  useEffect(() => {
    if (mode !== 'simulated' || !relayAvailable() || !person) return;
    armSession(code, {
      amount,
      currency: state.currency,
      collector: state.collectorName || 'the collector',
    });
    return () => {
      resetSession(code);
    };
  }, [code, amount, state.currency, state.collectorName, mode, person]);

  // Second phone: poll for the payer's tap while we're waiting for a card.
  useEffect(() => {
    if (phase !== 'waiting' || mode !== 'simulated' || !relayAvailable()) return;
    let cancelled = false;

    const timer = setInterval(async () => {
      const session = await readSession(code);
      if (cancelled || !session?.paid) return;
      clearInterval(timer);
      complete();
    }, 700);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, mode, code, complete]);

  const close = useCallback(() => {
    cancel();
    reset();
    router.back();
  }, [cancel, reset, router]);

  if (!person) {
    return (
      <Screen bare>
        <Body muted>That person is no longer on the bill.</Body>
        <Button label="Back" variant="ghost" style={styles.retry} onPress={() => router.back()} />
      </Screen>
    );
  }

  const live = phase === 'waiting';

  return (
    <Screen
      bare
      scroll={false}
      footer={
        error ? (
          <View style={styles.errorActions}>
            <Button label="Close" variant="ghost" style={styles.flex1} onPress={close} />
            <Button
              label="Try again"
              style={styles.flex2}
              onPress={() => {
                reset();
                run();
              }}
            />
          </View>
        ) : (
          <Button label="Cancel" variant="ghost" onPress={close} />
        )
      }>
      <View style={styles.body}>
        <View style={styles.top}>
          <MonoLabel>{mode === 'hardware' ? 'Tap to Pay' : 'Simulated reader'}</MonoLabel>
          <Pressable onPress={close} hitSlop={12} accessibilityRole="button">
            <MonoLabel style={styles.close}>✕</MonoLabel>
          </Pressable>
        </View>

        <Display style={styles.amount}>{formatMoney(amount, state.currency)}</Display>
        <Body muted style={styles.who}>
          from {name} · {state.restaurant}
        </Body>

        <View style={styles.target}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Simulate a card being presented to the reader"
            disabled={!live || mode !== 'simulated'}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
              }
              complete();
            }}>
            <NfcTarget active={live} error={!!error} />
          </Pressable>
        </View>

        {error ? (
          <Animated.View>
            <Card style={styles.errorCard}>
              <MonoLabel style={styles.errorTitle}>Reader error</MonoLabel>
              <Body style={styles.errorText}>{error}</Body>
              <Body dim style={styles.errorHint}>
                Long-press the logo on any screen to fall back to the simulated reader.
              </Body>
            </Card>
          </Animated.View>
        ) : (
          <>
            <Text style={[styles.status, live && { color: colors.text }]}>
              {message || 'Getting ready…'}
            </Text>
            {mode === 'simulated' && live ? (
              <View style={styles.triggerCard}>
                <MonoLabel style={styles.triggerTitle}>How to complete it</MonoLabel>
                <Body dim style={styles.triggerLine}>
                  Tap the reader above — or, from the payer&apos;s own phone, open
                </Body>
                <Text style={styles.payerUrl} selectable numberOfLines={2}>
                  {payerAddress}
                </Text>
                <Body dim style={styles.triggerLine}>
                  and enter this code
                </Body>
                <Text style={styles.code}>{code}</Text>
                {!relayAvailable() ? (
                  <Body dim style={styles.triggerLine}>
                    Second-phone trigger needs the demo server — tap the reader instead.
                  </Body>
                ) : null}
              </View>
            ) : null}

            <Body dim style={styles.legal}>
              {mode === 'hardware'
                ? 'Stripe test mode — no money moves. Accepts Apple Pay, Google Wallet, smartwatches and contactless cards.'
                : 'Simulated reader — no NFC hardware is involved. Browsers have no access to contactless payment; real tap-to-pay needs the native build.'}
            </Body>
          </>
        )}

        {mode === 'hardware' && hardwareBlockedReason && !error ? (
          <View style={styles.warnBanner}>
            <MonoLabel style={styles.warnText}>{hardwareBlockedReason}</MonoLabel>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/**
 * Three rings breathing outward from the contactless dot. One clock drives all
 * three, phase-shifted a third of a cycle apart — staggering with per-ring
 * delays is fragile, a zero-length hold can park the animation at its start.
 */
function NfcTarget({ active, error }: { active: boolean; error: boolean }) {
  const color = error ? colors.danger : colors.accent;
  const clock = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(clock);
      clock.value = 0;
      return;
    }
    clock.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [active, clock]);

  return (
    <View style={styles.rings}>
      {[0, 1, 2].map((i) => (
        <Ring key={i} index={i} active={active} color={color} clock={clock} />
      ))}
      <View style={[styles.core, { backgroundColor: tint(color, 0.18), borderColor: color }]}>
        <Text style={[styles.coreGlyph, { color }]}>◗))</Text>
      </View>
    </View>
  );
}

function Ring({
  index,
  active,
  color,
  clock,
}: {
  index: number;
  active: boolean;
  color: string;
  clock: { value: number };
}) {
  const style = useAnimatedStyle(() => {
    if (!active) return { transform: [{ scale: 0.55 }], opacity: 0.12 };
    const p = (clock.value + index / 3) % 1;
    // Ease out so the ring slows as it reaches its widest.
    const eased = 1 - (1 - p) * (1 - p);
    return {
      transform: [{ scale: 0.55 + eased * 0.75 }],
      opacity: (1 - p) * 0.55,
    };
  });

  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingTop: spacing.lg,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    color: colors.muted,
    fontSize: 14,
  },
  amount: {
    marginTop: spacing.xl,
    fontSize: 40,
    lineHeight: 54,
    textAlign: 'center',
  },
  who: {
    textAlign: 'center',
    marginTop: 2,
  },
  target: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  rings: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 2,
  },
  core: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreGlyph: {
    fontFamily: font.bodyBold,
    fontSize: 22,
    letterSpacing: -1,
  },
  status: {
    fontFamily: font.mono,
    fontSize: 13,
    letterSpacing: 0.4,
    color: colors.muted,
    textAlign: 'center',
    minHeight: 40,
  },
  legal: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  triggerCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  triggerTitle: {
    fontSize: 9.5,
  },
  triggerLine: {
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  payerUrl: {
    fontFamily: font.monoMedium,
    fontSize: 11.5,
    color: colors.text,
    textAlign: 'center',
    marginVertical: 2,
  },
  code: {
    fontFamily: font.monoMedium,
    fontSize: 26,
    letterSpacing: 7,
    color: colors.accent,
    marginTop: 2,
    marginLeft: 7,
  },
  errorCard: {
    gap: 6,
    borderColor: tint(colors.danger, 0.4),
    backgroundColor: tint(colors.danger, 0.08),
    marginBottom: spacing.lg,
  },
  errorTitle: {
    color: colors.danger,
  },
  errorText: {
    fontSize: 13,
  },
  errorHint: {
    fontSize: 11.5,
  },
  errorActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  retry: {
    marginTop: spacing.lg,
  },
  warnBanner: {
    padding: 10,
    borderRadius: radius.input,
    backgroundColor: tint(colors.warn, 0.12),
    borderWidth: 1,
    borderColor: tint(colors.warn, 0.35),
    marginBottom: spacing.lg,
  },
  warnText: {
    color: colors.warn,
    fontSize: 10,
    textAlign: 'center',
  },
});

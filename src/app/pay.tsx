import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Body, Card, Display, MonoLabel, tint } from '@/components/ui';
import { formatMoney, type CurrencyCode } from '@/lib/money';
import { paySession, readSession, relayAvailable, type RelaySession } from '@/payments/relay';
import { colors, font, radius, spacing } from '@/theme/tokens';

/**
 * The payer's screen — opened on a *second* phone during the demo.
 *
 * This is the stand-in for holding a card against the collector's phone. On a
 * real build that handshake is NFC and this screen doesn't exist; browsers have
 * no access to contactless payment, so for a web demo the payer taps here and
 * the collector's reader completes.
 */
export default function PayScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState((params.code ?? '').toUpperCase());
  const [session, setSession] = useState<RelaySession | null>(null);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  const lookup = useCallback(async (next: string) => {
    if (next.length < 4) {
      setSession(null);
      return;
    }
    setChecking(true);
    const found = await readSession(next);
    setChecking(false);
    setSession(found?.armed ? found : null);
  }, []);

  useEffect(() => {
    lookup(code);
  }, [code, lookup]);

  const pay = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setSent(true);
    await paySession(code, 'demo payer');
  }, [code]);

  if (!relayAvailable()) {
    return (
      <Screen bare>
        <Display style={styles.title}>Pay</Display>
        <Body muted style={styles.subtitle}>
          This screen needs the demo server. Open the app from the address the collector gave
          you, not from a local build.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen bare>
      <MonoLabel>Paying by card</MonoLabel>
      <Display style={styles.title}>Tap to pay</Display>
      <Body muted style={styles.subtitle}>
        Enter the 4-character code showing on the collector&apos;s phone.
      </Body>

      <Field
        label="Code"
        value={code}
        onChangeText={(next) => {
          setSent(false);
          setCode(next.toUpperCase().slice(0, 4));
        }}
        placeholder="ABCD"
        autoCapitalize="none"
        style={styles.field}
        inputStyle={styles.codeInput}
      />

      {session ? (
        <Animated.View>
          <Card style={styles.summary}>
            <MonoLabel>You are paying</MonoLabel>
            <Text style={styles.amount}>
              {formatMoney(session.amount, session.currency as CurrencyCode)}
            </Text>
            <Body muted style={styles.to}>
              to {session.collector}
            </Body>
          </Card>

          <Button
            label={sent ? '✓ Sent — check their screen' : 'Hold to pay →'}
            disabled={sent}
            style={styles.cta}
            onPress={pay}
          />

          <Body dim style={styles.note}>
            On a real device this is your card or wallet touching their phone. In the browser demo
            it&apos;s this button.
          </Body>
        </Animated.View>
      ) : code.length >= 4 ? (
        <Body style={styles.miss}>
          {checking ? 'Looking for that code…' : 'No live payment with that code. Check the screen.'}
        </Body>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 6 },
  subtitle: { marginTop: 4 },
  field: { marginTop: spacing.xl },
  codeInput: {
    fontFamily: font.monoMedium,
    fontSize: 26,
    letterSpacing: 10,
    textAlign: 'center',
  },
  summary: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: 2,
    borderColor: tint(colors.accent, 0.35),
    backgroundColor: tint(colors.accent, 0.07),
  },
  amount: {
    fontFamily: font.monoMedium,
    fontSize: 34,
    color: colors.text,
  },
  to: { fontSize: 13 },
  cta: { marginTop: spacing.lg },
  note: {
    marginTop: spacing.md,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: 'center',
  },
  miss: {
    marginTop: spacing.xl,
    color: colors.warn,
    fontSize: 12.5,
    textAlign: 'center',
  },
  panel: { borderRadius: radius.card },
});

import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { Body, Card, Display, MonoLabel, tint } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { HANDLE_RAILS } from '@/lib/rails';
import { useBill } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

/** Step 2 — who paid, and how everyone gets the money back to them. */
export default function CollectorScreen() {
  const router = useRouter();
  const { state, patch, setHandle } = useBill();

  const configured = useMemo(
    () => HANDLE_RAILS.filter((r) => (state.handles[r.id] ?? '').trim().length > 0),
    [state.handles]
  );

  const ready = state.collectorName.trim().length > 0;

  return (
    <Screen
      step={2}
      footer={
        <View style={styles.footer}>
          <Button label="← Back" variant="ghost" style={styles.back} onPress={() => router.back()} />
          <Button
            label="Next → Split it"
            style={styles.next}
            disabled={!ready}
            onPress={() => router.push('/people')}
          />
        </View>
      }>
      <MonoLabel>Step 2 of 4</MonoLabel>
      <Display style={styles.title}>You paid</Display>
      <Body muted style={styles.subtitle}>
        {state.restaurant} · {formatMoney(state.total, state.currency)} {state.currency}. Now tell
        everyone how to pay you back.
      </Body>

      <Field
        label="Your name"
        value={state.collectorName}
        onChangeText={(collectorName) => patch({ collectorName })}
        placeholder="e.g. Yuki"
        autoCapitalize="words"
        style={styles.block}
      />

      <MonoLabel style={styles.handlesLabel}>Your payment handles</MonoLabel>
      <Body muted style={styles.handlesHint}>
        Add the username or link for each app you can receive money through. Leave blank to skip an
        app.
      </Body>

      <View style={styles.handles}>
        {HANDLE_RAILS.map((r) => (
          <View key={r.id} style={styles.handleRow}>
            <View style={styles.handleName}>
              <View style={[styles.handleIcon, { borderColor: tint(r.color, 0.45) }]}>
                <Text style={styles.handleEmoji}>{r.emoji}</Text>
              </View>
              <Text style={[styles.handleText, { color: r.color }]}>{r.name}</Text>
            </View>
            <Field
              value={state.handles[r.id] ?? ''}
              onChangeText={(value) => setHandle(r.id, value)}
              placeholder={r.handlePlaceholder}
              autoCapitalize="none"
              accent={r.color}
              style={styles.handleField}
            />
          </View>
        ))}
      </View>

      <Body dim style={styles.cashNote}>
        💵 Cash is always available for anyone without an app. 📲 So is Tap to Pay — they can tap a
        card or phone straight onto yours.
      </Body>

      {ready ? (
        <Card style={styles.recap}>
          <View style={styles.recapRow}>
            <Body muted>Collecting</Body>
            <Text style={styles.recapValue}>{formatMoney(state.total, state.currency)}</Text>
          </View>
          <View style={styles.recapRow}>
            <Body muted>Apps ready</Body>
            <Text style={styles.recapMeta}>
              {configured.length
                ? configured.map((r) => r.name).join(' · ')
                : 'Cash + Tap to Pay only'}
            </Text>
          </View>
        </Card>
      ) : (
        <Body style={styles.validation}>Add your name to continue.</Body>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 6 },
  subtitle: { marginTop: 4 },
  block: { marginTop: spacing.xl },
  handlesLabel: { marginTop: spacing.xl },
  handlesHint: { marginTop: 4, fontSize: 13 },
  handles: { marginTop: spacing.md, gap: spacing.sm },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  handleName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    width: 116,
  },
  handleIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.chip,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleEmoji: { fontSize: 13 },
  handleText: {
    fontFamily: font.monoMedium,
    fontSize: 12,
  },
  handleField: { flex: 1 },
  cashNote: {
    marginTop: spacing.md,
    fontSize: 12.5,
    lineHeight: 19,
  },
  recap: { marginTop: spacing.xl, gap: 6 },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recapValue: {
    fontFamily: font.monoMedium,
    fontSize: 15,
    color: colors.text,
  },
  recapMeta: {
    fontFamily: font.mono,
    fontSize: 11.5,
    color: colors.muted,
    flexShrink: 1,
    textAlign: 'right',
  },
  validation: {
    marginTop: spacing.xl,
    color: colors.warn,
    fontSize: 12.5,
  },
  footer: { flexDirection: 'row', gap: spacing.md },
  back: { flex: 1 },
  next: { flex: 2 },
});

import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Viewfinder } from '@/components/Viewfinder';
import { Body, Card, Display, MonoLabel, tint } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { ANALYSIS_MS, mockScanResult } from '@/lib/mockReceipt';
import { useBill, type ReceiptItem } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

type Phase = 'aim' | 'analyzing' | 'result';

export default function ScanScreen() {
  const router = useRouter();
  const { state, applyScan } = useBill();
  // Reached from the start screen the entry screen doesn't exist yet, so we
  // replace rather than pop; a rescan from within /entry just goes back.
  const { next } = useLocalSearchParams<{ next?: string }>();

  const [phase, setPhase] = useState<Phase>('aim');
  const [result, setResult] = useState<ReturnType<typeof mockScanResult> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const startScan = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setPhase('analyzing');
    timer.current = setTimeout(() => {
      setResult(mockScanResult());
      setPhase('result');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }, ANALYSIS_MS);
  }, []);

  const accept = useCallback(() => {
    if (!result) return;
    applyScan(result);
    if (next === 'entry') router.replace('/entry');
    else router.back();
  }, [result, applyScan, router, next]);

  return (
    <Screen
      bare
      footer={
        phase === 'result' ? (
          <View style={styles.resultActions}>
            <Button
              label="Rescan"
              variant="ghost"
              style={styles.rescan}
              onPress={() => {
                setResult(null);
                setPhase('aim');
              }}
            />
            <Button label="Use these items →" style={styles.accept} onPress={accept} />
          </View>
        ) : (
          <Button
            label={phase === 'analyzing' ? 'Analyzing receipt…' : 'Scan receipt'}
            loading={phase === 'analyzing'}
            onPress={startScan}
          />
        )
      }>
      <View style={styles.topBar}>
        <MonoLabel>AI receipt scan</MonoLabel>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <MonoLabel style={styles.close}>Cancel ✕</MonoLabel>
        </Pressable>
      </View>

      {phase === 'result' && result ? (
        <ResultView items={result.items} total={result.total} restaurant={result.restaurant} />
      ) : (
        <Animated.View>
          <Display style={styles.title}>Scan the bill</Display>
          <Body muted style={styles.subtitle}>
            Hold the receipt inside the frame. We&apos;ll read the lines and split them for you.
          </Body>

          <View style={styles.viewfinderWrap}>
            <Viewfinder scanning={phase === 'analyzing'} />
            {phase === 'analyzing' ? (
              <Animated.View style={styles.analyzing}>
                <ActivityIndicator color={colors.accent} />
                <MonoLabel style={styles.analyzingText}>Analyzing receipt…</MonoLabel>
              </Animated.View>
            ) : null}
          </View>

          <Body dim style={styles.disclaimer}>
            Demo build — the scan is simulated and always returns the same sample receipt.
          </Body>
        </Animated.View>
      )}
    </Screen>
  );
}

function ResultView({
  items,
  total,
  restaurant,
}: {
  items: ReceiptItem[];
  total: number;
  restaurant: string;
}) {
  const { state } = useBill();

  return (
    <Animated.View>
      <Display style={styles.title}>{items.length} items found</Display>
      <Body muted style={styles.subtitle}>
        {restaurant} — check the lines, then assign them to people on the next step.
      </Body>

      <Card style={styles.itemCard}>
        {items.map((item, i) => (
          <Animated.View
            key={item.id}
            style={[styles.itemRow, i > 0 && styles.itemRowBorder]}>
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.itemPrice}>{formatMoney(item.price, state.currency)}</Text>
          </Animated.View>
        ))}
        <View style={[styles.itemRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalPrice}>{formatMoney(total, state.currency)}</Text>
        </View>
      </Card>

      <Body dim style={styles.disclaimer}>
        Accepting replaces the bill total with {formatMoney(total, state.currency)}.
      </Body>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  close: {
    color: colors.muted,
  },
  title: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  viewfinderWrap: {
    position: 'relative',
  },
  analyzing: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  analyzingText: {
    color: colors.text,
    backgroundColor: tint(colors.bg, 0.85),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  disclaimer: {
    marginTop: spacing.lg,
    fontSize: 12,
    textAlign: 'center',
  },
  itemCard: {
    padding: 0,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemLabel: {
    fontFamily: font.body,
    fontSize: 14,
    color: colors.text,
    flexShrink: 1,
  },
  itemPrice: {
    fontFamily: font.mono,
    fontSize: 13,
    color: colors.muted,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: tint(colors.accent, 0.07),
  },
  totalLabel: {
    fontFamily: font.display,
    fontSize: 14,
    color: colors.text,
  },
  totalPrice: {
    fontFamily: font.monoMedium,
    fontSize: 15,
    color: colors.text,
  },
  resultActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rescan: {
    flex: 1,
  },
  accept: {
    flex: 2,
  },
});

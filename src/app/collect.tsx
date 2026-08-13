import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { PayQr } from '@/components/PayQr';
import { Screen } from '@/components/Screen';
import { AccentCard, Body, Card, Display, MonoLabel, Tag } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { payLink, rail } from '@/lib/rails';
import { COLLECTOR_ID, useBill, type Person } from '@/state/bill';
import { colors, font, personPalette, radius, spacing } from '@/theme/tokens';

/**
 * Step 4 — collecting.
 *
 * One person fills the screen at a time and you swipe between them. A grid of
 * everyone at once looks fine on a laptop and terrible in the hand: the QR ends
 * up too small to scan, and the person actually paying can't tell which card is
 * theirs. Handling one payment at a time is also how it works at the table.
 */
/** Space between two people's cards when one is swiped past the other. */
const PAGE_GAP = 18;

export default function CollectScreen() {
  const router = useRouter();
  const { state, shareFor, patchPerson, reset } = useBill();
  const [copied, setCopied] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);

  /** Live horizontal offset of the track, in pixels. Driven on the UI thread. */
  const offset = useSharedValue(0);
  const startOffset = useSharedValue(0);

  const collector = state.collectorName || 'you';
  const people = state.people;
  const current = people[Math.min(index, people.length - 1)];

  const settled = people.filter((p) => p.paid);
  const collected = settled.reduce((sum, p) => sum + shareFor(p.id), 0);
  const allSettled = settled.length === people.length;

  const lastPage = Math.max(0, people.length - 1);

  /**
   * A swipe that springs.
   *
   * Drag past half a screen — or flick hard enough — and it advances; anything
   * short of that springs the current card back where it was, so a hesitant
   * drag never leaves you between two people. Pulling past either end meets
   * resistance rather than a wall.
   */
  const pan = useMemo(
    () =>
      Gesture.Pan()
        // Only claim the gesture once it is clearly horizontal, so taps on the
        // card's own buttons still register.
        .activeOffsetX([-14, 14])
        .failOffsetY([-18, 18])
        .onBegin(() => {
          startOffset.value = offset.value;
        })
        .onUpdate((e) => {
          const raw = startOffset.value + e.translationX;
          const min = -lastPage * pageWidth;
          // Rubber band past the ends: keep a third of the overscroll.
          if (raw > 0) offset.value = raw * 0.33;
          else if (raw < min) offset.value = min + (raw - min) * 0.33;
          else offset.value = raw;
        })
        .onEnd((e) => {
          const from = Math.round(-startOffset.value / pageWidth);
          const far = Math.abs(e.translationX) > pageWidth / 2;
          const flicked = Math.abs(e.velocityX) > 550;

          let target = from;
          if (far || flicked) target = e.translationX < 0 ? from + 1 : from - 1;
          if (target < 0) target = 0;
          if (target > lastPage) target = lastPage;

          offset.value = withSpring(-target * pageWidth, {
            damping: 19,
            stiffness: 170,
            mass: 0.9,
            velocity: e.velocityX,
          });
          runOnJS(setIndex)(target);
        }),
    [lastPage, pageWidth, offset, startOffset]
  );

  // Keep the visible page valid if someone is removed while we're on the end.
  useEffect(() => {
    if (index <= lastPage) return;
    setIndex(lastPage);
    offset.value = withSpring(-lastPage * pageWidth, { damping: 19, stiffness: 170 });
  }, [index, lastPage, pageWidth, offset]);

  const copyLink = useCallback(async (person: Person, link: string) => {
    await Clipboard.setStringAsync(link);
    setCopied(person.id);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setTimeout(() => setCopied((id) => (id === person.id ? null : id)), 1800);
  }, []);

  return (
    <Screen
      scroll={false}
      step={4}
      contentStyle={styles.fill}
      footer={
        <View style={styles.footer}>
          <Button label="← Back" variant="ghost" style={styles.back} onPress={() => router.back()} />
          <Button
            label={allSettled ? 'Done — start over' : 'Start over'}
            variant={allSettled ? 'primary' : 'ghost'}
            style={styles.next}
            onPress={() => {
              reset();
              router.dismissTo('/');
            }}
          />
        </View>
      }>
      <View style={styles.head}>
        <MonoLabel>Step 4 of 4</MonoLabel>
        <Display style={styles.title}>Collect</Display>

        <Card style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryLeft}>
              <Body muted style={styles.summaryLabel} numberOfLines={1}>
                {state.restaurant}
              </Body>
              <Text style={styles.summaryTotal}>
                {formatMoney(collected, state.currency)}
                <Text style={styles.summaryOf}>
                  {' '}
                  / {formatMoney(state.total - shareFor(COLLECTOR_ID), state.currency)}
                </Text>
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <Body muted style={styles.summaryLabel}>
                settled
              </Body>
              <Text style={styles.summaryName}>
                {settled.length}/{people.length}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Pager — springy swipe, no controls ------------------------------- */}
      <View style={styles.pager} onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
        {pageWidth > 0 ? (
          <GestureDetector gesture={pan}>
            <View style={styles.track}>
              {people.map((person, i) => (
                <Page key={person.id} index={i} pageWidth={pageWidth} offset={offset}>
                  <PayCard
                    person={person}
                    index={i + 1}
                    amount={shareFor(person.id)}
                    collector={collector}
                    copied={copied === person.id}
                    onCopy={copyLink}
                    onTap={() =>
                      router.push({ pathname: '/tap', params: { personId: person.id } })
                    }
                    onTogglePaid={() => patchPerson(person.id, { paid: !person.paid })}
                  />
                </Page>
              ))}
            </View>
          </GestureDetector>
        ) : null}
      </View>

      <MonoLabel style={styles.pagerHint}>
        {allSettled
          ? 'everyone has settled up'
          : people.length > 1
            ? `${current?.name?.trim() || `person ${index + 1}`} · ${index + 1} of ${people.length} · swipe`
            : current?.name?.trim() || 'person 1'}
      </MonoLabel>
    </Screen>
  );
}

/** One person's card. Scales and dims as it moves away from centre. */
function Page({
  index,
  pageWidth,
  offset,
  children,
}: {
  index: number;
  pageWidth: number;
  offset: SharedValue<number>;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    // 0 when this page is centred, ±1 when it is one page away.
    const away = Math.min(Math.abs((offset.value + index * pageWidth) / pageWidth), 1);
    return {
      transform: [{ translateX: offset.value }, { scale: 1 - away * 0.07 }],
      opacity: 1 - away * 0.45,
    };
  });

  return (
    <Animated.View style={[styles.page, { width: pageWidth, left: index * pageWidth }, style]}>
      <View style={styles.pageInner}>{children}</View>
    </Animated.View>
  );
}

function PayCard({
  person,
  index,
  amount,
  collector,
  copied,
  onCopy,
  onTap,
  onTogglePaid,
}: {
  person: Person;
  index: number;
  amount: number;
  collector: string;
  copied: boolean;
  onCopy: (person: Person, link: string) => void;
  onTap: () => void;
  onTogglePaid: () => void;
}) {
  const { state } = useBill();
  const railId = person.rail ?? 'cash';
  const r = rail(railId);
  const palette = personPalette(index);
  const name = person.name.trim() || `Person ${index}`;

  const link = payLink(
    railId,
    state.handles[railId] ?? '',
    amount,
    state.currency,
    `${state.restaurant} — ${name}`
  );

  return (
    <AccentCard accent={palette.solid} style={[styles.card, person.paid && styles.cardPaid]}>
      <View style={styles.cardHead}>
        <Avatar index={index} name={person.name} size={34} />
        <View style={styles.cardWho}>
          <Text style={styles.cardName} numberOfLines={1}>
            {name}
          </Text>
          <Body muted style={styles.cardCaption}>
            {railId === 'cash'
              ? `pays ${collector} in cash`
              : railId === 'tap'
                ? `taps a card to pay ${collector}`
                : `owes ${collector}`}
          </Body>
        </View>
        {person.paid ? <Text style={styles.paidCheck}>✓</Text> : null}
      </View>

      <Text style={styles.amount}>{formatMoney(amount, state.currency)}</Text>

      <View style={styles.art}>
        {railId === 'tap' ? (
          <NfcGlyph color={r.color} size={128} />
        ) : link ? (
          <PayQr value={link} size={168} />
        ) : (
          <Text style={styles.cashGlyph}>{r.emoji}</Text>
        )}
      </View>

      {railId === 'tap' ? null : <Tag color={r.color} label={`${r.emoji} ${r.name}`} />}

      {railId === 'tap' ? (
        <Button
          label={person.paid ? 'Paid' : 'Tap to pay →'}
          variant={person.paid ? 'ghost' : 'secondary'}
          color={r.color}
          disabled={person.paid}
          style={styles.cardAction}
          onPress={onTap}
        />
      ) : link ? (
        <View style={styles.linkActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Copy ${name}'s payment link`}
            onPress={() => onCopy(person, link)}
            style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <MonoLabel style={styles.linkHint}>
              {copied ? '✓ link copied' : 'tap to copy link'}
            </MonoLabel>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${r.name}`}
            onPress={() => Linking.openURL(link)}
            style={({ pressed }) => pressed && { opacity: 0.6 }}>
            <MonoLabel style={[styles.linkHint, { color: r.color }]}>open {r.name} ↗</MonoLabel>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: person.paid }}
        onPress={onTogglePaid}
        style={({ pressed }) => [styles.markPaid, pressed && { opacity: 0.6 }]}>
        <MonoLabel style={[styles.markPaidText, person.paid && { color: colors.success }]}>
          {person.paid ? 'settled ✓ — tap to undo' : 'mark as settled'}
        </MonoLabel>
      </Pressable>
    </AccentCard>
  );
}

/** Contactless "wave" mark, drawn with nested rounded borders. */
function NfcGlyph({ color, size = 78 }: { color: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[0.42, 0.66, 0.92].map((scale, i) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            borderWidth: 2.5,
            borderColor: color,
            opacity: 0.9 - i * 0.22,
          }}
        />
      ))}
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: { paddingTop: spacing.lg },
  title: { marginTop: 4 },

  summary: {
    marginTop: spacing.md,
    paddingVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  summaryLeft: { flexShrink: 1 },
  summaryRight: { alignItems: 'flex-end' },
  summaryLabel: { fontSize: 12 },
  summaryTotal: {
    fontFamily: font.monoMedium,
    fontSize: 19,
    color: colors.text,
    marginTop: 2,
  },
  summaryOf: {
    fontSize: 13,
    color: colors.muted,
  },
  summaryName: {
    fontFamily: font.display,
    fontSize: 17,
    color: colors.text,
    marginTop: 2,
  },

  pager: {
    flex: 1,
    marginTop: spacing.lg,
    minHeight: 300,
    overflow: 'hidden',
  },
  track: {
    flex: 1,
  },
  page: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  pageInner: {
    flex: 1,
    // The gutter between neighbouring cards — half on each side of the page.
    paddingHorizontal: PAGE_GAP / 2,
  },

  card: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  cardPaid: { opacity: 0.66 },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: spacing.sm,
  },
  cardWho: { flex: 1 },
  cardName: {
    fontFamily: font.display,
    fontSize: 17,
    color: colors.text,
  },
  cardCaption: { fontSize: 12 },
  paidCheck: {
    color: colors.success,
    fontFamily: font.bodyBold,
    fontSize: 16,
  },
  amount: {
    fontFamily: font.monoMedium,
    fontSize: 30,
    color: colors.text,
  },
  art: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  cashGlyph: { fontSize: 60 },
  cardAction: { alignSelf: 'stretch' },
  linkActions: { alignItems: 'center', gap: 3 },
  linkHint: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.dim,
    textTransform: 'none',
  },
  markPaid: {
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  markPaidText: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: colors.dim,
    textTransform: 'none',
  },

  pagerHint: {
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 9.5,
    color: colors.dim,
  },

  footer: { flexDirection: 'row', gap: spacing.md },
  back: { flex: 1 },
  next: { flex: 2 },
});

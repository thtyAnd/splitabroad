import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
/** Lets the arrows find the real scroll element on web — see `goTo`. */
const PAGER_ID = 'splitabroad-pager';

/**
 * The id usually lands on the scroll container, but which node react-native-web
 * puts it on is an implementation detail, so fall back to finding the one
 * element on the page that actually scrolls sideways.
 */
function findPagerElement(): HTMLElement | null {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return null;
  const tagged = document.getElementById(PAGER_ID);
  if (tagged && tagged.scrollWidth > tagged.clientWidth) return tagged;
  return (
    [...document.querySelectorAll<HTMLElement>('div')].find(
      (el) => el.scrollWidth > el.clientWidth + 8 && getComputedStyle(el).overflowX === 'auto'
    ) ?? null
  );
}

export default function CollectScreen() {
  const router = useRouter();
  const { state, shareFor, patchPerson, reset } = useBill();
  const [copied, setCopied] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const collector = state.collectorName || 'you';
  const people = state.people;
  const current = people[Math.min(index, people.length - 1)];

  const settled = people.filter((p) => p.paid);
  const collected = settled.reduce((sum, p) => sum + shareFor(p.id), 0);
  const allSettled = settled.length === people.length;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(people.length - 1, next));
      setIndex(clamped);

      if (Platform.OS === 'web') {
        // Neither ScrollView.scrollTo() nor getScrollableNode() moves the
        // element under react-native-web, so reach the real scroll container by
        // id and drive it directly. Swiping still goes through the ScrollView;
        // this is only what the arrows and dots need.
        findPagerElement()?.scrollTo({ left: clamped * pageWidth, behavior: 'smooth' });
      } else {
        scroller.current?.scrollTo({ x: clamped * pageWidth, y: 0, animated: true });
      }
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync().catch(() => {});
      }
    },
    [people.length, pageWidth]
  );

  /** After a swipe, settle on whichever page the drag ended nearest to. */
  const onScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!pageWidth) return;
      goTo(Math.round(e.nativeEvent.contentOffset.x / pageWidth));
    },
    [pageWidth, goTo]
  );

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

      {/* Pager ------------------------------------------------------------ */}
      <View style={styles.pager} onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}>
        {pageWidth > 0 ? (
          <ScrollView
            ref={scroller}
            id={PAGER_ID}
            horizontal
            // No pagingEnabled/snapToInterval: react-native-web turns those into
            // CSS scroll-snap without putting snap-align on the pages, so the
            // browser snaps every programmatic scroll straight back to zero.
            // Settling on the nearest page after a drag does the same job.
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            decelerationRate="fast"
            contentContainerStyle={{ width: pageWidth * people.length }}>
            {people.map((person, i) => (
              <View key={person.id} style={{ width: pageWidth }}>
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
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* Who am I looking at ---------------------------------------------- */}
      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous person"
          disabled={index === 0}
          onPress={() => goTo(index - 1)}
          style={({ pressed }) => [styles.arrow, index === 0 && styles.arrowOff, pressed && { opacity: 0.6 }]}>
          <Text style={styles.arrowText}>←</Text>
        </Pressable>

        <View style={styles.dots}>
          {people.map((p, i) => (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${p.name || `person ${i + 1}`}`}
              onPress={() => goTo(i)}
              hitSlop={8}>
              <View
                style={[
                  styles.dot,
                  p.paid && { backgroundColor: colors.success },
                  i === index && styles.dotActive,
                  i === index && p.paid && { backgroundColor: colors.success },
                ]}
              />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next person"
          disabled={index >= people.length - 1}
          onPress={() => goTo(index + 1)}
          style={({ pressed }) => [
            styles.arrow,
            index >= people.length - 1 && styles.arrowOff,
            pressed && { opacity: 0.6 },
          ]}>
          <Text style={styles.arrowText}>→</Text>
        </Pressable>
      </View>

      <MonoLabel style={styles.pagerHint}>
        {allSettled
          ? 'everyone has settled up'
          : `${current?.name?.trim() || `person ${index + 1}`} · swipe for the next`}
      </MonoLabel>
    </Screen>
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

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  arrow: {
    width: 40,
    height: 34,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOff: { opacity: 0.3 },
  arrowText: {
    color: colors.muted,
    fontFamily: font.display,
    fontSize: 15,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.accent,
  },
  pagerHint: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 9.5,
    color: colors.dim,
  },

  footer: { flexDirection: 'row', gap: spacing.md },
  back: { flex: 1 },
  next: { flex: 2 },
});

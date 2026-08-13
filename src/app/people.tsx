import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { MoneyField } from '@/components/MoneyField';
import { ProgressBar } from '@/components/ProgressBar';
import { RailChip } from '@/components/RailChip';
import { Screen } from '@/components/Screen';
import { Body, Card, Display, MonoLabel, tint } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { RAILS, rail, type RailId } from '@/lib/rails';
import { COLLECTOR_ID, useBill, type Person, type ReceiptItem } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

/** Rails a payer can choose. Handle-based ones need the collector set up first. */
const PAYER_RAILS: RailId[] = ['revolut', 'paypal', 'wise', 'venmo', 'cash', 'tap'];

export default function PeopleScreen() {
  const router = useRouter();
  const {
    state,
    shares,
    assigned,
    remaining,
    setSplitMode,
    addPerson,
    removePerson,
    patchPerson,
    splitEqually,
    shareFor,
  } = useBill();

  const { currency, total, people, items, splitMode } = state;

  const available = useMemo(
    () =>
      PAYER_RAILS.filter((id) => {
        const r = rail(id);
        return !r.needsHandle || (state.handles[id] ?? '').trim().length > 0;
      }),
    [state.handles]
  );

  const missingRail = people.some((p) => !p.rail);
  const balanced = Math.abs(remaining) < 0.02;
  const canContinue = !missingRail && balanced && assigned > 0;

  return (
    <Screen
      step={3}
      footer={
        <View style={styles.footer}>
          <Button label="← Back" variant="ghost" style={styles.back} onPress={() => router.back()} />
          <Button
            label="Collect →"
            style={styles.next}
            disabled={!canContinue}
            onPress={() => router.push('/collect')}
          />
        </View>
      }>
      <MonoLabel>Step 3 of 4</MonoLabel>
      <Display style={styles.title}>Who owes what?</Display>
      <Body muted style={styles.subtitle}>
        {state.restaurant} · {formatMoney(total, currency)} {currency}
      </Body>

      <Card style={styles.progressCard}>
        <View style={styles.progressHead}>
          <Body muted>Assigned</Body>
          <Text
            style={[
              styles.progressValue,
              balanced && { color: colors.success },
              remaining < -0.02 && { color: colors.danger },
            ]}>
            {formatMoney(assigned, currency)} / {formatMoney(total, currency)}
          </Text>
        </View>
        <ProgressBar
          value={total > 0 ? assigned / total : 0}
          complete={balanced}
          over={remaining < -0.02}
        />
        {!balanced ? (
          <Body
            style={[styles.progressNote, { color: remaining > 0 ? colors.warn : colors.danger }]}>
            {remaining > 0
              ? `${formatMoney(remaining, currency)} still to assign`
              : `${formatMoney(Math.abs(remaining), currency)} over the bill`}
          </Body>
        ) : null}
      </Card>

      {items.length > 0 ? (
        <>
          <View style={styles.modeSwitch}>
            <ModeTab
              label="Split by item"
              active={splitMode === 'items'}
              onPress={() => setSplitMode('items')}
            />
            <ModeTab
              label="Enter amounts"
              active={splitMode === 'manual'}
              onPress={() => setSplitMode('manual')}
            />
          </View>

          {splitMode === 'items' ? (
            <ItemsPanel items={items} />
          ) : null}
        </>
      ) : null}

      <View style={styles.people}>
        <CollectorCard />

        {people.map((person, index) => (
          <Animated.View
            key={person.id}
            layout={LinearTransition.springify().damping(18)}>
            <PersonCard
              person={person}
              index={index + 1}
              amount={shareFor(person.id)}
              available={available}
              locked={splitMode === 'items'}
              onRemove={people.length > 1 ? () => removePerson(person.id) : undefined}
              onChange={(patchValue) => patchPerson(person.id, patchValue)}
            />
          </Animated.View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button label="+ Add person" variant="ghost" compact style={styles.action} onPress={addPerson} />
        <Button
          label="÷ Split equally"
          variant="secondary"
          compact
          style={styles.action}
          onPress={splitEqually}
        />
      </View>

      {missingRail ? (
        <Body style={styles.blocker}>Everyone needs a payment method before you can collect.</Body>
      ) : !balanced ? (
        <Body style={styles.blocker}>
          The shares have to add up to {formatMoney(total, currency)}.
        </Body>
      ) : (
        <Body dim style={styles.hint}>
          {shares.length - 1} people to collect from ·{' '}
          {formatMoney(
            shares.filter((s) => s.id !== COLLECTOR_ID).reduce((sum, s) => sum + s.amount, 0),
            currency
          )}{' '}
          total
        </Body>
      )}
    </Screen>
  );
}

function ModeTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.modeTab, active && styles.modeTabActive]}>
      <Text style={[styles.modeTabText, active && { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

/** The scanned receipt, with a per-line row of who's sharing it. */
function ItemsPanel({ items }: { items: ReceiptItem[] }) {
  const { state, toggleItemAssignee } = useBill();
  const roster = [
    { id: COLLECTOR_ID, name: state.collectorName || 'You', index: 0 },
    ...state.people.map((p, i) => ({ id: p.id, name: p.name, index: i + 1 })),
  ];

  return (
    <Card style={styles.itemsCard}>
      <MonoLabel style={styles.itemsTitle}>Tap who shared each line</MonoLabel>
      {items.map((item, i) => (
        <View key={item.id} style={[styles.itemRow, i > 0 && styles.itemRowBorder]}>
          <View style={styles.itemHead}>
            <Text style={styles.itemLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.itemPrice}>{formatMoney(item.price, state.currency)}</Text>
          </View>
          <View style={styles.itemAssignees}>
            {roster.map((r) => {
              const on = item.assignedTo.includes(r.id);
              return (
                <Pressable
                  key={r.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${r.name || `Person ${r.index}`} shares ${item.label}`}
                  onPress={() => toggleItemAssignee(item.id, r.id)}
                  style={({ pressed }) => [
                    styles.assignee,
                    !on && styles.assigneeOff,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <Avatar
                    index={r.index}
                    name={r.name}
                    fallback={r.id === COLLECTOR_ID ? 'Y' : String(r.index)}
                    size={26}
                  />
                </Pressable>
              );
            })}
            {item.assignedTo.length === 0 ? (
              <Text style={styles.everyone}>everyone</Text>
            ) : null}
          </View>
        </View>
      ))}
    </Card>
  );
}

/** The person who paid — their own share is deducted, not collected. */
function CollectorCard() {
  const { state, patch, shareFor } = useBill();
  const locked = state.splitMode === 'items';
  const amount = shareFor(COLLECTOR_ID);

  return (
    <Card style={[styles.personCard, styles.collectorCard]}>
      <View style={styles.personHead}>
        <Avatar index={0} name={state.collectorName || 'You'} />
        <View style={styles.collectorName}>
          <Text style={styles.collectorText} numberOfLines={1}>
            {state.collectorName || 'You'}
          </Text>
          <View style={styles.youBadge}>
            <Text style={styles.youBadgeText}>YOU PAID</Text>
          </View>
        </View>
        {locked ? (
          <View style={styles.lockedAmount}>
            <Text style={styles.lockedAmountText}>{formatMoney(amount, state.currency)}</Text>
          </View>
        ) : (
          <MoneyField
            value={amount}
            onChange={(myShare) => patch({ myShare })}
            currency={state.currency}
            style={styles.amountField}
          />
        )}
      </View>
      <Body dim style={styles.collectorHint}>
        Your share — taken off the bill before anyone pays you back.
      </Body>
    </Card>
  );
}

function PersonCard({
  person,
  index,
  amount,
  available,
  locked,
  onRemove,
  onChange,
}: {
  person: Person;
  index: number;
  amount: number;
  available: RailId[];
  locked: boolean;
  onRemove?: () => void;
  onChange: (patch: Partial<Person>) => void;
}) {
  const { state } = useBill();
  const label = person.name.trim() ? `${person.name.trim()}'s` : 'Their';

  return (
    <Card style={styles.personCard}>
      <View style={styles.personHead}>
        <Avatar index={index} name={person.name} />
        <Field
          value={person.name}
          onChangeText={(name) => onChange({ name })}
          placeholder={`Person ${index}`}
          autoCapitalize="words"
          style={styles.nameField}
        />
        {locked ? (
          <View style={styles.lockedAmount}>
            <Text style={styles.lockedAmountText}>{formatMoney(amount, state.currency)}</Text>
          </View>
        ) : (
          <MoneyField
            value={amount}
            onChange={(next) => onChange({ amount: next })}
            currency={state.currency}
            style={styles.amountField}
          />
        )}
        {onRemove ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${person.name || `person ${index}`}`}
            hitSlop={10}
            onPress={onRemove}
            style={({ pressed }) => [styles.remove, pressed && { opacity: 0.5 }]}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <MonoLabel style={styles.methodLabel}>{label} payment method</MonoLabel>
      <View style={styles.chips}>
        {RAILS.filter((r) => available.includes(r.id)).map((r) => (
          <RailChip
            key={r.id}
            rail={r}
            selected={person.rail === r.id}
            onPress={() => onChange({ rail: r.id })}
          />
        ))}
      </View>
      {!person.rail ? <Body style={styles.error}>Select a payment method</Body> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 6 },
  subtitle: { marginTop: 4 },

  progressCard: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  progressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressValue: {
    fontFamily: font.mono,
    fontSize: 13,
    color: colors.muted,
  },
  progressNote: {
    fontSize: 12,
  },

  modeSwitch: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.lg,
    padding: 4,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 7,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: tint(colors.accent, 0.16),
  },
  modeTabText: {
    fontFamily: font.bodySemi,
    fontSize: 12.5,
    color: colors.muted,
  },

  itemsCard: {
    marginTop: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  itemsTitle: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  itemRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: 8,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemLabel: {
    fontFamily: font.body,
    fontSize: 13.5,
    color: colors.text,
    flexShrink: 1,
  },
  itemPrice: {
    fontFamily: font.mono,
    fontSize: 12.5,
    color: colors.muted,
  },
  itemAssignees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  assignee: {
    borderRadius: 13,
  },
  assigneeOff: {
    opacity: 0.28,
  },
  everyone: {
    fontFamily: font.mono,
    fontSize: 10,
    color: colors.dim,
    marginLeft: 2,
  },

  people: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  personCard: {
    gap: spacing.md,
  },
  collectorCard: {
    borderColor: tint(colors.accent, 0.3),
    backgroundColor: tint(colors.accent, 0.05),
  },
  personHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  amountField: {
    width: 108,
  },
  lockedAmount: {
    width: 108,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedAmountText: {
    fontFamily: font.mono,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },
  collectorName: {
    flex: 1,
    gap: 3,
  },
  collectorText: {
    fontFamily: font.display,
    fontSize: 15,
    color: colors.text,
  },
  youBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: tint(colors.accent, 0.18),
  },
  youBadgeText: {
    fontFamily: font.mono,
    fontSize: 8.5,
    letterSpacing: 0.7,
    color: colors.accent,
  },
  collectorHint: {
    fontSize: 11.5,
  },
  remove: {
    padding: 4,
  },
  removeText: {
    color: colors.muted,
    fontSize: 15,
  },
  methodLabel: {
    marginTop: -2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: -6,
  },
  error: {
    color: colors.danger,
    fontSize: 11.5,
    marginTop: -6,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  action: {
    flex: 1,
  },
  blocker: {
    marginTop: spacing.lg,
    color: colors.warn,
    fontSize: 12.5,
    textAlign: 'center',
  },
  hint: {
    marginTop: spacing.lg,
    fontSize: 12,
    textAlign: 'center',
  },

  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  back: {
    flex: 1,
  },
  next: {
    flex: 2,
  },
});

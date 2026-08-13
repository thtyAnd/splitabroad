import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { CountryPicker } from '@/components/CountryPicker';
import { Field } from '@/components/Field';
import { MoneyField } from '@/components/MoneyField';
import { Screen } from '@/components/Screen';
import { Body, Card, Display, Divider, MonoLabel, tint } from '@/components/ui';
import { formatMoney } from '@/lib/money';
import { useBill, type ReceiptItem } from '@/state/bill';
import { colors, font, spacing } from '@/theme/tokens';

/**
 * Step 1 — the bill itself. What's on screen depends on how the user said they
 * wanted to enter it: a total, a list of lines they type, or the scan result.
 */
export default function EntryScreen() {
  const router = useRouter();
  const { state, patch, addItem, patchItem, removeItem } = useBill();
  const mode = state.entryMode ?? 'total';

  const namedItems = state.items.filter((i) => i.label.trim() || i.price > 0);
  const ready =
    state.restaurant.trim().length > 0 &&
    (mode === 'total' ? state.total > 0 : namedItems.length > 0 && state.total > 0);

  return (
    <Screen
      step={1}
      footer={
        <View style={styles.footer}>
          <Button
            label="← Back"
            variant="ghost"
            style={styles.back}
            onPress={() => router.back()}
          />
          <Button
            label="Next → Your details"
            style={styles.next}
            disabled={!ready}
            onPress={() => router.push('/collector')}
          />
        </View>
      }>
      <MonoLabel>Step 1 of 4</MonoLabel>
      <Display style={styles.title}>The bill</Display>
      <Body muted style={styles.subtitle}>
        {mode === 'total'
          ? 'Where you ate, and what the bill came to.'
          : mode === 'items'
            ? 'Add each line from the bill. The total adds itself up.'
            : 'Check what we read off the receipt — you can still fix any line.'}
      </Body>

      <Field
        label="Restaurant"
        value={state.restaurant}
        onChangeText={(restaurant) => patch({ restaurant })}
        placeholder="e.g. Niku Kappo Kyoto"
        autoCapitalize="words"
        style={styles.block}
      />

      <View style={styles.block}>
        <CountryPicker
          label="Where are you?"
          value={state.country}
          onChange={(c) => patch({ country: c.code, currency: c.currency })}
        />
      </View>

      {mode === 'total' ? (
        <MoneyField
          label="Total bill"
          value={state.total}
          onChange={(total) => patch({ total })}
          currency={state.currency}
          style={styles.block}
        />
      ) : (
        <>
          <Divider />

          <View style={styles.itemsHead}>
            <MonoLabel>{mode === 'scan' ? 'Scanned lines' : 'Items'}</MonoLabel>
            <MonoLabel style={styles.count}>{state.items.length} lines</MonoLabel>
          </View>

          <View style={styles.items}>
            {state.items.map((item) => (
              <Animated.View
                key={item.id}
                layout={LinearTransition.springify().damping(18)}>
                <ItemRow
                  item={item}
                  currency={state.currency}
                  onChange={(next) => patchItem(item.id, next)}
                  onRemove={state.items.length > 1 ? () => removeItem(item.id) : undefined}
                />
              </Animated.View>
            ))}
          </View>

          <Button
            label="+ Add item"
            variant="ghost"
            compact
            style={styles.addItem}
            onPress={addItem}
          />

          {mode === 'scan' ? (
            <Button
              label="Rescan the receipt"
              variant="secondary"
              compact
              style={styles.rescan}
              onPress={() => router.push('/scan')}
            />
          ) : null}

          <Card style={styles.totalCard}>
            <Body muted>Total</Body>
            <Text style={styles.totalValue}>{formatMoney(state.total, state.currency)}</Text>
          </Card>
        </>
      )}

      {!ready ? (
        <Body style={styles.validation}>
          {state.restaurant.trim()
            ? mode === 'total'
              ? 'Add the bill total to continue.'
              : 'Add at least one item with a price.'
            : 'Add the restaurant name to continue.'}
        </Body>
      ) : null}
    </Screen>
  );
}

function ItemRow({
  item,
  currency,
  onChange,
  onRemove,
}: {
  item: ReceiptItem;
  currency: BillCurrency;
  onChange: (patch: Partial<ReceiptItem>) => void;
  onRemove?: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <Field
        value={item.label}
        onChangeText={(label) => onChange({ label })}
        placeholder="e.g. Miso ramen"
        style={styles.itemLabel}
      />
      <MoneyField
        value={item.price}
        onChange={(price) => onChange({ price })}
        currency={currency}
        style={styles.itemPrice}
      />
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.label || 'item'}`}
          hitSlop={10}
          onPress={onRemove}
          style={({ pressed }) => [styles.remove, pressed && { opacity: 0.5 }]}>
          <Text style={styles.removeText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type BillCurrency = Parameters<typeof formatMoney>[1];

const styles = StyleSheet.create({
  title: { marginTop: 6 },
  subtitle: { marginTop: 4 },
  block: { marginTop: spacing.xl },
  itemsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: { color: colors.dim },
  items: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemLabel: { flex: 1 },
  itemPrice: { width: 108 },
  remove: { padding: 4 },
  removeText: {
    color: colors.muted,
    fontSize: 15,
  },
  addItem: { marginTop: spacing.md },
  rescan: { marginTop: spacing.sm },
  totalCard: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: tint(colors.accent, 0.3),
    backgroundColor: tint(colors.accent, 0.06),
  },
  totalValue: {
    fontFamily: font.monoMedium,
    fontSize: 20,
    color: colors.text,
  },
  validation: {
    marginTop: spacing.lg,
    color: colors.warn,
    fontSize: 12.5,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  back: { flex: 1 },
  next: { flex: 2 },
});

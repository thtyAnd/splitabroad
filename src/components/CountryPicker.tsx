import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  COUNTRIES,
  REGIONS,
  country as findCountry,
  countriesIn,
  regionOf,
  type Country,
  type Region,
} from '@/lib/countries';
import { currencyLabel, currencyMeta, type CurrencyCode } from '@/lib/money';
import { colors, font, radius, spacing } from '@/theme/tokens';

import { Body, MonoLabel, tint } from './ui';

type Props = {
  label?: string;
  /** ISO 3166-1 alpha-2. */
  value: string;
  onChange: (country: Country) => void;
};

/**
 * Where are you? The currency follows from the answer, which is one fewer thing
 * to get wrong abroad — and it means a bill in Bogotá is in pesos without
 * anyone having to know the ISO code.
 *
 * Region first, then country: forty-odd countries in one flat list is a scroll,
 * and "which continent am I on" is a question nobody has to think about.
 */
export function CountryPicker({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<Region | null>(null);
  const [query, setQuery] = useState('');

  const selected = findCountry(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    // A search spans every region — if you know the name, don't make you
    // remember where it lives first.
    if (q) {
      return COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase() === q ||
          c.currency.toLowerCase().includes(q)
      );
    }
    return region ? countriesIn(region) : [];
  }, [query, region]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  const pick = (c: Country) => {
    onChange(c);
    close();
  };

  return (
    <View>
      {label ? <MonoLabel style={styles.label}>{label}</MonoLabel> : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Country: ${selected.name}, paying in ${selected.currency}`}
        onPress={() => {
          setRegion(regionOf(value));
          setOpen(true);
        }}
        style={({ pressed }) => [styles.box, pressed && styles.pressed]}>
        <Text style={styles.flag}>{selected.flag}</Text>
        <View style={styles.boxCopy}>
          <Text style={styles.country} numberOfLines={1}>
            {selected.name}
          </Text>
          <MonoLabel style={styles.currency}>
            {currencyLabel(selected.currency)} · {currencyMeta(selected.currency).name}
          </MonoLabel>
        </View>
        <Text style={styles.caret}>⌄</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHead}>
              {region && !query ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to regions"
                  onPress={() => setRegion(null)}
                  hitSlop={10}>
                  <MonoLabel style={styles.backLink}>← regions</MonoLabel>
                </Pressable>
              ) : (
                <MonoLabel>Where are you?</MonoLabel>
              )}
              <Pressable accessibilityRole="button" onPress={close} hitSlop={10}>
                <MonoLabel style={styles.close}>✕</MonoLabel>
              </Pressable>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search any country or currency"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor={colors.accent}
              style={styles.search}
            />

            <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
              {!region && !query ? (
                REGIONS.map((r) => (
                  <Pressable
                    key={r.id}
                    accessibilityRole="button"
                    accessibilityLabel={r.id}
                    onPress={() => setRegion(r.id)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                    <Text style={styles.flag}>{r.flag}</Text>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{r.id}</Text>
                      <MonoLabel style={styles.rowMeta}>{r.blurb}</MonoLabel>
                    </View>
                    <Text style={styles.chevron}>→</Text>
                  </Pressable>
                ))
              ) : results.length ? (
                results.map((c) => {
                  const active = c.code === value;
                  return (
                    <Pressable
                      key={c.code}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`${c.name}, ${c.currency}`}
                      onPress={() => pick(c)}
                      style={({ pressed }) => [
                        styles.row,
                        active && { backgroundColor: tint(colors.accent, 0.12) },
                        pressed && styles.rowPressed,
                      ]}>
                      <Text style={styles.flag}>{c.flag}</Text>
                      <View style={styles.rowCopy}>
                        <Text style={[styles.rowTitle, active && { color: colors.accent }]}>
                          {c.name}
                        </Text>
                        <MonoLabel style={styles.rowMeta}>
                          {currencyLabel(c.currency as CurrencyCode)}
                        </MonoLabel>
                      </View>
                      {active ? <Text style={styles.check}>✓</Text> : null}
                    </Pressable>
                  );
                })
              ) : (
                <Body dim style={styles.empty}>
                  Nothing matches “{query.trim()}”.
                </Body>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 6 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.75 },
  boxCopy: { flex: 1 },
  flag: { fontSize: 22 },
  country: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
  },
  currency: {
    fontSize: 9.5,
    marginTop: 1,
    textTransform: 'none',
  },
  caret: {
    color: colors.muted,
    fontSize: 14,
    marginTop: -6,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 5, 12, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '82%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.panel,
    padding: spacing.md,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backLink: { color: colors.accent },
  close: { color: colors.muted, fontSize: 13 },
  search: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.sm,
    outlineWidth: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    borderRadius: radius.input,
  },
  rowPressed: { opacity: 0.7 },
  rowCopy: { flex: 1 },
  rowTitle: {
    fontFamily: font.body,
    fontSize: 15,
    color: colors.text,
  },
  // Currency symbols are case-sensitive — Kč and лв must not be upper-cased.
  rowMeta: { fontSize: 9.5, marginTop: 1, textTransform: 'none' },
  chevron: {
    color: colors.muted,
    fontFamily: font.display,
    fontSize: 15,
  },
  check: {
    color: colors.accent,
    fontFamily: font.bodySemi,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: 13,
  },
});

import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Screen } from '@/components/Screen';
import { Body, Display, MonoLabel, tint } from '@/components/ui';
import { useBill, type EntryMode } from '@/state/bill';
import { colors, font, radius, spacing } from '@/theme/tokens';

type Choice = {
  mode: EntryMode;
  emoji: string;
  title: string;
  blurb: string;
  meta: string;
  accent: string;
};

const CHOICES: Choice[] = [
  {
    mode: 'scan',
    emoji: '🧾',
    title: 'Scan the receipt',
    blurb: 'Point at the bill and we read the lines off it.',
    meta: 'Fastest · itemised',
    accent: colors.accent,
  },
  {
    mode: 'items',
    emoji: '✏️',
    title: 'Type the items',
    blurb: 'Enter each line yourself, then say who had what.',
    meta: 'Itemised',
    accent: colors.accentAlt,
  },
  {
    mode: 'total',
    emoji: '💶',
    title: 'Just the total',
    blurb: 'One number, split however you like.',
    meta: 'Quickest',
    accent: colors.success,
  },
];

/** First real screen: how is the bill getting into the app? */
export default function StartScreen() {
  const router = useRouter();
  const { setEntryMode } = useBill();

  const pick = (mode: EntryMode) => {
    setEntryMode(mode);
    router.push(mode === 'scan' ? '/scan?next=entry' : '/entry');
  };

  return (
    <Screen>
      <MonoLabel>Getting started</MonoLabel>
      <Display style={styles.title}>How&apos;s the bill?</Display>
      <Body muted style={styles.subtitle}>
        Pick whichever is easiest right now — you can change the split later either way.
      </Body>

      <View style={styles.list}>
        {CHOICES.map((choice, i) => (
          <Animated.View key={choice.mode}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={choice.title}
              onPress={() => pick(choice.mode)}
              style={({ pressed }) => [
                styles.card,
                { borderColor: tint(choice.accent, 0.4) },
                pressed && { backgroundColor: tint(choice.accent, 0.12), opacity: 0.9 },
              ]}>
              <View style={[styles.icon, { backgroundColor: tint(choice.accent, 0.16) }]}>
                <Text style={styles.emoji}>{choice.emoji}</Text>
              </View>

              <View style={styles.copy}>
                <Text style={styles.cardTitle}>{choice.title}</Text>
                <Body muted style={styles.blurb}>
                  {choice.blurb}
                </Body>
                <MonoLabel style={[styles.meta, { color: choice.accent }]}>{choice.meta}</MonoLabel>
              </View>

              <Text style={[styles.chevron, { color: choice.accent }]}>→</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Body dim style={styles.note}>
        Next you&apos;ll add your name and how people can pay you back.
      </Body>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 6 },
  subtitle: { marginTop: 4 },
  list: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.panel,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  copy: { flex: 1, gap: 2 },
  cardTitle: {
    fontFamily: font.display,
    fontSize: 16,
    color: colors.text,
  },
  blurb: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  meta: {
    fontSize: 9.5,
    marginTop: 2,
  },
  chevron: {
    fontFamily: font.display,
    fontSize: 17,
  },
  note: {
    marginTop: spacing.xl,
    fontSize: 12,
    textAlign: 'center',
  },
});

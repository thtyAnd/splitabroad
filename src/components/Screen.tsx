import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/tokens';

import { AppHeader, type Step } from './AppHeader';

/** The layout is phone-first; on a wide browser it stays a centred column. */
export const CONTENT_MAX_WIDTH = 560;

type Props = {
  children: ReactNode;
  step?: Step;
  /** Hide the sticky brand bar (used by the full-bleed modal screens). */
  bare?: boolean;
  /** Pinned to the bottom above the safe area — the step's primary CTA. */
  footer?: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function Screen({ children, step, bare, footer, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  // Browsers report no safe area, but the modal screens still need breathing room.
  const topInset = Math.max(insets.top, bare ? spacing.lg : 0);

  const body = (
    <View style={[styles.column, !scroll && styles.columnFill, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      {bare ? null : <AppHeader step={step} />}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}>
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.pad,
              styles.scrollContent,
              { paddingBottom: footer ? spacing.lg : insets.bottom + spacing.xxl },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}>
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.pad]}>{body}</View>
        )}

        {footer ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.footerInner}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  pad: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: spacing.xl,
  },
  column: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
  },
  columnFill: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  footerInner: {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
  },
});

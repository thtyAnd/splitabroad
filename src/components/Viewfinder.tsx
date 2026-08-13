import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors, font, radius, spacing } from '@/theme/tokens';

import { Body, MonoLabel, tint } from './ui';

const absoluteFill = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

type Props = {
  /** Drives the sweeping laser line. */
  scanning: boolean;
};

/**
 * The camera view for the "scan the bill" demo. Uses the real camera when it's
 * available and permitted, and falls back to a drawn receipt so the flow works
 * on web, on a simulator, and when permission is denied mid-pitch.
 */
export function Viewfinder({ scanning }: Props) {
  const useNativeCamera = Platform.OS !== 'web';
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (useNativeCamera && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [useNativeCamera, permission, requestPermission]);

  const live = useNativeCamera && permission?.granted;

  return (
    <View style={styles.frame}>
      {live ? (
        <CameraView style={StyleSheet.absoluteFill} facing="back" />
      ) : (
        <FakeReceipt />
      )}

      <View style={styles.scrim} pointerEvents="none" />
      <Brackets />
      {scanning ? <Laser /> : null}
    </View>
  );
}

function Laser() {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = 0;
    y.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [y]);

  const style = useAnimatedStyle(() => ({
    top: `${y.value * 88 + 4}%`,
  }));

  return <Animated.View pointerEvents="none" style={[styles.laser, style]} />;
}

function Brackets() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.corner, styles.tl]} />
      <View style={[styles.corner, styles.tr]} />
      <View style={[styles.corner, styles.bl]} />
      <View style={[styles.corner, styles.br]} />
    </View>
  );
}

/** Drawn receipt used whenever there's no camera to show. */
function FakeReceipt() {
  return (
    <View style={styles.fake}>
      <View style={styles.paper}>
        <Text style={styles.paperTitle}>NIKU KAPPO</Text>
        <MonoLabel style={styles.paperMeta}>KYOTO · TABLE 12</MonoLabel>
        <View style={styles.paperRule} />
        {[
          ['WAGYU BURGER', '15.00'],
          ['TRUFFLE FRIES', '7.50'],
          ['CRAFT BEER x2', '11.00'],
          ['MISO RAMEN', '14.00'],
          ['SASHIMI PLATTER', '24.00'],
          ['GREEN TEA x3', '9.00'],
        ].map(([label, price]) => (
          <View key={label} style={styles.paperRow}>
            <Text style={styles.paperLine}>{label}</Text>
            <Text style={styles.paperLine}>{price}</Text>
          </View>
        ))}
        <View style={styles.paperRule} />
        <View style={styles.paperRow}>
          <Text style={[styles.paperLine, styles.paperTotal]}>TOTAL</Text>
          <Text style={[styles.paperLine, styles.paperTotal]}>128.50</Text>
        </View>
      </View>
      <Body dim style={styles.fakeHint}>
        Demo receipt — no camera on this device
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radius.panel,
    overflow: 'hidden',
    backgroundColor: '#05070F',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrim: {
    ...absoluteFill,
    backgroundColor: 'rgba(8, 11, 22, 0.28)',
  },
  laser: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.accent,
  },
  tl: { top: 16, left: 16, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 8 },
  tr: { top: 16, right: 16, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 8 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 8 },
  br: {
    bottom: 16,
    right: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 8,
  },
  fake: {
    ...absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  paper: {
    width: '82%',
    backgroundColor: '#EFEAE0',
    borderRadius: 4,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    transform: [{ rotate: '-1.2deg' }],
  },
  paperTitle: {
    fontFamily: font.mono,
    fontSize: 14,
    letterSpacing: 2,
    color: '#171310',
    textAlign: 'center',
  },
  paperMeta: {
    color: '#6B6156',
    textAlign: 'center',
    fontSize: 9,
    marginTop: 2,
  },
  paperRule: {
    height: 1,
    backgroundColor: '#C9BFAF',
    marginVertical: spacing.sm,
  },
  paperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
  },
  paperLine: {
    fontFamily: font.mono,
    fontSize: 9.5,
    color: '#332C25',
  },
  paperTotal: {
    fontFamily: font.monoMedium,
    fontSize: 11,
    color: '#171310',
  },
  fakeHint: {
    fontSize: 11,
    backgroundColor: tint(colors.bg, 0.7),
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});

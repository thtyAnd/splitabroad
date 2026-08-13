import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

import { tint } from './ui';

/** One pass of the wave, front to back. */
const WAVE_MS = 2600;
const RINGS = 3;

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

/**
 * A spatial "confirmation" pulse: rings travel outward across a tilted plane,
 * blurring and lifting whatever is behind them, with a single specular sweep
 * over the top.
 *
 * The depth read comes from three things working together — the rings are
 * ellipses rather than circles (a circle seen on a plane you're looking across),
 * they drift up-screen as they grow (travelling away from you), and each one
 * actually refracts the content behind it instead of being painted over it.
 */
export function SuccessWave({ origin = 0.42 }: { origin?: number }) {
  const { width, height } = useWindowDimensions();
  const clock = useSharedValue(0);

  useEffect(() => {
    clock.value = withTiming(1, { duration: WAVE_MS, easing: Easing.out(Easing.cubic) });
  }, [clock]);

  // Big enough that the last ring leaves the screen entirely.
  const reach = Math.max(width, height) * 1.5;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Glow clock={clock} size={reach * 0.7} top={height * origin} />
      {Array.from({ length: RINGS }, (_, i) => (
        <Ring key={i} index={i} clock={clock} size={reach} top={height * origin} />
      ))}
      <Sheen clock={clock} width={width} height={height} />
    </View>
  );
}

/** Reads a phase-shifted slice of the shared clock, clamped to 0…1. */
function phase(t: number, start: number, span: number) {
  'worklet';
  const p = (t - start) / span;
  return p < 0 ? 0 : p > 1 ? 1 : p;
}

function Ring({
  index,
  clock,
  size,
  top,
}: {
  index: number;
  clock: { value: number };
  size: number;
  top: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = phase(clock.value, index * 0.13, 0.72);
    // Ease out so the ring decelerates as it travels away.
    const eased = 1 - (1 - p) * (1 - p);

    return {
      opacity: p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI) * 0.9,
      transform: [
        // Rising as it expands is what sells the plane receding from the viewer.
        { translateY: -eased * 90 },
        { scaleX: 0.12 + eased * 1.0 },
        // Squashed vertically: a circle lying on a plane, not facing you.
        { scaleY: (0.12 + eased * 1.0) * 0.52 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.ringWrap,
        { width: size, height: size, top: top - size / 2, left: -size / 2 },
        style,
      ]}>
      <AnimatedBlur intensity={22} tint="light" style={styles.ringBlur}>
        <View style={styles.ringRim} />
      </AnimatedBlur>
    </Animated.View>
  );
}

/** Soft light bloom at the point of impact. */
function Glow({ clock, size, top }: { clock: { value: number }; size: number; top: number }) {
  const style = useAnimatedStyle(() => {
    const p = phase(clock.value, 0, 0.5);
    return {
      opacity: (1 - p) * 0.5,
      transform: [{ scaleX: 0.3 + p * 1.1 }, { scaleY: (0.3 + p * 1.1) * 0.5 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.glow,
        { width: size, height: size, top: top - size / 2, left: -size / 2 },
        style,
      ]}
    />
  );
}

/** A single specular band sweeping the glass, as if the screen caught a light. */
function Sheen({
  clock,
  width,
  height,
}: {
  clock: { value: number };
  width: number;
  height: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = phase(clock.value, 0.08, 0.55);
    return {
      opacity: p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI) * 0.5,
      transform: [{ translateY: -height * 0.6 + p * height * 1.6 }, { rotate: '-14deg' }],
    };
  });

  return (
    <Animated.View style={[styles.sheenWrap, { width: width * 1.8, left: -width * 0.4 }, style]}>
      <LinearGradient
        colors={['transparent', tint(colors.text, 0.14), tint(colors.success, 0.1), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    position: 'absolute',
    // Centred on the origin: the wrapper is offset by half its size, and the
    // screen's own centre line is added by the parent's left/top.
    marginLeft: '50%',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  ringBlur: {
    flex: 1,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  ringRim: {
    flex: 1,
    borderRadius: 9999,
    borderWidth: 14,
    borderColor: tint(colors.success, 0.5),
    backgroundColor: 'transparent',
  },
  glow: {
    position: 'absolute',
    marginLeft: '50%',
    borderRadius: 9999,
    backgroundColor: tint(colors.success, 0.22),
  },
  sheenWrap: {
    position: 'absolute',
    height: 190,
  },
  sheen: {
    flex: 1,
  },
});

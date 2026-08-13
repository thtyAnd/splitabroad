import {
  DMMono_400Regular,
  DMMono_500Medium,
  useFonts as useDMMono,
} from '@expo-google-fonts/dm-mono';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts as useInter,
} from '@expo-google-fonts/inter';
import {
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts as useOutfit,
} from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TerminalProvider } from '@/payments/terminal';
import { BillProvider } from '@/state/bill';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();
SystemUI.setBackgroundColorAsync(colors.bg);

export default function RootLayout() {
  const [outfit] = useOutfit({ Outfit_600SemiBold, Outfit_700Bold });
  const [inter] = useInter({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [mono] = useDMMono({ DMMono_400Regular, DMMono_500Medium });

  const ready = outfit && inter && mono;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <BillProvider>
        <TerminalProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="index" options={{ animation: 'fade' }} />
            <Stack.Screen name="start" />
            <Stack.Screen name="entry" />
            <Stack.Screen name="collector" />
            <Stack.Screen name="people" />
            <Stack.Screen name="collect" />
            <Stack.Screen name="scan" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="tap" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="pay" />
            <Stack.Screen name="success" options={{ animation: 'fade' }} />
          </Stack>
        </TerminalProvider>
      </BillProvider>
    </SafeAreaProvider>
  );
}

import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTheme } from '../ui/theme/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors, dark } = useTheme();
  const [loaded, error] = useFonts({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });
  const ready = loaded || !!error;

  // Edge-to-edge: the system bar is transparent, so its button ink follows the app theme. `style` names the
  // button ink, like StatusBar. The declarative <NavigationBar> did not apply on device; the imperative call does.
  useEffect(() => {
    NavigationBar.setStyle(dark ? 'light' : 'dark');
  }, [dark]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="memorize" />
        <Stack.Screen name="run" options={{ animation: 'none', gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </>
  );
}

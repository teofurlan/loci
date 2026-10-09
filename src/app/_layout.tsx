import { Jersey10_400Regular } from '@expo-google-fonts/jersey-10';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import '../ui/state/location-task';
import { COLORS } from '../ui/theme/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Jersey10_400Regular, PressStart2P_400Regular });
  const ready = loaded || !!error;

  // Edge-to-edge: the system bars are transparent, so they show the app ground. `style` names the button ink,
  // like StatusBar. The overworld is one fixed palette: the system light or dark setting is ignored.
  useEffect(() => {
    NavigationBar.setStyle('dark');
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.ground } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="memorize" />
        <Stack.Screen name="run" options={{ animation: 'none', gestureEnabled: false, contentStyle: { backgroundColor: COLORS.runField } }} />
        <Stack.Screen name="results" options={{ animation: 'none', gestureEnabled: false }} />
      </Stack>
    </>
  );
}

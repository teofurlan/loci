import { Jersey10_400Regular } from '@expo-google-fonts/jersey-10';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import '../ui/state/location-task';
import { LoadingScreen } from '../ui/components/LoadingScreen';
import { COLORS } from '../ui/theme/theme';

SplashScreen.preventAutoHideAsync();

const HOLD_MS = 700;

export default function RootLayout() {
  const [loaded, error] = useFonts({ Jersey10_400Regular, PressStart2P_400Regular });
  const fontsReady = loaded || !!error;
  // The native splash hands over to the themed loading screen at once, which stays up long enough to register.
  const [heldLongEnough, setHeldLongEnough] = useState(false);
  const ready = fontsReady && heldLongEnough;

  // Edge-to-edge: the system bars are transparent, so they show the app ground. `style` names the button ink,
  // like StatusBar. The overworld is one fixed palette: the system light or dark setting is ignored.
  useEffect(() => {
    NavigationBar.setStyle('dark');
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
    const timer = setTimeout(() => setHeldLongEnough(true), HOLD_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <LoadingScreen />;

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

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

export default function RootLayout() {
  const [loaded, error] = useFonts({ Jersey10_400Regular, PressStart2P_400Regular });
  const fontsReady = loaded || !!error;
  // The native splash shows the first frame of the opening animation; the loading screen plays the rest and
  // stays until both the fonts and the animation are done.
  const [introDone, setIntroDone] = useState(false);
  const ready = fontsReady && introDone;

  // Edge-to-edge: the system bars are transparent, so they show the app ground. `style` names the button ink,
  // like StatusBar. The overworld is one fixed palette: the system light or dark setting is ignored.
  // The opening screen is dark (the run-field ground), so the buttons are light there.
  useEffect(() => {
    NavigationBar.setStyle(ready ? 'dark' : 'light');
  }, [ready]);

  if (!ready) return <LoadingScreen onShown={() => SplashScreen.hideAsync()} onDone={() => setIntroDone(true)} />;

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

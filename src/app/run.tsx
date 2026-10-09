import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Redirect, router } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Hint } from '../domain/session';
import type { LandmarkKind, LatLng } from '../domain/types';
import { AppText } from '../ui/components/AppText';
import { DialogueBox } from '../ui/components/DialogueBox';
import { PixelBox } from '../ui/components/PixelBox';
import { PixelButton } from '../ui/components/PixelButton';
import { PixelSprite } from '../ui/components/PixelSprite';
import { formatElapsed, HINT_COST, hintSentence } from '../ui/model/format';
import { trackingMode, trackingNotice, type TrackingMode } from '../ui/model/tracking-mode';
import { courseStore, useCourse } from '../ui/state/course';
import { handleLocations, subscribeRunEvents, tracker } from '../ui/state/location-task';
import { FOUND_FRAMES } from '../ui/model/sprites';
import { useReducedMotion } from '../ui/state/use-reduced-motion';
import { useTypewriter } from '../ui/state/use-typewriter';
import { COLORS } from '../ui/theme/theme';

const FLASH_MS = 1400;
const FRAME_MS = 200;
/** If the speech engine never reports a start, the hint types out anyway after this long. */
const TTS_START_FALLBACK_MS = 1500;

/** The punch: the landmark's sprite with a 2-frame "found" sparkle. Reduced motion holds one frame. */
function FoundFlash({ kind, reducedMotion, onDone }: { kind: LandmarkKind; reducedMotion: boolean; onDone: () => void }) {
  const [frame, setFrame] = useState(1);
  useEffect(() => {
    const done = setTimeout(onDone, FLASH_MS);
    const flip = reducedMotion ? null : setInterval(() => setFrame((value) => 1 - value), FRAME_MS);
    return () => {
      clearTimeout(done);
      if (flip) clearInterval(flip);
    };
  }, [reducedMotion, onDone]);
  return (
    <View pointerEvents="none" style={styles.flash}>
      <PixelBox fill={COLORS.found} border={COLORS.runText} behind={COLORS.runField} double>
        <View style={styles.flashPlate}>
          <PixelSprite name={kind} scale={6} />
          <View style={StyleSheet.absoluteFill}>
            <PixelSprite name={FOUND_FRAMES[frame]} scale={6} />
          </View>
        </View>
      </PixelBox>
    </View>
  );
}


export default function RunScreen() {
  const course = useCourse();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<LandmarkKind | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [hintArmed, setHintArmed] = useState(false);
  const [hintNote, setHintNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [mode, setMode] = useState<TrackingMode | null>(null);
  const lastPosition = useRef<LatLng | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const running = course.phase === 'run';

  // The run owns the system bar too: light button ink on the ink field. Leaving restores the ground default.
  useEffect(() => {
    NavigationBar.setStyle('light');
    return () => NavigationBar.setStyle('dark');
  }, []);

  useEffect(() => {
    if (course.phase === 'results') router.replace('/results');
  }, [course.phase]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  // The background task and the foreground watcher both feed `handleLocations`, which punches and vibrates.
  // While this screen is up it only mirrors the result: the last fix and the found flash.
  useEffect(
    () =>
      subscribeRunEvents(({ position, punched }) => {
        if (position) {
          lastPosition.current = position;
          setHasFix(true);
        }
        if (punched) {
          const state = courseStore.get();
          if (state.phase === 'run') {
            const last = state.session.run.visits[state.session.run.visits.length - 1];
            if (last) setFlash(state.session.landmarks[last.checkpointIndex].kind);
          }
        }
      }),
    [],
  );

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      const [foreground, background] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
      ]);
      if (cancelled) return;
      let next = trackingMode({ foreground: foreground.granted, background: background.granted });
      if (next === 'background') {
        try {
          await tracker.start();
        } catch {
          next = 'foreground';
        }
      }
      setMode(next);
      if (next === 'background' || next === 'off') return;
      // Foreground-only fallback: the screen has to stay on, so keep it awake.
      activateKeepAwakeAsync('run').catch(() => {});
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 3 },
        (location) => handleLocations([location]),
      );
      if (cancelled) subscription.remove();
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
      deactivateKeepAwake('run').catch(() => {});
      void tracker.stop();
      Speech.stop();
    };
  }, [running]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirming((value) => !value);
      return true;
    });
    return () => sub.remove();
  }, []);

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  const endFlash = useCallback(() => setFlash(null), []);

  // The hint box types its text on the TTS start event, like the memorize dialogue.
  const hintText = hint ? `${hint.fragment}\n${hintSentence(hint)}` : '';
  const typing = useTypewriter(hintText, hintArmed, reducedMotion);

  const askForHint = async () => {
    setHintNote(null);
    let position = lastPosition.current;
    if (!position) {
      const fix = await Location.getLastKnownPositionAsync();
      position = fix ? { lat: fix.coords.latitude, lng: fix.coords.longitude } : null;
    }
    if (!position) {
      setHintNote('Still waiting for a GPS fix. Try again in a moment.');
      return;
    }
    const given = courseStore.hint(position);
    if (!given) return;
    setHint(given);
    setHintArmed(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintArmed(true), TTS_START_FALLBACK_MS);
    Speech.stop();
    Speech.speak(given.fragment, {
      onStart: () => {
        if (hintTimer.current) clearTimeout(hintTimer.current);
        setHintArmed(true);
      },
      onDone: () => Speech.speak(hintSentence(given)),
    });
  };

  if (course.phase === 'empty') return <Redirect href="/" />;
  if (course.phase !== 'run') return <View style={styles.root} />;

  const total = course.session.run.checkpoints.length;
  const punched = course.session.run.visits.length;
  const status = mode ? trackingNotice(mode, hasFix) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="light" />
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${punched} of ${total} punched`}>
        <AppText variant="display" color={COLORS.runText} maxFontSizeMultiplier={1.3}>
          {punched}/{total} PLACES
        </AppText>
      </View>
      <AppText variant="headline" color={COLORS.runText} maxFontSizeMultiplier={1.3} style={styles.time}>
        {formatElapsed(now - course.startedAt)}
      </AppText>
      {/* Reserved height: the hint button must not jump when the first GPS fix clears the status. */}
      <View style={styles.status}>
        {status && (
          <AppText variant="body" color={COLORS.runText}>
            {status}
          </AppText>
        )}
      </View>

      <ScrollView style={styles.hintScroll} contentContainerStyle={styles.hintBlock}>
        <View style={styles.hintButton}>
          <PixelButton
            variant="onInk"
            label="Hint"
            onPress={askForHint}
            accessibilityHint="Reads the nearest missing control's story, then its direction. Costs half a point."
          />
        </View>
        <AppText variant="body" color={COLORS.runText} style={styles.cost}>
          {HINT_COST}
        </AppText>
        {hintNote && (
          <AppText variant="body" color={COLORS.runText} style={styles.hintText}>
            {hintNote}
          </AppText>
        )}
        {hint && (
          <View style={styles.hintText} accessibilityLiveRegion="polite" accessibilityLabel={hintText}>
            <DialogueBox title="Hint" tone="dark">
              <View>
                <AppText variant="body" color={COLORS.runText} style={styles.ghost}>
                  {hintText}
                </AppText>
                <AppText variant="body" color={COLORS.runText} style={styles.typed}>
                  {typing.shown}
                </AppText>
              </View>
            </DialogueBox>
          </View>
        )}
      </ScrollView>

      <View style={styles.giveUp}>
        {confirming ? (
          <DialogueBox tone="dark">
            <AppText variant="title" color={COLORS.runText}>
              End the run and reveal the map?
            </AppText>
            <View style={styles.confirmRow}>
              <View style={styles.confirmButton}>
                <PixelButton variant="onInk" label="Keep walking" onPress={() => setConfirming(false)} />
              </View>
              <View style={styles.confirmButton}>
                <PixelButton variant="onInk" label="End run" onPress={() => courseStore.giveUp(Date.now())} />
              </View>
            </View>
          </DialogueBox>
        ) : (
          <View style={styles.giveUpButton}>
            <PixelButton variant="onInk" label="Give up" onPress={() => setConfirming(true)} />
          </View>
        )}
      </View>

      {flash && <FoundFlash kind={flash} reducedMotion={reducedMotion} onDone={endFlash} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, backgroundColor: COLORS.runField },
  time: { marginTop: 14 },
  status: { marginTop: 12, minHeight: 48 },
  hintScroll: { flex: 1, marginTop: 16 },
  hintBlock: { alignItems: 'flex-start', paddingBottom: 16 },
  hintButton: { alignSelf: 'flex-start' },
  cost: { marginTop: 10 },
  hintText: { marginTop: 16, gap: 10, alignSelf: 'stretch' },
  ghost: { opacity: 0 },
  typed: { position: 'absolute', left: 0, right: 0, top: 0 },
  giveUp: { marginTop: 12, alignItems: 'stretch', gap: 12 },
  giveUpButton: { alignSelf: 'flex-start' },
  confirmRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  confirmButton: { flexShrink: 1 },
  flash: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  flashPlate: { width: 96, height: 96 },
});

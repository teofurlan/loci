import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Hint } from '../domain/session';
import type { LandmarkKind, LatLng } from '../domain/types';
import { AppText } from '../ui/components/AppText';
import { DialogueBox } from '../ui/components/DialogueBox';
import { LociMessage } from '../ui/components/LociMessage';
import { LociStage } from '../ui/components/LociStage';
import { PixelBox } from '../ui/components/PixelBox';
import { PixelButton } from '../ui/components/PixelButton';
import { PixelSprite } from '../ui/components/PixelSprite';
import { formatElapsed, HINT_COST, hintSentence } from '../ui/model/format';
import { runStageSize } from '../ui/model/run-layout';
import { CELEBRATE_MS, runLociState, type HintPhase } from '../ui/model/run-loci';
import { trackingMode, trackingNotice, type TrackingMode } from '../ui/model/tracking-mode';
import { courseStore, useCourse } from '../ui/state/course';
import { handleLocations, subscribeRunEvents, tracker } from '../ui/state/location-task';
import { FOUND_FRAMES, FOUND_FRAME_MS } from '../ui/model/sprites';
import { useReducedMotion } from '../ui/state/use-reduced-motion';
import { useTypewriter } from '../ui/state/use-typewriter';
import { COLORS } from '../ui/theme/theme';

const FLASH_MS = 1400;
const FRAME_MS = FOUND_FRAME_MS;
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
    <View pointerEvents="none" style={styles.flash} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <PixelBox fill={COLORS.plate} border={COLORS.found} behind={COLORS.ground} corners="round">
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
  const window = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const [flash, setFlash] = useState<LandmarkKind | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [hintArmed, setHintArmed] = useState(false);
  const [hintPhase, setHintPhase] = useState<HintPhase>('none');
  const [lastPunchAt, setLastPunchAt] = useState<number | null>(null);
  const [hintNote, setHintNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [mode, setMode] = useState<TrackingMode | null>(null);
  const lastPosition = useRef<LatLng | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Which hint request is current, so a stopped older utterance cannot end a newer hint. */
  const hintId = useRef(0);
  /** Speech reported a start for the current hint: its end then ends the hint, not the typing. */
  const spoke = useRef(false);

  const running = course.phase === 'run';

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
            const at = Date.now();
            setNow(at);
            setLastPunchAt(at);
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

  // Loci dances for a few seconds after a find: wake the screen when that time is over.
  useEffect(() => {
    if (lastPunchAt === null) return;
    const timer = setTimeout(() => setNow(Date.now()), CELEBRATE_MS + 50);
    return () => clearTimeout(timer);
  }, [lastPunchAt]);

  const endFlash = useCallback(() => setFlash(null), []);

  // The clue types its text on the TTS start event, like the memorize dialogue.
  const hintText = hint ? `${hint.fragment}\n${hintSentence(hint)}` : '';
  const typing = useTypewriter(hintText, hintArmed, reducedMotion);

  // Without speech the clue is over when it has typed out.
  useEffect(() => {
    if (hintPhase === 'saying' && typing.done && !spoke.current) setHintPhase('said');
  }, [hintPhase, typing.done]);

  const askForHint = async () => {
    setHintNote(null);
    setHintPhase('requesting');
    let position = lastPosition.current;
    if (!position) {
      const fix = await Location.getLastKnownPositionAsync();
      position = fix ? { lat: fix.coords.latitude, lng: fix.coords.longitude } : null;
    }
    if (!position) {
      setHintNote('Still waiting for a GPS fix. Try again in a moment.');
      setHintPhase('none');
      return;
    }
    const given = courseStore.hint(position);
    if (!given) {
      setHintPhase('none');
      return;
    }
    const id = ++hintId.current;
    const finish = () => {
      if (hintId.current === id) setHintPhase('said');
    };
    spoke.current = false;
    setHint(given);
    setHintPhase('saying');
    setHintArmed(false);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintArmed(true), TTS_START_FALLBACK_MS);
    Speech.stop();
    Speech.speak(given.fragment, {
      onStart: () => {
        if (hintId.current !== id) return;
        spoke.current = true;
        if (hintTimer.current) clearTimeout(hintTimer.current);
        setHintArmed(true);
      },
      onError: finish,
      onStopped: finish,
      onDone: () => {
        if (hintId.current !== id) return;
        Speech.speak(hintSentence(given), { onDone: finish, onError: finish, onStopped: finish });
      },
    });
  };

  if (course.phase === 'empty') return <Redirect href="/" />;
  if (course.phase !== 'run') return <View style={styles.root} />;

  const total = course.session.run.checkpoints.length;
  const punched = course.session.run.visits.length;
  const status = mode ? trackingNotice(mode, hasFix) : null;
  const lociState = runLociState({ hint: hintPhase, confirming, lastPunchAt, now });
  const stage = runStageSize({ width: window.width, height: window.height, insetTop: insets.top, insetBottom: insets.bottom });
  const [fragmentShown, ...directionShown] = typing.shown.split('\n');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${punched} of ${total} punched`}>
          <AppText variant="display" maxFontSizeMultiplier={1.3} style={styles.centred}>
            {punched}/{total} PLACES
          </AppText>
        </View>
        <AppText variant="label" color={COLORS.muted} maxFontSizeMultiplier={1.3} style={styles.centred}>
          {formatElapsed(now - course.startedAt)}
        </AppText>
      </View>

      {/* Loci is decorative: the texts around it say everything. */}
      <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <LociStage state={lociState} size={stage} />
      </View>

      {/* Reserved height: nothing below may jump when the first GPS fix clears the notice. */}
      <View style={styles.notice}>
        {status && (
          <AppText variant="bodySmall" color={COLORS.muted} maxFontSizeMultiplier={1.3} style={styles.centred}>
            {status}
          </AppText>
        )}
      </View>

      <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageBlock}>
        {flash ? (
          <FoundFlash kind={flash} reducedMotion={reducedMotion} onDone={endFlash} />
        ) : hintNote ? (
          <LociMessage problem={hintNote} />
        ) : hint ? (
          <View style={styles.clue} accessibilityLiveRegion="polite" accessibilityLabel={hintText}>
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <AppText variant="body" maxFontSizeMultiplier={1.3} style={[styles.centred, styles.ghost]}>
                {hint.fragment}
              </AppText>
              <AppText variant="body" maxFontSizeMultiplier={1.3} style={[styles.centred, styles.ghost]}>
                {hintSentence(hint)}
              </AppText>
            </View>
            <View style={styles.typed} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <AppText variant="body" maxFontSizeMultiplier={1.3} style={styles.centred}>
                {fragmentShown}
              </AppText>
              <AppText variant="body" color={COLORS.aura} maxFontSizeMultiplier={1.3} style={styles.centred}>
                {directionShown.join('\n')}
              </AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottom}>
        {confirming ? (
          <DialogueBox>
            <AppText variant="title">
              End the run and reveal the map?
            </AppText>
            <View style={styles.confirmRow}>
              <View style={styles.confirmButton}>
                <PixelButton variant="secondary" label="Keep walking" onPress={() => setConfirming(false)} />
              </View>
              <View style={styles.confirmButton}>
                <PixelButton variant="secondary" label="End run" onPress={() => courseStore.giveUp(Date.now())} />
              </View>
            </View>
          </DialogueBox>
        ) : (
          <>
            <PixelButton
              variant="secondary"
              label="Hint"
              onPress={askForHint}
              accessibilityHint="Reads the nearest missing control's story, then its direction. Costs half a point."
            />
            <AppText variant="body" color={COLORS.muted} style={styles.centred}>
              {HINT_COST}
            </AppText>
            <PixelButton variant="quiet" label="Give up" onPress={() => setConfirming(true)} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, backgroundColor: COLORS.ground },
  header: { alignItems: 'center', gap: 6 },
  centred: { textAlign: 'center' },
  stage: { alignItems: 'center', marginTop: 8 },
  notice: { minHeight: 32, justifyContent: 'center' },
  messageScroll: { flex: 1 },
  messageBlock: { flexGrow: 1, alignItems: 'center' },
  clue: { alignSelf: 'stretch' },
  ghost: { opacity: 0 },
  typed: { position: 'absolute', left: 0, right: 0, top: 0 },
  bottom: { marginTop: 12, alignItems: 'stretch', gap: 8 },
  confirmRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  confirmButton: { flexShrink: 1 },
  flash: { alignItems: 'center', justifyContent: 'center' },
  flashPlate: { width: 96, height: 96 },
});

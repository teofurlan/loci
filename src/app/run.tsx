import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Hint } from '../domain/session';
import type { LatLng } from '../domain/types';
import { AppText } from '../ui/components/AppText';
import { RuleButton } from '../ui/components/RuleButton';
import { formatElapsed, HINT_COST, hintSentence } from '../ui/model/format';
import { courseStore, useCourse } from '../ui/state/course';
import { POCKET } from '../ui/theme/theme';

const INVERT_MS = 650;

export default function RunScreen() {
  useKeepAwake();
  const course = useCourse();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => Date.now());
  const [inverted, setInverted] = useState(false);
  const [hint, setHint] = useState<Hint | null>(null);
  const [hintNote, setHintNote] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [hasFix, setHasFix] = useState(false);
  const [gpsOff, setGpsOff] = useState(false);
  const lastPosition = useRef<LatLng | null>(null);

  // Two values only: black and white, swapped for one beat on every punch.
  const bg = inverted ? POCKET.white : POCKET.black;
  const fg = inverted ? POCKET.black : POCKET.white;

  const running = course.phase === 'run';

  useEffect(() => {
    if (course.phase === 'results') router.replace('/results');
  }, [course.phase]);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const onPunch = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInverted(true);
    setTimeout(() => setInverted(false), INVERT_MS);
  }, []);

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        setGpsOff(true);
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 3 },
        (location) => {
          const position = { lat: location.coords.latitude, lng: location.coords.longitude };
          lastPosition.current = position;
          setHasFix(true);
          const hit = courseStore.recordFix({
            position,
            accuracyMeters: location.coords.accuracy ?? Number.POSITIVE_INFINITY,
            timestamp: location.timestamp,
          });
          if (hit.length > 0) onPunch();
        },
      );
      if (cancelled) subscription.remove();
    })();
    return () => {
      cancelled = true;
      subscription?.remove();
      Speech.stop();
    };
  }, [running, onPunch]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirming((value) => !value);
      return true;
    });
    return () => sub.remove();
  }, []);

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
    Speech.stop();
    Speech.speak(given.fragment, { onDone: () => Speech.speak(hintSentence(given)) });
  };

  if (course.phase === 'empty') return <Redirect href="/" />;
  if (course.phase !== 'run') return <View style={[styles.root, { backgroundColor: POCKET.black }]} />;

  const total = course.session.run.checkpoints.length;
  const punched = course.session.run.visits.length;
  const status = gpsOff
    ? 'Location is off. Allow it in system settings to punch controls.'
    : hasFix
      ? null
      : 'Searching for GPS';

  return (
    <View style={[styles.root, { backgroundColor: bg, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <StatusBar style={inverted ? 'dark' : 'light'} />
      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${punched} of ${total} punched`}>
        <AppText variant="display" color={fg} tabular style={styles.count}>
          {punched} of {total} punched
        </AppText>
      </View>
      <AppText variant="headline" color={fg} tabular style={styles.time}>
        {formatElapsed(now - course.startedAt)}
      </AppText>
      {/* Reserved height: the hint button must not jump when the first GPS fix clears the status. */}
      <View style={styles.status}>
        {status && (
          <AppText variant="body" color={fg}>
            {status}
          </AppText>
        )}
      </View>

      <View style={styles.hintBlock}>
        <RuleButton
          label="Hint"
          color={fg}
          onPress={askForHint}
          accessibilityHint="Reads the nearest missing control's story, then its direction. Costs half a point."
        />
        <AppText variant="body" color={fg} style={styles.cost}>
          {HINT_COST}
        </AppText>
        {hintNote && (
          <AppText variant="body" color={fg} style={styles.hintText}>
            {hintNote}
          </AppText>
        )}
        {hint && (
          <View style={styles.hintText} accessibilityLiveRegion="polite">
            <AppText variant="body" color={fg}>
              {hint.fragment}
            </AppText>
            <AppText variant="title" color={fg} style={styles.direction}>
              {hintSentence(hint)}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.spacer} />

      <View style={styles.giveUp}>
        {confirming ? (
          <>
            <AppText variant="title" color={fg}>
              End the run and reveal the map?
            </AppText>
            <View style={styles.confirmRow}>
              <RuleButton label="Keep walking" color={fg} onPress={() => setConfirming(false)} />
              <RuleButton label="End run" color={fg} onPress={() => courseStore.giveUp(Date.now())} />
            </View>
          </>
        ) : (
          <RuleButton label="Give up" color={fg} onPress={() => setConfirming(true)} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  count: { fontSize: 64, lineHeight: 68 },
  time: { marginTop: 12 },
  status: { marginTop: 12, minHeight: 48 },
  hintBlock: { marginTop: 40, alignItems: 'flex-start' },
  cost: { marginTop: 8 },
  hintText: { marginTop: 16, gap: 10 },
  direction: { marginTop: 4 },
  spacer: { flex: 1, minHeight: 96 },
  giveUp: { alignItems: 'flex-start', gap: 12 },
  confirmRow: { flexDirection: 'row', gap: 48 },
});

import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PermissionsAndroid, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/components/AppText';
import { ControlRow } from '../ui/components/ControlRow';
import { CourseMap } from '../ui/components/CourseMap';
import { FlagButton } from '../ui/components/FlagButton';
import { RuleButton } from '../ui/components/RuleButton';
import { mapHeight } from '../ui/model/layout';
import { walkingMinutes } from '../ui/model/walking-minutes';
import { courseStore, useCourse } from '../ui/state/course';
import { declineBackground, hasDeclinedBackground } from '../ui/state/location-task';
import { useReducedMotion } from '../ui/state/use-reduced-motion';
import { SHAPE, useTheme } from '../ui/theme/theme';

const COLLAPSE_MS = 360;
const FADE_MS = 240;
const CUT_MS = 120;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Drives `onFrame` from 0 to 1 with exponential ease-out. */
function runFrames(duration: number, onFrame: (progress: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / duration);
      onFrame(easeOutExpo(t));
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

const animate = (value: Animated.Value, toValue: number, duration: number) =>
  new Promise<void>((resolve) => Animated.timing(value, { toValue, duration, useNativeDriver: true }).start(() => resolve()));

export default function MemorizeScreen() {
  const course = useCourse();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [collapse, setCollapse] = useState(0);
  const [hiding, setHiding] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [asking, setAsking] = useState(false);
  const [mapOpacity] = useState(() => new Animated.Value(1));
  const [blackout] = useState(() => new Animated.Value(0));
  const speechRun = useRef(0);

  const stopSpeech = useCallback(() => {
    speechRun.current += 1;
    Speech.stop();
    setSpeaking(false);
  }, []);

  useEffect(() => () => void Speech.stop(), []);

  const minutes = useMemo(
    () =>
      course.phase === 'empty'
        ? null
        : walkingMinutes(
            course.start,
            course.plan.checkpoints.map((c) => c.position),
            course.plan.intent.mode,
          ),
    [course],
  );

  if (course.phase === 'empty' || !minutes) return <Redirect href="/" />;
  const { plan, start } = course;

  const readAloud = () => {
    if (speaking) {
      stopSpeech();
      return;
    }
    const run = ++speechRun.current;
    const lines = [plan.story.title, ...plan.story.fragments.map((f, i) => `Control ${i + 1}. ${f.text}`)];
    setSpeaking(true);
    const next = (index: number) => {
      if (speechRun.current !== run) return;
      if (index >= lines.length) {
        setSpeaking(false);
        return;
      }
      Speech.speak(lines[index], {
        onDone: () => next(index + 1),
        onError: () => {
          if (speechRun.current === run) setSpeaking(false);
        },
      });
    };
    next(0);
  };

  // Background tracking lets the screen turn off. Explain why before the system asks, and never block the run
  // on a "no": the fallback is foreground-only tracking with the screen on.
  const startRun = async () => {
    if (hiding) return;
    if (!hasDeclinedBackground()) {
      const [foreground, background] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Location.getBackgroundPermissionsAsync(),
      ]);
      if (foreground.granted && !background.granted && background.canAskAgain) {
        setAsking(true);
        return;
      }
    }
    await hideAndStart();
  };

  const allowBackground = async () => {
    setAsking(false);
    try {
      // The run's notification only shows on Android 13+ once this is granted; a "no" never blocks the run.
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      await Location.requestBackgroundPermissionsAsync();
    } catch {
      // A failed request is the same as a "no": the run falls back to foreground tracking.
    }
    await hideAndStart();
  };

  const keepScreenOn = async () => {
    declineBackground();
    setAsking(false);
    await hideAndStart();
  };

  const hideAndStart = async () => {
    if (hiding) return;
    setHiding(true);
    stopSpeech();
    if (reducedMotion) {
      blackout.setValue(1);
    } else {
      await runFrames(COLLAPSE_MS, setCollapse);
      await animate(mapOpacity, 0, FADE_MS);
      await animate(blackout, 1, CUT_MS);
    }
    courseStore.beginRun(Date.now());
    router.replace('/run');
  };

  const mapPx = mapHeight(height, fontScale);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Animated.View style={{ height: mapPx, opacity: mapOpacity }}>
        <CourseMap
          style={styles.fill}
          start={start}
          controls={plan.checkpoints}
          collapse={collapse}
          padding={{ top: insets.top + 56, right: 44, bottom: 72, left: 44 }}
        />
      </Animated.View>

      <View style={[styles.sheetHeader, { borderColor: colors.outline }]}>
        <View style={styles.sheetTitle}>
          <AppText variant="title" numberOfLines={2} accessibilityRole="header">
            {plan.story.title}
          </AppText>
          <AppText variant="label" color={colors.onSurfaceVariant} tabular>
            {plan.checkpoints.length} controls, about {minutes.totalMinutes} min
          </AppText>
        </View>
        <RuleButton
          label={speaking ? 'Stop' : 'Read aloud'}
          onPress={readAloud}
          accessibilityHint="Reads the title and every story fragment out loud"
        />
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent}>
        {plan.checkpoints.map((landmark, index) => (
          <ControlRow
            key={landmark.id}
            number={index + 1}
            kind={landmark.kind}
            name={landmark.name}
            minutes={minutes.perControl[index]}
            fragment={course.session.fragments[index]}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderColor: colors.outline, paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        {asking ? (
          <View style={styles.ask}>
            <AppText variant="title" accessibilityRole="header">
              Track with the screen off?
            </AppText>
            <AppText variant="body">
              Loci can keep tracking your location while the screen is off, so controls are punched with the phone
              in your pocket. A notification stays visible during the run. Android will ask you to choose &ldquo;Allow all
              the time&rdquo;. Loci only uses it during a run.
            </AppText>
            <FlagButton
              label="Allow background location"
              onPress={allowBackground}
              accessibilityHint="Opens the system location setting"
            />
            <RuleButton
              label="Keep screen on instead"
              onPress={keepScreenOn}
              accessibilityHint="Tracks only while the screen stays on"
            />
          </View>
        ) : (
          <FlagButton
            label="Hide map & start"
            onPress={startRun}
            loading={hiding}
            accessibilityHint="Hides the map and starts the run"
          />
        )}
      </View>

      <Animated.View pointerEvents={hiding ? 'auto' : 'none'} style={[styles.blackout, { opacity: blackout }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: SHAPE.rule,
    borderBottomWidth: SHAPE.rule,
  },
  sheetTitle: { flex: 1 },
  sheet: { flex: 1 },
  sheetContent: { paddingBottom: 8 },
  ask: { gap: 12, alignItems: 'stretch' },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: SHAPE.rule },
  blackout: { ...StyleSheet.absoluteFill, backgroundColor: '#000000' },
});

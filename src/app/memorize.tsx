import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PermissionsAndroid, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../ui/components/AppText';
import { CourseMap } from '../ui/components/CourseMap';
import { DialogueBox } from '../ui/components/DialogueBox';
import { PixelButton } from '../ui/components/PixelButton';
import { PixelSprite } from '../ui/components/PixelSprite';
import { StampStrip } from '../ui/components/StampStrip';
import { mapHeight } from '../ui/model/layout';
import { fadeSequence } from '../ui/model/palette-fade';
import { advanceIndex } from '../ui/model/typewriter';
import { walkingMinutes } from '../ui/model/walking-minutes';
import { courseStore, useCourse } from '../ui/state/course';
import { declineBackground, hasDeclinedBackground } from '../ui/state/location-task';
import { useReducedMotion } from '../ui/state/use-reduced-motion';
import { useBlink, useTypewriter } from '../ui/state/use-typewriter';
import { COLORS, SHAPE } from '../ui/theme/theme';

/** If the speech engine never reports a start, typing begins anyway after this long. */
const TTS_START_FALLBACK_MS = 1500;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function MemorizeScreen() {
  const course = useCourse();
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState(0);
  const [hiding, setHiding] = useState(false);
  const [fade, setFade] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [armedIndex, setArmedIndex] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const speechRun = useRef(0);
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopSpeech = useCallback(() => {
    speechRun.current += 1;
    if (startTimer.current) clearTimeout(startTimer.current);
    Speech.stop();
    setSpeaking(false);
  }, []);

  useEffect(
    () => () => {
      if (startTimer.current) clearTimeout(startTimer.current);
      void Speech.stop();
    },
    [],
  );

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

  const fragment = course.phase === 'empty' ? '' : (course.session.fragments[selected] ?? '');
  // With Read aloud on, the typing waits for that fragment's TTS start event. Off, it starts at once.
  const armed = !speaking || armedIndex === selected;
  const typing = useTypewriter(fragment, armed, reducedMotion);
  const blink = useBlink(reducedMotion);

  if (course.phase === 'empty' || !minutes) return <Redirect href="/" />;
  const { plan, start } = course;
  const total = plan.checkpoints.length;
  const current = plan.checkpoints[Math.min(selected, total - 1)];

  const jump = (index: number) => {
    if (speaking) stopSpeech();
    setSelected(index);
  };

  const readAloud = () => {
    if (speaking) {
      stopSpeech();
      return;
    }
    const run = ++speechRun.current;
    setArmedIndex(null);
    setSelected(0);
    setSpeaking(true);
    const speakFragment = (index: number) => {
      if (speechRun.current !== run) return;
      if (index >= plan.story.fragments.length) {
        setSpeaking(false);
        return;
      }
      setSelected(index);
      if (startTimer.current) clearTimeout(startTimer.current);
      startTimer.current = setTimeout(() => {
        if (speechRun.current === run) setArmedIndex(index);
      }, TTS_START_FALLBACK_MS);
      Speech.speak(`Control ${index + 1}. ${plan.story.fragments[index].text}`, {
        onStart: () => {
          if (speechRun.current !== run) return;
          if (startTimer.current) clearTimeout(startTimer.current);
          setArmedIndex(index);
        },
        onDone: () => speakFragment(index + 1),
        onError: () => {
          if (speechRun.current === run) setSpeaking(false);
        },
      });
    };
    Speech.speak(plan.story.title, {
      onDone: () => speakFragment(0),
      onError: () => {
        if (speechRun.current === run) setSpeaking(false);
      },
    });
  };

  const advance = () => {
    if (speaking) stopSpeech();
    setSelected((index) => advanceIndex(index, total));
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

  // The signature: the screen steps through the four greens to ink, then the run begins.
  const hideAndStart = async () => {
    if (hiding) return;
    setHiding(true);
    stopSpeech();
    for (const step of fadeSequence(reducedMotion, COLORS.ground, COLORS.runField)) {
      setFade(step.color);
      await sleep(step.ms);
    }
    courseStore.beginRun(Date.now());
    router.replace('/run');
  };

  const mapPx = mapHeight(height, fontScale);
  const metaLine = `${total} controls, about ${minutes.totalMinutes} min`;

  return (
    <View style={styles.root}>
      <View style={{ height: mapPx, paddingTop: insets.top }}>
        <CourseMap
          style={styles.fill}
          start={start}
          controls={plan.checkpoints}
          selected={selected}
          onSelect={jump}
          padding={{ top: 56, right: 44, bottom: 72, left: 44 }}
        />
      </View>

      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="title" numberOfLines={2} accessibilityRole="header" style={styles.storyTitle}>
            {plan.story.title}
          </AppText>
          <AppText variant="bodySmall" style={styles.meta}>
            {metaLine}
          </AppText>
        </View>
        <PixelButton
          label={speaking ? 'Stop' : 'Read aloud'}
          onPress={readAloud}
          accessibilityHint="Reads the title and every story fragment out loud"
        />
      </View>

      {asking ? (
        <ScrollView style={styles.fill} contentContainerStyle={styles.askContent}>
          <DialogueBox title="Track with the screen off?">
            <AppText variant="body">
              Loci can keep tracking your location while the screen is off, so controls are punched with the phone
              in your pocket. A notification stays visible during the run. Android will ask you to choose &ldquo;Allow all
              the time&rdquo;. Loci only uses it during a run.
            </AppText>
          </DialogueBox>
          <PixelButton
            variant="primary"
            label="Allow background location"
            onPress={allowBackground}
            accessibilityHint="Opens the system location setting"
          />
          <PixelButton
            label="Keep screen on instead"
            onPress={keepScreenOn}
            accessibilityHint="Tracks only while the screen stays on"
          />
        </ScrollView>
      ) : (
        <>
          <StampStrip controls={plan.checkpoints} selected={selected} onSelect={jump} />
          <View style={styles.dialogue}>
            <DialogueBox title={current.name} stretch>
              <ScrollView style={styles.fill} contentContainerStyle={styles.dialogueText}>
                <AppText variant="bodySmall">
                  Control {selected + 1} of {total} · {minutes.perControl[selected]} min
                </AppText>
                <Pressable
                  accessibilityLabel={`${current.name}. ${fragment}`}
                  accessibilityHint="Tap to show the whole fragment"
                  onPress={typing.skip}
                >
                  {/* The full text holds the box at its final height so typing never makes it jump. */}
                  <AppText variant="body" style={styles.ghost}>
                    {fragment}
                  </AppText>
                  <AppText variant="body" style={styles.typed}>
                    {typing.shown}
                  </AppText>
                </Pressable>
              </ScrollView>
              {/* Outside the scroll region, so the cursor never hides below the fold. */}
              <View style={styles.cursorRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next place"
                  accessibilityHint="Shows the next landmark and highlights it on the map"
                  onPress={advance}
                  style={styles.next}
                >
                  <View style={{ opacity: typing.done && blink ? 1 : 0 }}>
                    <PixelSprite name="glyph:pointer" scale={3} />
                  </View>
                </Pressable>
              </View>
            </DialogueBox>
          </View>
        </>
      )}

      {!asking && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <PixelButton
            variant="primary"
            label="Hide map & start"
            onPress={startRun}
            loading={hiding}
            accessibilityHint="Hides the map and starts the run"
          />
        </View>
      )}

      {fade && <View pointerEvents="auto" style={[styles.fade, { backgroundColor: fade }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ground },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderTopWidth: SHAPE.rule,
    borderTopColor: COLORS.ink,
  },
  headerText: { flex: 1 },
  storyTitle: { fontSize: 24, lineHeight: 26 },
  meta: { fontSize: 20, lineHeight: 22 },
  dialogue: { flex: 1, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 },
  dialogueText: { gap: 6, paddingBottom: 4 },
  cursorRow: { alignItems: 'flex-end', minHeight: 40 },
  ghost: { opacity: 0 },
  typed: { position: 'absolute', left: 0, right: 0, top: 0 },
  next: { width: SHAPE.target, height: SHAPE.target, alignItems: 'center', justifyContent: 'center' },
  askContent: { padding: 12, gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
  fade: { ...StyleSheet.absoluteFill },
});

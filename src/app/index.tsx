import * as Location from 'expo-location';
import { Redirect, router } from 'expo-router';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LatLng } from '../domain/types';
import { AppText } from '../ui/components/AppText';
import { DialogueBox } from '../ui/components/DialogueBox';
import { MicButton } from '../ui/components/MicButton';
import { PixelBox } from '../ui/components/PixelBox';
import { PixelButton } from '../ui/components/PixelButton';
import { PixelSprite } from '../ui/components/PixelSprite';
import { dictationReducer, INITIAL_DICTATION } from '../ui/model/dictation';
import { describePlanError, type PlanErrorDescription } from '../ui/model/errors';
import { resumeRoute } from '../ui/model/resume-route';
import { courseStore } from '../ui/state/course';
import { services } from '../ui/state/services';
import { useReducedMotion } from '../ui/state/use-reduced-motion';
import { useBlink } from '../ui/state/use-typewriter';
import { COLORS, SHAPE, TYPE } from '../ui/theme/theme';

const EXAMPLES = [
  '20 min walk, green areas',
  '30 min run, I remember places better than street names',
  'Easy walk past recognizable landmarks',
];

/** The device locale, so dictation follows the language the phone is set to. */
const deviceLocale = () => Intl.DateTimeFormat().resolvedOptions().locale;

const FIX_TIMEOUT_MS = 15_000;

type LocationProblem = { canAskAgain: boolean };

async function currentPosition(): Promise<LatLng> {
  const fix = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), FIX_TIMEOUT_MS)),
  ]);
  const position = fix ?? (await Location.getLastKnownPositionAsync());
  if (!position) throw new LocationUnavailableError();
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

class LocationUnavailableError extends Error {
  constructor() {
    super('No GPS fix');
    this.name = 'LocationUnavailableError';
  }
}

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState(false);
  const [cursorRow, setCursorRow] = useState<string | null>(null);
  const [denied, setDenied] = useState<LocationProblem | null>(null);
  const [failure, setFailure] = useState<PlanErrorDescription | null>(null);
  const [dictation, dispatch] = useReducer(dictationReducer, INITIAL_DICTATION);
  const mounted = useRef(true);
  // Read once on mount: planning fills the store and navigates on its own.
  const [resumeHref] = useState(() => resumeRoute(courseStore.get().phase));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  useSpeechRecognitionEvent('result', (event) =>
    dispatch({ type: 'result', transcript: event.results[0]?.transcript ?? '', isFinal: event.isFinal }),
  );
  useSpeechRecognitionEvent('end', () => dispatch({ type: 'end' }));
  useSpeechRecognitionEvent('error', (event) =>
    dispatch({ type: 'error', code: event.error, message: event.message }),
  );

  // Dictation owns the field text while it produces results; typing takes over between sessions.
  const [seenDictationText, setSeenDictationText] = useState<string | null>(null);
  if (dictation.text !== seenDictationText) {
    setSeenDictationText(dictation.text);
    if (dictation.text !== null) setRequest(dictation.text);
  }

  const toggleDictation = useCallback(async () => {
    if (dictation.phase === 'listening') {
      dispatch({ type: 'stop' });
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        dispatch({ type: 'denied', canAskAgain: permission.canAskAgain });
        return;
      }
      dispatch({ type: 'start', base: request });
      ExpoSpeechRecognitionModule.start({ lang: deviceLocale(), interimResults: true });
    } catch (error) {
      dispatch({ type: 'error', code: 'unknown', message: String(error) });
    }
  }, [dictation.phase, request]);

  const setCourse = useCallback(async () => {
    setFailure(null);
    setDenied(null);
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setDenied({ canAskAgain: permission.canAskAgain });
        return;
      }
      const start = await currentPosition();
      const plan = await services.plan({ start, text: request.trim() || undefined, language: 'en' });
      courseStore.setPlan(plan, start);
      router.push('/memorize');
    } catch (error) {
      if (error instanceof LocationUnavailableError) {
        setFailure({
          problem: 'Could not get a GPS fix.',
          recovery: 'Step outside or near a window, wait a few seconds, and set the course again.',
        });
      } else {
        setFailure(describePlanError(error));
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [request]);

  if (resumeHref) return <Redirect href={resumeHref} />;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <AppText variant="headline" accessibilityRole="header" maxFontSizeMultiplier={1.3}>
          Set your course
        </AppText>
        <AppText variant="body" style={styles.lead}>
          Tell Loci what kind of walk you want. It picks real, named places near you. You look once, then walk with
          the phone in your pocket.
        </AppText>

        <AppText variant="label" style={styles.fieldLabel} nativeID="request-label" maxFontSizeMultiplier={1.3}>
          Course request
        </AppText>
        <PixelBox fill={COLORS.lit} behind={COLORS.ground} double>
          <TextInput
            accessibilityLabelledBy="request-label"
            value={request}
            onChangeText={setRequest}
            editable={!busy && dictation.phase === 'idle'}
            multiline
            placeholder="e.g. 20 min walk, green areas, I remember places better than street names"
            placeholderTextColor={COLORS.ink}
            selectionColor={COLORS.ink}
            cursorColor={COLORS.ink}
            style={styles.input}
          />
        </PixelBox>

        <View style={styles.mic}>
          <MicButton
            listening={dictation.phase !== 'idle'}
            stopping={dictation.phase === 'stopping'}
            disabled={busy}
            onPress={toggleDictation}
          />
        </View>
        {dictation.problem && (
          <View style={styles.panel} accessibilityLiveRegion="polite">
            <DialogueBox title="Heads up">
              <AppText variant="title">{dictation.problem.problem}</AppText>
              <AppText variant="body">{dictation.problem.recovery}</AppText>
              {dictation.problem.kind === 'denied' && dictation.problem.canAskAgain === false && (
                <View style={styles.panelAction}>
                  <PixelButton label="Open settings" onPress={() => Linking.openSettings()} />
                </View>
              )}
            </DialogueBox>
          </View>
        )}

        <AppText variant="label" style={styles.examplesLabel} maxFontSizeMultiplier={1.3}>
          Or pick an example
        </AppText>
        <PixelBox fill={COLORS.lit} behind={COLORS.ground} double>
          <View accessibilityRole="menu">
            {EXAMPLES.map((example, index) => (
              <Pressable
                key={example}
                accessibilityRole="menuitem"
                accessibilityLabel={example}
                accessibilityState={{ disabled: busy }}
                disabled={busy}
                onPress={() => setRequest(example)}
                onPressIn={() => setCursorRow(example)}
                onPressOut={() => setCursorRow(null)}
                onFocus={() => setCursorRow(example)}
                onBlur={() => setCursorRow(null)}
                style={[styles.example, index > 0 && styles.exampleRule, { opacity: busy ? 0.5 : 1 }]}
              >
                <View style={styles.cursor}>
                  {cursorRow === example && <PixelSprite name="glyph:right" scale={3} />}
                </View>
                <AppText variant="body" style={styles.exampleText}>
                  {example}
                </AppText>
              </Pressable>
            ))}
          </View>
        </PixelBox>

        {denied && (
          <View style={styles.panel} accessibilityLiveRegion="polite">
            <DialogueBox title="Heads up">
              <AppText variant="title">Location is off for Loci.</AppText>
              <AppText variant="body">
                Loci needs your position to lay out a course around you. Allow location while using the app.
              </AppText>
              <View style={styles.panelAction}>
                {denied.canAskAgain ? (
                  <PixelButton label="Allow location" onPress={setCourse} />
                ) : (
                  <PixelButton label="Open settings" onPress={() => Linking.openSettings()} />
                )}
              </View>
            </DialogueBox>
          </View>
        )}

        {failure && (
          <View style={styles.panel} accessibilityLiveRegion="polite">
            <DialogueBox title="Heads up">
              <AppText variant="title">{failure.problem}</AppText>
              <AppText variant="body">{failure.recovery}</AppText>
            </DialogueBox>
          </View>
        )}

        {busy && (
          <View style={styles.busy} accessibilityLiveRegion="polite">
            <Walker still={reducedMotion} />
            <AppText variant="body" style={styles.busyText}>
              Finding places near you and writing the story. This can take a minute or two.
            </AppText>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <PixelButton variant="primary" label="Set course" onPress={setCourse} loading={busy} />
      </View>
    </View>
  );
}

/** The busy marker: the "you" sprite stepping up and down. Still under reduced motion. */
function Walker({ still }: { still: boolean }) {
  const blink = useBlink(still, 350);
  return (
    <View style={styles.walker} accessible={false}>
      <View style={{ transform: [{ translateY: blink ? 0 : -4 }] }}>
        <PixelSprite name="you" scale={3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.ground },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  lead: { marginTop: 12, maxWidth: 520 },
  fieldLabel: { marginTop: 28, marginBottom: 10 },
  input: {
    minHeight: 112,
    padding: 12,
    textAlignVertical: 'top',
    color: COLORS.ink,
    fontFamily: TYPE.body.fontFamily,
    fontSize: TYPE.body.fontSize,
    lineHeight: TYPE.body.lineHeight,
  },
  mic: { marginTop: 12 },
  examplesLabel: { marginTop: 24, marginBottom: 10 },
  example: { minHeight: SHAPE.target, paddingRight: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
  exampleRule: { borderTopWidth: SHAPE.rule, borderTopColor: COLORS.ink },
  exampleText: { flex: 1 },
  cursor: { width: 30, alignItems: 'center' },
  panel: { marginTop: 24 },
  panelAction: { marginTop: 8, alignItems: 'flex-start' },
  busy: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  busyText: { flex: 1 },
  walker: { width: 48, height: 56, alignItems: 'center', justifyContent: 'flex-end' },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});

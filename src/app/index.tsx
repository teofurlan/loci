import * as Location from 'expo-location';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LatLng } from '../domain/types';
import { AppText } from '../ui/components/AppText';
import { FlagButton } from '../ui/components/FlagButton';
import { RuleButton } from '../ui/components/RuleButton';
import { describePlanError, type PlanErrorDescription } from '../ui/model/errors';
import { resumeRoute } from '../ui/model/resume-route';
import { courseStore } from '../ui/state/course';
import { services } from '../ui/state/services';
import { SHAPE, TYPE, useTheme } from '../ui/theme/theme';

const EXAMPLES = [
  '20 min walk, green areas',
  '30 min run, I remember places better than street names',
  'Easy walk past recognizable landmarks',
];

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState('');
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState<LocationProblem | null>(null);
  const [failure, setFailure] = useState<PlanErrorDescription | null>(null);
  const mounted = useRef(true);
  // Read once on mount: planning fills the store and navigates on its own.
  const [resumeHref] = useState(() => resumeRoute(courseStore.get().phase));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <AppText variant="headline" accessibilityRole="header">
          Set your course
        </AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.lead}>
          Tell Loci what kind of walk you want. It picks real, named places near you. You look once, then walk with
          the phone in your pocket.
        </AppText>

        <AppText variant="label" style={styles.fieldLabel} nativeID="request-label">
          Course request
        </AppText>
        <TextInput
          accessibilityLabelledBy="request-label"
          value={request}
          onChangeText={setRequest}
          editable={!busy}
          multiline
          placeholder="e.g. 20 min walk, green areas, I remember places better than street names"
          placeholderTextColor={colors.onSurfaceVariant}
          selectionColor={colors.onBackground}
          cursorColor={colors.onBackground}
          style={[styles.input, { borderColor: colors.outline, color: colors.onBackground }]}
        />

        <AppText variant="label" color={colors.onSurfaceVariant} style={styles.examplesLabel}>
          Or tap an example
        </AppText>
        <View style={styles.examples}>
          {EXAMPLES.map((example) => (
            <Pressable
              key={example}
              accessibilityRole="button"
              accessibilityLabel={example}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => setRequest(example)}
              android_ripple={{ color: `${colors.onBackground}33` }}
              style={[styles.example, { borderColor: colors.outline, opacity: busy ? 0.45 : 1 }]}
            >
              <AppText variant="body">{example}</AppText>
            </Pressable>
          ))}
        </View>

        {denied && (
          <View style={[styles.panel, { borderColor: colors.error }]} accessibilityLiveRegion="polite">
            <AppText variant="title" color={colors.error}>
              Location is off for Loci.
            </AppText>
            <AppText variant="body">
              Loci needs your position to lay out a course around you. Allow location while using the app.
            </AppText>
            <View style={styles.panelAction}>
              {denied.canAskAgain ? (
                <RuleButton label="Allow location" onPress={setCourse} />
              ) : (
                <RuleButton label="Open settings" onPress={() => Linking.openSettings()} />
              )}
            </View>
          </View>
        )}

        {failure && (
          <View style={[styles.panel, { borderColor: colors.error }]} accessibilityLiveRegion="polite">
            <AppText variant="title" color={colors.error}>
              {failure.problem}
            </AppText>
            <AppText variant="body">{failure.recovery}</AppText>
          </View>
        )}

        {busy && (
          <View style={styles.busy} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.onBackground} />
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.busyText}>
              Finding places near you and writing the story. This can take a minute or two.
            </AppText>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
        <FlagButton label="Set course" onPress={setCourse} loading={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  lead: { marginTop: 8, maxWidth: 520 },
  fieldLabel: { marginTop: 28, marginBottom: 8 },
  input: {
    minHeight: 112,
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: TYPE.body.fontSize,
    lineHeight: TYPE.body.lineHeight,
  },
  examplesLabel: { marginTop: 20, marginBottom: 8 },
  examples: { gap: 8, alignSelf: 'stretch' },
  example: {
    minHeight: SHAPE.target,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: SHAPE.rule,
    borderRadius: SHAPE.radius,
  },
  panel: { marginTop: 24, borderWidth: SHAPE.rule, borderRadius: SHAPE.radius, padding: 14, gap: 6 },
  panelAction: { marginTop: 8, alignItems: 'flex-start' },
  busy: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  busyText: { flex: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
});

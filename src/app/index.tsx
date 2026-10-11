import * as Location from "expo-location";
import { Redirect, router, useIsFocused } from "expo-router";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { LatLng } from "../domain/types";
import { AppText } from "../ui/components/AppText";
import { ChatChip } from "../ui/components/ChatChip";
import { LociMessage } from "../ui/components/LociMessage";
import { LociStage } from "../ui/components/LociStage";
import { MicButton } from "../ui/components/MicButton";
import { PixelBox } from "../ui/components/PixelBox";
import { SendButton } from "../ui/components/SendButton";
import { chatView } from "../ui/model/chat-view";
import { dictationReducer, INITIAL_DICTATION } from "../ui/model/dictation";
import {
  describePlanError,
  type PlanErrorDescription,
} from "../ui/model/errors";
import { CAPTION_SLOT, stageSize } from "../ui/model/chat-layout";
import { resumeRoute } from "../ui/model/resume-route";
import { courseStore } from "../ui/state/course";
import { services } from "../ui/state/services";
import { CHAT, TYPE } from "../ui/theme/theme";

const EXAMPLES = [
  "20 min walk, green areas",
  "30 min run, I remember places better than street names",
  "Easy walk past recognizable landmarks",
  "30 min walk, story themed on space exploration",
];

/** The device locale, so dictation follows the language the phone is set to. */
const deviceLocale = () => Intl.DateTimeFormat().resolvedOptions().locale;

const FIX_TIMEOUT_MS = 15_000;

type LocationProblem = { canAskAgain: boolean };

async function currentPosition(): Promise<LatLng> {
  const fix = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), FIX_TIMEOUT_MS),
    ),
  ]);
  const position = fix ?? (await Location.getLastKnownPositionAsync());
  if (!position) throw new LocationUnavailableError();
  return { lat: position.coords.latitude, lng: position.coords.longitude };
}

class LocationUnavailableError extends Error {
  constructor() {
    super("No GPS fix");
    this.name = "LocationUnavailableError";
  }
}

export default function SetupScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const window = useWindowDimensions();
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

  // The home is a black scene, so the system bar buttons are light here. Another screen on top restores the default.
  useEffect(() => {
    if (isFocused) NavigationBar.setStyle("light");
    return () => NavigationBar.setStyle("dark");
  }, [isFocused]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useSpeechRecognitionEvent("result", (event) =>
    dispatch({
      type: "result",
      transcript: event.results[0]?.transcript ?? "",
      isFinal: event.isFinal,
    }),
  );
  useSpeechRecognitionEvent("end", () => dispatch({ type: "end" }));
  useSpeechRecognitionEvent("error", (event) =>
    dispatch({ type: "error", code: event.error, message: event.message }),
  );

  // Dictation owns the field text while it produces results; typing takes over between sessions.
  const [seenDictationText, setSeenDictationText] = useState<string | null>(
    null,
  );
  if (dictation.text !== seenDictationText) {
    setSeenDictationText(dictation.text);
    if (dictation.text !== null) setRequest(dictation.text);
  }

  const toggleDictation = useCallback(async () => {
    if (dictation.phase === "listening") {
      dispatch({ type: "stop" });
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    try {
      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        dispatch({ type: "denied", canAskAgain: permission.canAskAgain });
        return;
      }
      dispatch({ type: "start", base: request });
      ExpoSpeechRecognitionModule.start({
        lang: deviceLocale(),
        interimResults: true,
      });
    } catch (error) {
      dispatch({ type: "error", code: "unknown", message: String(error) });
    }
  }, [dictation.phase, request]);

  const setCourse = useCallback(async () => {
    Keyboard.dismiss();
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
      const plan = await services.plan({
        start,
        text: request.trim() || undefined,
        language: "en",
      });
      courseStore.setPlan(plan, start);
      router.push("/memorize");
    } catch (error) {
      if (error instanceof LocationUnavailableError) {
        setFailure({
          problem: "Could not get a GPS fix.",
          recovery:
            "Step outside or near a window, wait a few seconds, and ask again.",
        });
      } else {
        setFailure(describePlanError(error));
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [request]);


  if (resumeHref) return <Redirect href={resumeHref} />;

  const view = chatView({
    busy,
    hasError: !!(dictation.problem || denied || failure),
    dictation: dictation.phase,
    focused,
    hasText: request.trim().length > 0,
    keyboardOpen,
  });
  // Decided once from the window (inputs never change), so Loci keeps its size whatever the screen shows.
  const stage = stageSize({
    width: window.width,
    height: window.height,
    insetTop: insets.top,
    insetBottom: insets.bottom,
  });

  return (
    // KeyboardAvoidingView owns its own bottom padding (edge-to-edge does not resize the window), so the system bar
    // inset goes on the child. With the keyboard up the bar sits on the keys and needs no inset.
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.root, { paddingTop: insets.top }]}
    >
      {isFocused && <StatusBar style="light" />}
      <View
        style={[styles.fill, { paddingBottom: focused ? 0 : insets.bottom }]}
      >
        <View style={styles.stageArea}>
          <View style={styles.stage}>
            <LociStage
              state={view.lociState}
              size={stage}
              attentive={view.attentive}
            />
            <View style={[styles.slot, { marginTop: -Math.round(stage * 0.1) }]}>
              {view.caption && (
                <AppText
                  variant="label"
                  color={CHAT.text}
                  accessibilityLiveRegion="polite"
                  maxFontSizeMultiplier={1.3}
                  style={styles.caption}
                >
                  {view.caption}
                </AppText>
              )}
              {view.message && (
                <View style={styles.messages}>
                  {dictation.problem && (
                    <LociMessage
                      problem={dictation.problem.problem}
                      recovery={dictation.problem.recovery}
                    >
                      {dictation.problem.kind === "denied" &&
                        dictation.problem.canAskAgain === false && (
                          <ChatChip
                            label="Open settings"
                            onPress={() => Linking.openSettings()}
                          />
                        )}
                    </LociMessage>
                  )}
                  {denied && (
                    <LociMessage
                      problem="Location is off for Loci."
                      recovery="Loci needs your position to plan a route around you. Allow location while using the app."
                    >
                      {denied.canAskAgain ? (
                        <ChatChip label="Allow location" onPress={setCourse} />
                      ) : (
                        <ChatChip
                          label="Open settings"
                          onPress={() => Linking.openSettings()}
                        />
                      )}
                    </LociMessage>
                  )}
                  {failure && (
                    <LociMessage
                      problem={failure.problem}
                      recovery={failure.recovery}
                    />
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          {view.examples && (
            <View style={styles.chips} accessibilityRole="menu">
              {EXAMPLES.map((example) => (
                <ChatChip
                  key={example}
                  label={example}
                  onPress={() => setRequest(example)}
                />
              ))}
            </View>
          )}

          <PixelBox
            fill={CHAT.ground}
            border={CHAT.line}
            behind={CHAT.ground}
            corners="round"
          >
            <View style={styles.bar}>
              <TextInput
                accessibilityLabel="Ask Loci for a walk"
                value={request}
                onChangeText={setRequest}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                editable={view.inputEditable}
                multiline
                placeholder=" Ask Loci for a walk…"
                placeholderTextColor={CHAT.line}
                selectionColor={CHAT.text}
                cursorColor={CHAT.text}
                style={styles.input}
              />
              {view.mic && (
                <MicButton
                  listening={dictation.phase !== "idle"}
                  stopping={dictation.phase === "stopping"}
                  onPress={toggleDictation}
                />
              )}
              <SendButton
                onPress={setCourse}
                disabled={!view.sendEnabled}
                busy={view.sendBusy}
              />
            </View>
          </PixelBox>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CHAT.ground },
  fill: { flex: 1 },
  stageArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  stage: { alignItems: "center" },
  // A fixed slot: the caption or the message grows inside it, so Loci never moves when the text changes.
  slot: { minHeight: CAPTION_SLOT, alignSelf: "stretch", alignItems: "center" },
  caption: { textAlign: "center", paddingHorizontal: 20 },
  bottom: { paddingHorizontal: 16, paddingBottom: 12, gap: 10 },
  messages: { gap: 8, alignSelf: "stretch" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bar: { flexDirection: "row", alignItems: "flex-end", gap: 6, padding: 4 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 112,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlignVertical: "center",
    color: CHAT.text,
    fontFamily: TYPE.body.fontFamily,
    fontSize: TYPE.body.fontSize,
    lineHeight: TYPE.body.lineHeight,
  },
});
